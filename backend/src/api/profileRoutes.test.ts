import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { db } from '../db/index.js';
import { userProfile } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Feature: job-search-agent, Property 7: Profile Update Round Trip
describe('Property 7: Profile Update Round Trip', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(userProfile);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(userProfile);
  });

  it('should return equivalent profile after save and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // fullName
        fc.emailAddress(), // email
        fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }), // phone
        fc.option(fc.webUrl(), { nil: null }), // githubUrl
        fc.string({ minLength: 10, maxLength: 1000 }), // resumeText
        fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }), // bio
        async (fullName, email, phone, githubUrl, resumeText, bio) => {
          // Insert profile
          const [inserted] = await db.insert(userProfile).values({
            fullName,
            email,
            phone,
            githubUrl,
            resumeText,
            bio,
          }).returning();

          // Retrieve profile
          const retrieved = await db.select().from(userProfile).limit(1);

          // Verify round trip
          expect(retrieved).toHaveLength(1);
          expect(retrieved[0].fullName).toBe(fullName);
          expect(retrieved[0].email).toBe(email);
          expect(retrieved[0].phone).toBe(phone);
          expect(retrieved[0].githubUrl).toBe(githubUrl);
          expect(retrieved[0].resumeText).toBe(resumeText);
          expect(retrieved[0].bio).toBe(bio);

          // Clean up
          await db.delete(userProfile).where(eq(userProfile.id, inserted.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: job-search-agent, Property 8: Email Validation
describe('Property 8: Email Validation', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  it('should correctly identify valid email formats', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          // Valid emails should pass validation
          expect(isValidEmail(email)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify invalid email formats', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter(s => !s.includes('@')), // No @ symbol
          fc.constant('invalid@'), // Missing domain
          fc.constant('@invalid.com'), // Missing local part
          fc.constant('invalid@.com'), // Invalid domain
          fc.constant('invalid @test.com'), // Space in email
        ),
        (invalidEmail) => {
          // Invalid emails should fail validation
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate email structure: contains @ and valid domain', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          const hasAt = str.includes('@');
          const parts = str.split('@');
          const hasValidStructure = parts.length === 2 && 
                                   parts[0].length > 0 && 
                                   parts[1].includes('.') &&
                                   parts[1].split('.').every(p => p.length > 0);

          const validationResult = isValidEmail(str);

          // If email has valid structure, it should pass validation
          if (hasValidStructure) {
            expect(validationResult).toBe(true);
          }
          
          // If email doesn't have @, it should fail
          if (!hasAt) {
            expect(validationResult).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Unit tests for profile edge cases
describe('Profile Edge Cases', () => {
  beforeEach(async () => {
    await db.delete(userProfile);
  });

  afterEach(async () => {
    await db.delete(userProfile);
  });

  it('should handle resume text at exactly 50,000 characters', async () => {
    const resumeText = 'a'.repeat(50000);
    
    const [profile] = await db.insert(userProfile).values({
      fullName: 'Test User',
      email: 'test@example.com',
      resumeText,
    }).returning();

    expect(profile.resumeText).toHaveLength(50000);
    
    await db.delete(userProfile).where(eq(userProfile.id, profile.id));
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@domain.com',
    ];

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    invalidEmails.forEach(email => {
      expect(EMAIL_REGEX.test(email)).toBe(false);
    });
  });

  it('should accept valid email formats', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'name+tag@company.org',
      'user123@test-domain.com',
    ];

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    validEmails.forEach(email => {
      expect(EMAIL_REGEX.test(email)).toBe(true);
    });
  });
});
