import { db } from '../db/index.js';
import { jobs, type NewJob } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateCanonicalId } from '../utils/canonicalId.js';

/**
 * Check if a job already exists in the database
 * @param company - Company name
 * @param title - Job title
 * @returns true if job exists, false otherwise
 */
export async function checkDuplicate(company: string, title: string): Promise<boolean> {
  const canonicalId = generateCanonicalId(company, title);
  
  // Check by canonical ID logic (company + title combination)
  const existing = await db
    .select()
    .from(jobs)
    .where(eq(jobs.company, company))
    .where(eq(jobs.title, title))
    .limit(1);

  return existing.length > 0;
}

/**
 * Insert a new job into the database
 * @param job - Job data to insert
 * @returns Inserted job record
 */
export async function insertJob(job: NewJob) {
  const [inserted] = await db.insert(jobs).values(job).returning();
  return inserted;
}

/**
 * Get all jobs with optional filtering
 */
export async function getJobs(status?: string, minScore?: number) {
  let query = db.select().from(jobs);

  if (status) {
    query = query.where(eq(jobs.status, status as 'new' | 'rejected' | 'approved' | 'applied'));
  }

  const results = await query;

  // Filter by minScore if provided
  if (minScore !== undefined) {
    return results.filter(job => job.matchScore !== null && job.matchScore >= minScore);
  }

  return results;
}
