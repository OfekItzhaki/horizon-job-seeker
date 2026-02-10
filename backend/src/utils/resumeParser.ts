import OpenAI from 'openai';
import type { StructuredProfileData } from '../db/schema.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a resume parsing expert. Extract structured data from resumes and return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
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
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    data.workExperience.forEach(exp => {
      resumeText += `${exp.title} at ${exp.company}\n`;
      resumeText += `${exp.duration}\n\n`;
      
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        resumeText += 'Responsibilities:\n';
        exp.responsibilities.forEach(resp => {
          resumeText += `• ${resp}\n`;
        });
        resumeText += '\n';
      }
      
      if (exp.achievements && exp.achievements.length > 0) {
        resumeText += 'Achievements:\n';
        exp.achievements.forEach(ach => {
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
    data.education.forEach(edu => {
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
    data.certifications.forEach(cert => {
      resumeText += `• ${cert}\n`;
    });
    resumeText += '\n';
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    resumeText += '\nLANGUAGES\n\n';
    data.languages.forEach(lang => {
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
    data.workExperience.slice(0, 3).forEach(exp => {
      titles.add(exp.title);
    });
  }
  
  return Array.from(titles);
}
