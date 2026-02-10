import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fc from 'fast-check';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { jobs, type NewJob } from './schema.js';
import { sql } from 'drizzle-orm';

// Feature: job-search-agent, Property 16: Database Unique Constraint Enforcement
// Feature: job-search-agent, Property 17: Status ENUM Constraint Enforcement

/**
 * Database Constraints Property Tests
 * 
 * These tests verify that database constraints are properly enforced:
 * - Property 16: Unique constraint on job_url column
 * - Property 17: ENUM constraint on status column
 * 
 * SETUP REQUIREMENTS:
 * 1. Set DATABASE_URL environment variable to your test database
 * 2. Run migrations to create the schema: npm run db:migrate
 * 3. Ensure the database is accessible
 * 
 * Example DATABASE_URL:
 * - Local: postgresql://postgres:postgres@localhost:5432/job_search_agent_test
 * - Supabase: postgresql://user:password@db.xxx.supabase.co:5432/postgres
 */

describe('Database Constraints Property Tests', () => {
  let testDb: ReturnType<typeof drizzle>;
  let testClient: ReturnType<typeof postgres>;

  beforeAll(async () => {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Please set it to run database tests. ' +
        'Example: postgresql://postgres:postgres@localhost:5432/job_search_agent_test'
      );
    }

    // Use test database connection
    const connectionString = process.env.DATABASE_URL;
    testClient = postgres(connectionString);
    testDb = drizzle(testClient);

    // Verify connection by running a simple query
    try {
      await testClient`SELECT 1`;
    } catch (error) {
      throw new Error(
        `Failed to connect to database. Please check your DATABASE_URL. Error: ${error}`
      );
    }
  });

  afterAll(async () => {
    await testClient.end();
  });

  beforeEach(async () => {
    // Clean up jobs table before each test
    await testDb.delete(jobs);
  });

  describe('Property 16: Database Unique Constraint Enforcement', () => {
    test('attempting to insert duplicate job URLs should fail with unique constraint violation', async () => {
      // **Validates: Requirements 8.2**
      
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(), // Generate random URLs
          fc.string({ minLength: 1, maxLength: 100 }), // company
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.string({ minLength: 1, maxLength: 500 }), // description
          async (jobUrl, company, title, description) => {
            // First insertion should succeed
            const firstJob: NewJob = {
              jobUrl,
              company,
              title,
              description,
              status: 'new',
            };

            await testDb.insert(jobs).values(firstJob);

            // Second insertion with same URL should fail
            const duplicateJob: NewJob = {
              jobUrl, // Same URL
              company: company + ' Different',
              title: title + ' Different',
              description: description + ' Different',
              status: 'new',
            };

            // Expect unique constraint violation
            await expect(
              testDb.insert(jobs).values(duplicateJob)
            ).rejects.toThrow();

            // Verify only one record exists
            const allJobs = await testDb.select().from(jobs).where(sql`job_url = ${jobUrl}`);
            expect(allJobs).toHaveLength(1);
            expect(allJobs[0].company).toBe(company); // Original record unchanged
          }
        ),
        { numRuns: 100 }
      );
    });

    test('inserting jobs with unique URLs should succeed', async () => {
      // **Validates: Requirements 8.2**
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              jobUrl: fc.webUrl(),
              company: fc.string({ minLength: 1, maxLength: 100 }),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 500 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (jobsData) => {
            // Ensure all URLs are unique
            const uniqueJobs = Array.from(
              new Map(jobsData.map(job => [job.jobUrl, job])).values()
            );

            // All insertions should succeed
            for (const jobData of uniqueJobs) {
              const newJob: NewJob = {
                ...jobData,
                status: 'new',
              };
              await testDb.insert(jobs).values(newJob);
            }

            // Verify all jobs were inserted
            const allJobs = await testDb.select().from(jobs);
            expect(allJobs).toHaveLength(uniqueJobs.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 17: Status ENUM Constraint Enforcement', () => {
    test('attempting to set invalid status values should fail with constraint violation', async () => {
      // **Validates: Requirements 8.3**
      
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 100 }), // company
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.string({ minLength: 1, maxLength: 500 }), // description
          fc.string().filter(s => !['new', 'rejected', 'approved', 'applied'].includes(s)), // invalid status
          async (jobUrl, company, title, description, invalidStatus) => {
            // Attempt to insert job with invalid status
            const jobWithInvalidStatus = {
              jobUrl,
              company,
              title,
              description,
              status: invalidStatus as 'new' | 'approved' | 'dismissed' | 'applied', // Force invalid status
            };

            // Should fail with constraint violation
            await expect(
              testDb.insert(jobs).values(jobWithInvalidStatus)
            ).rejects.toThrow();

            // Verify no job was inserted
            const allJobs = await testDb.select().from(jobs);
            expect(allJobs).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all valid status values should be accepted', async () => {
      // **Validates: Requirements 8.3**
      
      const validStatuses = ['new', 'rejected', 'approved', 'applied'] as const;

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validStatuses),
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 100 }), // company
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.string({ minLength: 1, maxLength: 500 }), // description
          async (status, jobUrl, company, title, description) => {
            const newJob: NewJob = {
              jobUrl,
              company,
              title,
              description,
              status,
            };

            // Should succeed for all valid statuses
            await testDb.insert(jobs).values(newJob);

            // Verify job was inserted with correct status
            const insertedJobs = await testDb.select().from(jobs).where(sql`job_url = ${jobUrl}`);
            expect(insertedJobs).toHaveLength(1);
            expect(insertedJobs[0].status).toBe(status);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updating to invalid status should fail', async () => {
      // **Validates: Requirements 8.3**
      
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 100 }), // company
          fc.string({ minLength: 1, maxLength: 100 }), // title
          fc.string({ minLength: 1, maxLength: 500 }), // description
          fc.string().filter(s => !['new', 'rejected', 'approved', 'applied'].includes(s)), // invalid status
          async (jobUrl, company, title, description, invalidStatus) => {
            // First insert a valid job
            const newJob: NewJob = {
              jobUrl,
              company,
              title,
              description,
              status: 'new',
            };

            const [insertedJob] = await testDb.insert(jobs).values(newJob).returning();

            // Attempt to update to invalid status should fail
            await expect(
              testDb.update(jobs)
                .set({ status: invalidStatus as 'new' | 'approved' | 'dismissed' | 'applied' })
                .where(sql`id = ${insertedJob.id}`)
            ).rejects.toThrow();

            // Verify status remains unchanged
            const [unchangedJob] = await testDb.select().from(jobs).where(sql`id = ${insertedJob.id}`);
            expect(unchangedJob.status).toBe('new');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
