import { chromium, type Browser, type Page } from 'playwright';
import { db } from '../db/index.js';
import { jobs, userProfile } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { wsManager } from '../websocket/websocketServer.js';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AutomationSession {
  id: string;
  jobId: number;
  browser: Browser;
  page: Page;
  status: 'filling' | 'paused' | 'submitted' | 'cancelled' | 'error';
  createdAt: Date;
}

export interface FormField {
  type: 'text' | 'email' | 'tel' | 'file' | 'textarea';
  selector: string;
  label: string;
  confidence: number;
}

export class AutomationEngine {
  private sessions: Map<string, AutomationSession> = new Map();

  /**
   * Start a new automation session for a job
   */
  async startSession(jobId: number): Promise<AutomationSession> {
    let browser: Browser | null = null;
    let sessionId: string | null = null;

    try {
      // Get job details
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      if (job.status !== 'approved') {
        throw new Error(`Job must be in 'approved' status. Current status: ${job.status}`);
      }

      // Launch browser in non-headless mode
      console.log(`Starting automation session for job ${jobId}`);

      try {
        browser = await chromium.launch({
          headless: false, // User can see what's happening
          slowMo: 100, // Slow down actions for visibility
          timeout: 30000, // 30 second timeout for browser launch
        });
      } catch (error) {
        const errorMsg = `Failed to launch browser: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const page = await browser.newPage();

      // Create session
      sessionId = `auto-${jobId}-${Date.now()}`;
      const session: AutomationSession = {
        id: sessionId,
        jobId,
        browser,
        page,
        status: 'filling',
        createdAt: new Date(),
      };

      this.sessions.set(sessionId, session);

      // Broadcast automation started
      wsManager.broadcast({
        type: 'automation_started',
        automationId: sessionId,
        jobId,
        message: `Starting automation for ${job.company} - ${job.title}`,
        timestamp: new Date().toISOString(),
      });

      // Navigate to job URL with timeout and error handling
      console.log(`Navigating to ${job.jobUrl}`);
      try {
        await page.goto(job.jobUrl, {
          waitUntil: 'networkidle',
          timeout: 30000, // 30 second timeout
        });
      } catch (error) {
        const errorMsg = `Failed to navigate to job URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);

        // Broadcast error
        wsManager.broadcast({
          type: 'automation_error',
          automationId: sessionId,
          jobId,
          message: `Navigation failed: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        });

        // Clean up
        await browser.close();
        this.sessions.delete(sessionId);

        throw new Error(errorMsg);
      }

      return session;
    } catch (error) {
      console.error('Error starting automation session:', error);

      // Clean up browser if it was created
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser during cleanup:', closeError);
        }
      }

      // Remove session if it was created
      if (sessionId) {
        this.sessions.delete(sessionId);
      }

      throw error;
    }
  }

  /**
   * Identify form fields using LLM
   */
  async identifyFormFields(page: Page, sessionId?: string, jobId?: number): Promise<FormField[]> {
    try {
      console.log('Identifying form fields...');

      // Get page HTML
      const html = await page.content();

      // Truncate HTML if too long (LLM token limits)
      const truncatedHtml =
        html.length > 10000 ? html.substring(0, 10000) + '...[truncated]' : html;

      // Use LLM to identify form fields
      const prompt = `You are analyzing a job application form. Given the HTML structure, identify CSS selectors for the following fields:
- Full Name input
- Email input
- Phone number input
- Resume/CV file upload
- GitHub/Portfolio URL input

For each field found, provide:
1. The CSS selector (be specific, use id or name attributes if available)
2. Field type (text, email, tel, file, textarea)
3. Confidence score (0-1)

Return ONLY valid JSON in this exact format:
{
  "fields": [
    {
      "fieldType": "name",
      "type": "text",
      "selector": "input[name='full_name']",
      "confidence": 0.9
    }
  ]
}

HTML:
${truncatedHtml}`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a form field detection expert. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error('Empty response from LLM');
        }

        // Parse JSON response
        const parsed = JSON.parse(content);

        if (!parsed.fields || !Array.isArray(parsed.fields)) {
          throw new Error('Invalid response format from LLM - missing fields array');
        }

        const fields: FormField[] = parsed.fields.map(
          (f: { type: string; selector: string; fieldType: string; confidence: number }) => ({
            type: f.type,
            selector: f.selector,
            label: f.fieldType,
            confidence: f.confidence,
          })
        );

        console.log(`Identified ${fields.length} form fields`);
        return fields;
      } catch (error) {
        const errorMsg = `LLM field detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);

        // Broadcast error if session info provided
        if (sessionId && jobId) {
          wsManager.broadcast({
            type: 'automation_error',
            automationId: sessionId,
            jobId,
            message: `Failed to detect form fields. Please check the job application page manually.`,
            timestamp: new Date().toISOString(),
          });
        }

        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error identifying form fields:', error);
      throw error;
    }
  }

  /**
   * Fill a form field with a value
   */
  async fillField(page: Page, field: FormField, value: string | Buffer): Promise<void> {
    try {
      console.log(`Filling field: ${field.label} (${field.selector})`);

      if (field.type === 'file') {
        // Handle file upload
        if (typeof value === 'string') {
          throw new Error('File upload requires Buffer, not string');
        }

        // Save buffer to temp file and upload
        const fs = await import('fs/promises');
        const path = await import('path');
        const os = await import('os');

        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `resume-${Date.now()}.pdf`);
        await fs.writeFile(tempFile, value);

        await page.setInputFiles(field.selector, tempFile);

        // Clean up temp file
        await fs.unlink(tempFile);
      } else {
        // Handle text input
        if (typeof value !== 'string') {
          throw new Error('Text input requires string value');
        }

        await page.fill(field.selector, value);
      }

      console.log(`✓ Filled ${field.label}`);
    } catch (error) {
      console.error(`Error filling field ${field.label}:`, error);
      throw error;
    }
  }

  /**
   * Fill all form fields with user profile data
   */
  async fillFormWithProfile(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // Get user profile
      const [profile] = await db.select().from(userProfile).limit(1);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Identify form fields
      const fields = await this.identifyFormFields(session.page);

      // Fill each field
      for (const field of fields) {
        try {
          let value: string | Buffer | null = null;

          switch (field.label.toLowerCase()) {
            case 'name':
            case 'full_name':
            case 'fullname':
              value = profile.fullName;
              break;
            case 'email':
              value = profile.email;
              break;
            case 'phone':
            case 'phone_number':
              value = profile.phone || '';
              break;
            case 'github':
            case 'portfolio':
            case 'github_url':
              value = profile.githubUrl || '';
              break;
            case 'resume':
            case 'cv':
              // Generate PDF from resume text
              value = await this.generateResumePdf(profile.resumeText);
              break;
          }

          if (value) {
            await this.fillField(session.page, field, value);
          }
        } catch (error) {
          console.warn(`Failed to fill field ${field.label}, continuing...`, error);
          // Continue with other fields even if one fails
        }
      }

      console.log('✓ All fields filled');

      // Broadcast filling complete
      wsManager.broadcast({
        type: 'automation_filling',
        automationId: sessionId,
        jobId: session.jobId,
        message: 'Form fields filled successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      session.status = 'error';

      // Broadcast error
      wsManager.broadcast({
        type: 'automation_error',
        automationId: sessionId,
        jobId: session.jobId,
        message: `Error filling form: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Generate PDF from resume text
   */
  private async generateResumePdf(resumeText: string): Promise<Buffer> {
    // Simple PDF generation using a library
    // For now, return a placeholder - in production, use pdfkit or puppeteer
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add resume content
      doc.fontSize(12);
      doc.text(resumeText, {
        width: 500,
        align: 'left',
      });

      doc.end();
    });
  }

  /**
   * Pause at submit button without clicking
   */
  async pauseAtSubmit(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      console.log('Locating submit button...');

      // Common submit button selectors
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
        'button:has-text("Send")',
      ];

      let submitButton: any = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await session.page.$(selector);
          if (submitButton) {
            console.log(`Found submit button: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      // Highlight the submit button for user visibility
      await session.page.evaluate(
        (selector: string) => {
          const doc = (globalThis as any).document;
          if (!doc) return;
          const button = doc.querySelector(selector);
          if (button && button.style) {
            button.style.border = '3px solid red';
            button.style.boxShadow = '0 0 10px red';
          }
        },
        submitSelectors.find((_s) => submitButton) || submitSelectors[0]
      );

      // Update session status to paused
      session.status = 'paused';
      console.log('✓ Paused at submit button - waiting for user confirmation');

      // Broadcast paused status
      wsManager.broadcast({
        type: 'automation_paused',
        automationId: sessionId,
        jobId: session.jobId,
        message: 'Ready to submit - waiting for confirmation',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      session.status = 'error';

      // Broadcast error
      wsManager.broadcast({
        type: 'automation_error',
        automationId: sessionId,
        jobId: session.jobId,
        message: `Error pausing at submit: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Confirm submission and click submit button
   */
  async confirmSubmission(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'paused') {
      throw new Error(
        `Session must be paused to confirm submission. Current status: ${session.status}`
      );
    }

    try {
      console.log('Confirming submission...');

      // Find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
        'button:has-text("Send")',
      ];

      let clicked = false;
      for (const selector of submitSelectors) {
        try {
          const button = await session.page.$(selector);
          if (button) {
            await button.click();
            clicked = true;
            console.log(`✓ Clicked submit button: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (!clicked) {
        throw new Error('Failed to click submit button');
      }

      // Update job status to 'applied'
      await db.update(jobs).set({ status: 'applied' }).where(eq(jobs.id, session.jobId));

      session.status = 'submitted';
      console.log('✓ Application submitted successfully');

      // Broadcast submission success
      wsManager.broadcast({
        type: 'automation_submitted',
        automationId: sessionId,
        jobId: session.jobId,
        message: 'Application submitted successfully',
        timestamp: new Date().toISOString(),
      });

      // Wait a bit for confirmation page to load
      await session.page.waitForTimeout(3000);

      // Close browser
      await this.cancelSession(sessionId);
    } catch (error) {
      session.status = 'error';

      // Broadcast error
      wsManager.broadcast({
        type: 'automation_error',
        automationId: sessionId,
        jobId: session.jobId,
        message: `Error confirming submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Cancel automation session
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      console.log(`Cancelling session ${sessionId}`);

      await session.browser.close();
      session.status = 'cancelled';

      // Broadcast cancellation
      wsManager.broadcast({
        type: 'automation_cancelled',
        automationId: sessionId,
        jobId: session.jobId,
        message: 'Automation cancelled',
        timestamp: new Date().toISOString(),
      });

      this.sessions.delete(sessionId);
      console.log('✓ Session cancelled');
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Kill all active sessions (emergency stop)
   */
  async killAllSessions(): Promise<number> {
    console.log('🔴 KILL SWITCH ACTIVATED - Terminating all sessions');
    console.log(`[LOG] Kill switch activated at ${new Date().toISOString()}`);

    const sessionIds = Array.from(this.sessions.keys());
    let terminated = 0;

    for (const sessionId of sessionIds) {
      try {
        await this.cancelSession(sessionId);
        terminated++;
      } catch (error) {
        console.error(`Failed to terminate session ${sessionId}:`, error);
      }
    }

    console.log(`✓ Terminated ${terminated} sessions`);
    return terminated;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AutomationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): AutomationSession[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine();
