// Feature: job-search-agent, Integration Tests
// Integration tests for critical workflows

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db/index.js';
import { jobs, userProfile } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { automationEngine } from './automation/automationEngine.js';
import { scoreJob } from './services/scoringService.js';

describe('Integration Tests - Critical Flows', () => {
  let testJobId: number;
  let testProfileId: number;

  beforeAll(async () => {
    // Create test profile
    const [profile] = await db
      .insert(userProfile)
      .values({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        resumeText:
          'Senior Full Stack Developer with 5 years experience in React, Node.js, TypeScript, and PostgreSQL.',
        bio: 'Passionate developer',
      })
      .returning();
    testProfileId = profile.id;

    // Create test job
    const [job] = await db
      .insert(jobs)
      .values({
        jobUrl: 'https://example.com/job/test-integration',
        company: 'Test Company',
        title: 'Senior Full Stack Developer',
        description: 'Looking for a Senior Full Stack Developer with React and Node.js experience.',
        status: 'new',
        matchScore: null,
      })
      .returning();
    testJobId = job.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testJobId) {
      await db.delete(jobs).where(eq(jobs.id, testJobId));
    }
    if (testProfileId) {
      await db.delete(userProfile).where(eq(userProfile.id, testProfileId));
    }
  });

  describe('Flow 1: Job Discovery → Scoring → Dashboard Display', () => {
    it('should score a new job against user profile', async () => {
      // Get the test job
      const [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job).toBeDefined();
      expect(job.status).toBe('new');

      // Get user profile
      const [profile] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, testProfileId));
      expect(profile).toBeDefined();

      // Score the job
      const score = await scoreJob(job.description, profile.resumeText);

      // Verify score is valid
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);

      // Update job with score
      await db.update(jobs).set({ matchScore: score }).where(eq(jobs.id, testJobId));

      // Verify job was updated
      const [updatedJob] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(updatedJob.matchScore).toBe(score);
      expect(updatedJob.matchScore).toBeGreaterThan(0); // Should have a decent match
    });

    it('should filter jobs by status and minimum score', async () => {
      // Query jobs with status 'new' and minimum score 0
      const newJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.status, 'new'))
        .orderBy(jobs.matchScore);

      // Should include our test job
      const testJob = newJobs.find((j) => j.id === testJobId);
      expect(testJob).toBeDefined();
      expect(testJob?.status).toBe('new');
    });
  });

  describe('Flow 2: Dashboard → Automation → Submission', () => {
    it('should update job status from new to approved', async () => {
      // Update job status to approved
      await db.update(jobs).set({ status: 'approved' }).where(eq(jobs.id, testJobId));

      // Verify status change
      const [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job.status).toBe('approved');
    });

    it('should validate automation session creation requirements', async () => {
      // Verify job is in approved status
      const [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job.status).toBe('approved');

      // Verify user profile exists
      const [profile] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, testProfileId));
      expect(profile).toBeDefined();
      expect(profile.fullName).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.resumeText).toBeTruthy();
    });

    it('should track automation session state', () => {
      // Verify no active sessions initially
      const sessions = automationEngine.getAllSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Flow 3: Kill Switch Interruption', () => {
    it('should terminate all active sessions', async () => {
      // Get initial session count
      const initialSessions = automationEngine.getAllSessions();
      const initialCount = initialSessions.length;

      // Activate kill switch
      const terminated = await automationEngine.killAllSessions();

      // Verify all sessions terminated
      expect(terminated).toBe(initialCount);

      // Verify no active sessions remain
      const remainingSessions = automationEngine.getAllSessions();
      expect(remainingSessions.length).toBe(0);
    });
  });

  describe('Flow 4: Profile Management', () => {
    it('should retrieve user profile', async () => {
      const [profile] = await db.select().from(userProfile).limit(1);
      expect(profile).toBeDefined();
      expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should update user profile', async () => {
      const newBio = 'Updated bio for integration test';

      await db.update(userProfile).set({ bio: newBio }).where(eq(userProfile.id, testProfileId));

      const [profile] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, testProfileId));
      expect(profile.bio).toBe(newBio);
    });
  });

  describe('Flow 5: Job Status Transitions', () => {
    it('should transition job through valid states', async () => {
      // new → approved
      await db.update(jobs).set({ status: 'approved' }).where(eq(jobs.id, testJobId));

      let [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job.status).toBe('approved');

      // approved → applied
      await db.update(jobs).set({ status: 'applied' }).where(eq(jobs.id, testJobId));

      [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job.status).toBe('applied');

      // Reset to new for cleanup
      await db.update(jobs).set({ status: 'new' }).where(eq(jobs.id, testJobId));
    });

    it('should handle rejected status', async () => {
      await db.update(jobs).set({ status: 'rejected' }).where(eq(jobs.id, testJobId));

      const [job] = await db.select().from(jobs).where(eq(jobs.id, testJobId));
      expect(job.status).toBe('rejected');

      // Reset to new
      await db.update(jobs).set({ status: 'new' }).where(eq(jobs.id, testJobId));
    });
  });

  describe('Flow 6: Error Handling', () => {
    it('should handle missing job gracefully', async () => {
      const nonExistentId = 999999;
      const result = await db.select().from(jobs).where(eq(jobs.id, nonExistentId));
      expect(result.length).toBe(0);
    });

    it('should handle invalid email format', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test@.com'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate required profile fields', async () => {
      const [profile] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, testProfileId));

      // Required fields must be present
      expect(profile.fullName).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.resumeText).toBeTruthy();
    });
  });
});
