#!/usr/bin/env tsx
/**
 * Remove Test Jobs Script
 * This script removes test jobs from the database
 */

import { db } from './src/db/index.js';
import { jobs } from './src/db/schema.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function removeTestJobs() {
  console.log('Removing test jobs from database...\n');

  try {
    // Get all jobs with test URLs
    const testJobs = await db
      .select()
      .from(jobs)
      .where(sql`job_url LIKE '%test-job%'`);

    if (testJobs.length === 0) {
      console.log('No test jobs found in database.');
      process.exit(0);
    }

    console.log(`Found ${testJobs.length} test jobs:\n`);
    testJobs.forEach(job => {
      console.log(`- ${job.company} - ${job.title}`);
    });

    console.log('\nRemoving test jobs...');

    // Delete test jobs
    await db
      .delete(jobs)
      .where(sql`job_url LIKE '%test-job%'`);

    console.log(`\n✅ Successfully removed ${testJobs.length} test jobs!`);
    console.log('\nYou can now:');
    console.log('1. Refresh your frontend to see only real jobs');
    console.log('2. Run the worker to get more real jobs: npm run worker');
  } catch (error) {
    console.error('Error removing test jobs:', error);
    process.exit(1);
  }

  process.exit(0);
}

removeTestJobs();
