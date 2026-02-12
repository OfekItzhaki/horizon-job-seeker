import { Router } from 'express';
import { automationEngine } from '../automation/automationEngine.js';

const router = Router();

/**
 * POST /api/automation/start
 * Start automation for a job
 * Body: { jobId: number }
 */
router.post('/start', async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId || typeof jobId !== 'number') {
      return res.status(400).json({
        error: {
          code: 'INVALID_JOB_ID',
          message: 'jobId is required and must be a number',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Start automation session
    const session = await automationEngine.startSession(jobId);

    // Fill form with profile data
    await automationEngine.fillFormWithProfile(session.id);

    // Pause at submit button
    await automationEngine.pauseAtSubmit(session.id);

    res.json({
      automationId: session.id,
      jobId: session.jobId,
      status: session.status,
      message: 'Automation paused at submit button. Please review and confirm.',
    });
    return;
  } catch (error) {
    console.error('Error starting automation:', error);
    res.status(500).json({
      error: {
        code: 'AUTOMATION_START_ERROR',
        message: 'Failed to start automation',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/confirm
 * Confirm submission and click submit button
 * Body: { automationId: string }
 */
router.post('/confirm', async (req, res) => {
  try {
    const { automationId } = req.body;

    if (!automationId || typeof automationId !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_AUTOMATION_ID',
          message: 'automationId is required and must be a string',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify session exists
    const session = automationEngine.getSession(automationId);
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Automation session ${automationId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get user profile to save submission snapshot
    const { db } = await import('../db/index.js');
    const { userProfile, applicationSubmissions, jobs } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');

    const [profile] = await db.select().from(userProfile).limit(1);

    if (profile) {
      // Save submission snapshot
      await db.insert(applicationSubmissions).values({
        jobId: session.jobId,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
        location: profile.location,
        resumeText: profile.resumeText,
        bio: profile.bio,
        automationId: automationId,
      });

      // Update job status to applied
      await db.update(jobs).set({ status: 'applied' }).where(eq(jobs.id, session.jobId));
    }

    // Confirm submission
    await automationEngine.confirmSubmission(automationId);

    res.json({
      success: true,
      automationId,
      message: 'Application submitted successfully',
    });
    return;
  } catch (error) {
    console.error('Error confirming submission:', error);
    res.status(500).json({
      error: {
        code: 'SUBMISSION_ERROR',
        message: 'Failed to confirm submission',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/cancel
 * Cancel automation session
 * Body: { automationId: string }
 */
router.post('/cancel', async (req, res) => {
  try {
    const { automationId } = req.body;

    if (!automationId || typeof automationId !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_AUTOMATION_ID',
          message: 'automationId is required and must be a string',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify session exists
    const session = automationEngine.getSession(automationId);
    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Automation session ${automationId} not found`,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Cancel session
    await automationEngine.cancelSession(automationId);

    res.json({
      success: true,
      automationId,
      message: 'Automation cancelled successfully',
    });
    return;
  } catch (error) {
    console.error('Error cancelling automation:', error);
    res.status(500).json({
      error: {
        code: 'CANCEL_ERROR',
        message: 'Failed to cancel automation',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
});

/**
 * POST /api/automation/kill
 * Emergency kill switch - terminate all active sessions
 */
router.post('/kill', async (_req, res) => {
  try {
    console.log('🔴 Kill switch activated via API');

    const terminated = await automationEngine.killAllSessions();

    res.json({
      success: true,
      terminated,
      message: `Kill switch activated. Terminated ${terminated} session(s).`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error activating kill switch:', error);
    res.status(500).json({
      error: {
        code: 'KILL_SWITCH_ERROR',
        message: 'Failed to activate kill switch',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/automation/scrape
 * Trigger a manual job scraping run (for cron jobs)
 * This endpoint is designed to be called by external cron services
 */
router.post('/scrape', async (_req, res) => {
  try {
    console.log('📡 Manual scrape job triggered via API');

    // Import BackgroundWorker class and create instance
    const { BackgroundWorker } = await import('../worker/backgroundWorker.js');
    const worker = new BackgroundWorker();

    // Trigger a single scrape run
    const stats = await worker.runScrapeJob();

    res.json({
      success: true,
      message: 'Job scraping completed successfully',
      newJobsCount: stats.newJobsCount,
      duplicatesCount: stats.duplicatesCount,
      totalScraped: stats.totalScraped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running scrape job:', error);
    res.status(500).json({
      error: {
        code: 'SCRAPE_JOB_ERROR',
        message: 'Failed to run scrape job',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/automation/sessions
 * Get all active automation sessions
 */
router.get('/sessions', (_req, res) => {
  try {
    const sessions = automationEngine.getAllSessions();

    const sessionData = sessions.map((s) => ({
      id: s.id,
      jobId: s.jobId,
      status: s.status,
      createdAt: s.createdAt,
    }));

    res.json({
      sessions: sessionData,
      count: sessionData.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.json({
      error: {
        code: 'FETCH_SESSIONS_ERROR',
        message: 'Failed to fetch automation sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/automation/scrapers
 * Get scraper configuration and status
 */
router.get('/scrapers', async (_req, res) => {
  try {
    const { getScraperStats, scraperConfig } = await import('../config/scraperConfig.js');
    const stats = getScraperStats();

    res.json({
      stats,
      scrapers: scraperConfig.map((s) => ({
        id: s.id,
        name: s.name,
        enabled: s.enabled,
        priority: s.priority,
        maxJobs: s.maxJobs,
        description: s.description,
        requiresAuth: s.requiresAuth,
        authEnvVars: s.authEnvVars || [],
      })),
    });
  } catch (error) {
    console.error('Error fetching scraper config:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_SCRAPERS_ERROR',
        message: 'Failed to fetch scraper configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
