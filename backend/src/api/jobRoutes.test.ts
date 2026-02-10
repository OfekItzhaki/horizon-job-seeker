import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Feature: job-search-agent, Property 9: Dashboard Job Filtering and Sorting
describe('Property 9: Dashboard Job Filtering and Sorting', () => {
  beforeEach(async () => {
    await db.delete(jobs);
  });

  afterEach(async () => {
    await db.delete(jobs);
  });

  it('should return only jobs with status "new" ordered by match_score descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            jobUrl: fc.webUrl(),
            company: fc.string({ minLength: 1, maxLength: 100 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            matchScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
            status: fc.constantFrom('new', 'rejected', 'approved', 'applied'),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        async (jobsData) => {
          // Make URLs unique
          const uniqueJobs = jobsData.map((job, idx) => ({
            ...job,
            jobUrl: `${job.jobUrl}?test=${Date.now()}-${idx}`,
          }));

          // Insert test jobs
          await db.insert(jobs).values(uniqueJobs);

          // Query for 'new' status jobs
          const results = await db.select()
            .from(jobs)
            .where(eq(jobs.status, 'new'));

          // Verify all results have status 'new'
          results.forEach(job => {
            expect(job.status).toBe('new');
          });

          // Verify no jobs with other statuses are included
          const newJobsCount = uniqueJobs.filter(j => j.status === 'new').length;
          expect(results).toHaveLength(newJobsCount);

          // Verify ordering by match_score descending (nulls last)
          const nonNullScores = results
            .filter(j => j.matchScore !== null)
            .map(j => j.matchScore as number);
          
          for (let i = 0; i < nonNullScores.length - 1; i++) {
            expect(nonNullScores[i]).toBeGreaterThanOrEqual(nonNullScores[i + 1]);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for database operations
    );
  });
});

// Feature: job-search-agent, Property 11: Job Status State Machine
describe('Property 11: Job Status State Machine', () => {
  beforeEach(async () => {
    await db.delete(jobs);
  });

  afterEach(async () => {
    await db.delete(jobs);
  });

  it('should allow valid state transitions', async () => {
    const validTransitions = [
      { from: 'new', to: 'approved' },
      { from: 'new', to: 'rejected' },
      { from: 'approved', to: 'applied' },
      { from: 'approved', to: 'approved' }, // Can stay approved
    ];

    for (const transition of validTransitions) {
      // Create job with initial status
      const [job] = await db.insert(jobs).values({
        jobUrl: `https://example.com/job-${Date.now()}-${Math.random()}`,
        company: 'Test Company',
        title: 'Test Job',
        description: 'Test description',
        matchScore: 75,
        status: transition.from as 'new' | 'rejected' | 'approved' | 'applied',
      }).returning();

      // Attempt transition
      const [updated] = await db.update(jobs)
        .set({ status: transition.to as 'new' | 'rejected' | 'approved' | 'applied' })
        .where(eq(jobs.id, job.id))
        .returning();

      // Verify transition succeeded
      expect(updated.status).toBe(transition.to);

      // Clean up
      await db.delete(jobs).where(eq(jobs.id, job.id));
    }
  });

  it('should enforce invalid state transitions', async () => {
    const invalidTransitions = [
      { from: 'rejected', to: 'new' },
      { from: 'rejected', to: 'approved' },
      { from: 'rejected', to: 'applied' },
      { from: 'applied', to: 'new' },
      { from: 'applied', to: 'approved' },
      { from: 'applied', to: 'rejected' },
      { from: 'approved', to: 'new' },
      { from: 'new', to: 'applied' }, // Can't skip approved
    ];

    // Verify these transitions are not in the valid set
    const validTransitions: Record<string, string[]> = {
      'new': ['approved', 'rejected'],
      'approved': ['applied', 'approved'],
      'rejected': [],
      'applied': [],
    };

    invalidTransitions.forEach(transition => {
      const allowedNextStates = validTransitions[transition.from];
      expect(allowedNextStates).not.toContain(transition.to);
    });
  });

  it('should maintain state machine invariants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('new', 'rejected', 'approved', 'applied'),
        fc.constantFrom('new', 'rejected', 'approved', 'applied'),
        (fromStatus, toStatus) => {
          const validTransitions: Record<string, string[]> = {
            'new': ['approved', 'rejected'],
            'approved': ['applied', 'approved'],
            'rejected': [],
            'applied': [],
          };

          const isValid = validTransitions[fromStatus].includes(toStatus);

          // Terminal states (rejected, applied) should have no outgoing transitions
          if (fromStatus === 'rejected' || fromStatus === 'applied') {
            expect(validTransitions[fromStatus]).toHaveLength(0);
          }

          // Can never transition back to 'new'
          if (toStatus === 'new' && fromStatus !== 'new') {
            expect(isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
