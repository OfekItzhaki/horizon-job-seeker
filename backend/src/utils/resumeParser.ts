import OpenAI from 'openai';
import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse-fork';
import mammoth from 'mammoth';
import type { StructuredProfileData } from '../db/schema.js';

// Lazy initialization to ensure env vars are loaded
let openai: OpenAI | null = null;
let groq: Groq | null = null;

// Determine which AI provider to use
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // Default to Groq (free!)

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function getGroq(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        'GROQ_API_KEY environment variable is not set. Get a free key at https://console.groq.com'
      );
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

/**
 * Parse resume file (PDF or DOCX) and extract text
 */
export async function parseResumeFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ resumeText: string; structuredData: StructuredProfileData }> {
  let resumeText = '';

  try {
    if (mimeType === 'application/pdf') {
      // Parse PDF
      console.log('Parsing PDF file...');
      const pdfData = await pdfParse(fileBuffer);
      resumeText = pdfData.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      // Parse DOCX
      console.log('Parsing DOCX file...');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      resumeText = result.value;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('No text extracted from file');
    }

    console.log(`Extracted ${resumeText.length} characters from file`);

    // Parse the extracted text
    const structuredData = await parseResumeText(resumeText);

    return {
      resumeText,
      structuredData,
    };
  } catch (error) {
    console.error('Error parsing resume file:', error);
    throw new Error(
      `Failed to parse resume file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parse resume text and extract structured data using GPT-4o-mini
 */
export async function parseResumeText(resumeText: string): Promise<StructuredProfileData> {
  try {
    const prompt = `You are a resume parser. Extract structured information from the following resume text.

Return ONLY valid JSON in this exact format:
{
  "workExperience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "responsibilities": ["Responsibility 1", "Responsibility 2"],
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2020",
      "details": "GPA: 3.8/4.0"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "languages": ["English (Native)", "Spanish (Fluent)"]
}

Resume Text:
${resumeText}`;

    let content: string | null = null;

    // Use Groq (free and fast!) or OpenAI based on configuration
    if (AI_PROVIDER === 'groq') {
      console.log('Using Groq AI for resume parsing (free tier)');
      const groqClient = getGroq();
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Fast and accurate
        messages: [
          {
            role: 'system',
            content:
              'You are a resume parsing expert. Extract structured data from resumes and return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });
      content = response.choices[0]?.message?.content?.trim() || null;
    } else {
      console.log('Using OpenAI for resume parsing');
      const openaiClient = getOpenAI();
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a resume parsing expert. Extract structured data from resumes and return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });
      content = response.choices[0]?.message?.content?.trim() || null;
    }
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    // Clean up markdown code blocks if present (Groq sometimes wraps JSON in ```)
    let cleanedContent = content;
    if (content.startsWith('```')) {
      // Remove markdown code blocks
      cleanedContent = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
    }

    // Parse JSON response
    const parsed = JSON.parse(cleanedContent);

    // Validate structure
    if (!parsed.workExperience || !Array.isArray(parsed.workExperience)) {
      throw new Error('Invalid response format - missing workExperience array');
    }

    if (!parsed.skills || !Array.isArray(parsed.skills)) {
      throw new Error('Invalid response format - missing skills array');
    }

    if (!parsed.education || !Array.isArray(parsed.education)) {
      throw new Error('Invalid response format - missing education array');
    }

    return parsed as StructuredProfileData;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(
      `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert structured profile data back to resume text
 */
export function structuredDataToResumeText(data: StructuredProfileData): string {
  let resumeText = '';

  // Work Experience
  if (data.workExperience && data.workExperience.length > 0) {
    resumeText += 'WORK EXPERIENCE\n\n';
    data.workExperience.forEach((exp) => {
      resumeText += `${exp.title} at ${exp.company}\n`;
      resumeText += `${exp.duration}\n\n`;

      if (exp.responsibilities && exp.responsibilities.length > 0) {
        resumeText += 'Responsibilities:\n';
        exp.responsibilities.forEach((resp) => {
          resumeText += `• ${resp}\n`;
        });
        resumeText += '\n';
      }

      if (exp.achievements && exp.achievements.length > 0) {
        resumeText += 'Achievements:\n';
        exp.achievements.forEach((ach) => {
          resumeText += `• ${ach}\n`;
        });
        resumeText += '\n';
      }
    });
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    resumeText += '\nSKILLS\n\n';
    resumeText += data.skills.join(', ') + '\n';
  }

  // Education
  if (data.education && data.education.length > 0) {
    resumeText += '\nEDUCATION\n\n';
    data.education.forEach((edu) => {
      resumeText += `${edu.degree}\n`;
      resumeText += `${edu.institution}, ${edu.year}\n`;
      if (edu.details) {
        resumeText += `${edu.details}\n`;
      }
      resumeText += '\n';
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    resumeText += '\nCERTIFICATIONS\n\n';
    data.certifications.forEach((cert) => {
      resumeText += `• ${cert}\n`;
    });
    resumeText += '\n';
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    resumeText += '\nLANGUAGES\n\n';
    data.languages.forEach((lang) => {
      resumeText += `• ${lang}\n`;
    });
  }

  return resumeText.trim();
}

/**
 * Extract desired job titles from structured data
 */
export function extractDesiredJobTitles(data: StructuredProfileData): string[] {
  const titles: Set<string> = new Set();

  // Get most recent job titles
  if (data.workExperience && data.workExperience.length > 0) {
    // Take the 3 most recent job titles
    data.workExperience.slice(0, 3).forEach((exp) => {
      titles.add(exp.title);
    });
  }

  return Array.from(titles);
}
