import { Router } from 'express';
import { db } from '../db/index.js';
import { userProfile, type StructuredProfileData } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { parseResumeText, structuredDataToResumeText, extractDesiredJobTitles } from '../utils/resumeParser.js';

const router = Router();

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * GET /api/profile
 * Retrieve user profile
 */
router.get('/', async (req, res) => {
  try {
    const profiles = await db.select().from(userProfile).limit(1);
    
    if (profiles.length === 0) {
      return res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found. Please create a profile first.',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse structured data if it exists
    const profile = profiles[0];
    const responseProfile = {
      ...profile,
      structuredData: profile.structuredData ? JSON.parse(profile.structuredData) : null,
    };

    res.json(responseProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve user profile',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 */
router.put('/', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      githubUrl, 
      linkedinUrl,
      location,
      resumeText, 
      bio,
      structuredData,
      desiredJobTitles,
      desiredLocations,
      parseResume // Flag to trigger resume parsing
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !resumeText) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: fullName, email, and resumeText are required',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate resume text length (max 50,000 characters)
    if (resumeText.length > 50000) {
      return res.status(400).json({
        error: {
          code: 'RESUME_TOO_LONG',
          message: 'Resume text exceeds maximum length of 50,000 characters',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse resume if requested
    let parsedStructuredData: StructuredProfileData | null = null;
    let autoDesiredJobTitles: string[] = [];
    
    if (parseResume && resumeText) {
      try {
        console.log('Parsing resume text...');
        parsedStructuredData = await parseResumeText(resumeText);
        autoDesiredJobTitles = extractDesiredJobTitles(parsedStructuredData);
        console.log('Resume parsed successfully');
      } catch (error) {
        console.error('Error parsing resume:', error);
        // Continue without parsed data - don't fail the request
      }
    }

    // Use provided structured data or parsed data
    const finalStructuredData = structuredData || parsedStructuredData;
    const finalDesiredJobTitles = desiredJobTitles || autoDesiredJobTitles.join(', ');

    // Check if profile exists
    const existing = await db.select().from(userProfile).limit(1);

    let profile;
    if (existing.length === 0) {
      // Create new profile
      [profile] = await db.insert(userProfile).values({
        fullName,
        email,
        phone: phone || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        location: location || null,
        resumeText,
        bio: bio || null,
        structuredData: finalStructuredData ? JSON.stringify(finalStructuredData) : null,
        desiredJobTitles: finalDesiredJobTitles || null,
        desiredLocations: desiredLocations || null,
        updatedAt: new Date(),
      }).returning();
    } else {
      // Update existing profile
      [profile] = await db.update(userProfile)
        .set({
          fullName,
          email,
          phone: phone || null,
          githubUrl: githubUrl || null,
          linkedinUrl: linkedinUrl || null,
          location: location || null,
          resumeText,
          bio: bio || null,
          structuredData: finalStructuredData ? JSON.stringify(finalStructuredData) : null,
          desiredJobTitles: finalDesiredJobTitles || null,
          desiredLocations: desiredLocations || null,
          updatedAt: new Date(),
        })
        .where(eq(userProfile.id, existing[0].id))
        .returning();
    }

    // Parse structured data for response
    const responseProfile = {
      ...profile,
      structuredData: profile.structuredData ? JSON.parse(profile.structuredData) : null,
    };

    res.json(responseProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update user profile',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/profile/parse-resume
 * Parse resume text and return structured data
 */
router.post('/parse-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: resumeText',
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log('Parsing resume...');
    const structuredData = await parseResumeText(resumeText);
    const desiredJobTitles = extractDesiredJobTitles(structuredData);

    res.json({
      structuredData,
      desiredJobTitles,
      resumeText: structuredDataToResumeText(structuredData),
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse resume',
        details: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
