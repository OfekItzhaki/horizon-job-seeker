import { Router } from 'express';
import { db } from '../db/index.js';
import { userProfile } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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

    res.json(profiles[0]);
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
    const { fullName, email, phone, githubUrl, resumeText, bio } = req.body;

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
        resumeText,
        bio: bio || null,
      }).returning();
    } else {
      // Update existing profile
      [profile] = await db.update(userProfile)
        .set({
          fullName,
          email,
          phone: phone || null,
          githubUrl: githubUrl || null,
          resumeText,
          bio: bio || null,
        })
        .where(eq(userProfile.id, existing[0].id))
        .returning();
    }

    res.json(profile);
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

export default router;
