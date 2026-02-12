/**
 * Cleanup utility to remove old jobs from the database
 * Keeps only jobs from the last 7 days
 */

import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import { logger } from './logger.js';

/**
 * Remove jobs older than the specified number of days
 * @param daysToKeep - Number of days to keep (default: 7)
 */
export async function cleanupOldJobs(daysToKeep: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    logger.info(
      `Cleaning up jobs older than ${daysToKeep} days (before ${cutoffDate.toISOString()})`
    );

    // Delete jobs where both postedAt and createdAt are older than cutoff
    // Keep jobs that don't have postedAt but have recent createdAt
    const result = await db
      .delete(jobs)
      .where(
        sql`(${jobs.postedAt} IS NOT NULL AND ${jobs.postedAt} < ${cutoffDate}) 
            OR (${jobs.postedAt} IS NULL AND ${jobs.createdAt} < ${cutoffDate})`
      )
      .returning({ id: jobs.id });

    const deletedCount = result.length;
    logger.info(`Cleaned up ${deletedCount} old jobs`);

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old jobs', error);
    throw error;
  }
}

/**
 * Get count of jobs older than specified days
 */
export async function getOldJobsCount(daysToKeep: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        sql`(${jobs.postedAt} IS NOT NULL AND ${jobs.postedAt} < ${cutoffDate}) 
            OR (${jobs.postedAt} IS NULL AND ${jobs.createdAt} < ${cutoffDate})`
      );

    return Number(result[0]?.count || 0);
  } catch (error) {
    logger.error('Error getting old jobs count', error);
    return 0;
  }
}
