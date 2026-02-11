#!/usr/bin/env tsx
/**
 * Database Setup Verification Script
 *
 * This script verifies that the database is properly configured for running tests.
 * Run with: npx tsx src/db/verify-setup.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifySetup() {
  console.log('🔍 Verifying database setup...\n');

  // Step 1: Check DATABASE_URL
  console.log('1. Checking DATABASE_URL environment variable...');
  if (!process.env.DATABASE_URL) {
    console.error('   ✗ DATABASE_URL is not set');
    console.error('   Please create a .env file with DATABASE_URL');
    console.error('   Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname\n');
    process.exit(1);
  }
  console.log('   ✓ DATABASE_URL is set\n');

  // Step 2: Test connection
  console.log('2. Testing database connection...');
  let sql: ReturnType<typeof postgres>;
  try {
    sql = postgres(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    console.log('   ✓ Database connection successful\n');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('   ✗ Database connection failed');
    console.error(`   Error: ${errorMessage}`);
    console.error('   Please check your DATABASE_URL and ensure the database is accessible\n');
    process.exit(1);
  }

  // Step 3: Check if tables exist
  console.log('3. Checking if required tables exist...');
  drizzle(sql);

  try {
    // Try to query the jobs table
    await sql`SELECT COUNT(*) FROM jobs`;
    console.log('   ✓ jobs table exists');
  } catch (error: unknown) {
    console.error('   ✗ jobs table does not exist');
    console.error('   Please run migrations: npm run db:generate && npm run db:migrate\n');
    await sql.end();
    process.exit(1);
  }

  try {
    // Try to query the user_profile table
    await sql`SELECT COUNT(*) FROM user_profile`;
    console.log('   ✓ user_profile table exists\n');
  } catch (error: unknown) {
    console.error('   ✗ user_profile table does not exist');
    console.error('   Please run migrations: npm run db:generate && npm run db:migrate\n');
    await sql.end();
    process.exit(1);
  }

  // Step 4: Verify unique constraint on job_url
  console.log('4. Verifying unique constraint on job_url...');
  try {
    const testUrl = `https://test-${Date.now()}.example.com/job`;

    // Insert first job
    await sql`
      INSERT INTO jobs (job_url, company, title, description, status)
      VALUES (${testUrl}, 'Test Company', 'Test Job', 'Test Description', 'new')
    `;

    // Try to insert duplicate
    try {
      await sql`
        INSERT INTO jobs (job_url, company, title, description, status)
        VALUES (${testUrl}, 'Test Company 2', 'Test Job 2', 'Test Description 2', 'new')
      `;
      console.error('   ✗ Unique constraint is NOT enforced (duplicate was inserted)');
      await sql.end();
      process.exit(1);
    } catch (dupError: unknown) {
      const isDuplicateError =
        dupError instanceof Error &&
        (dupError.message.includes('unique') || ('code' in dupError && dupError.code === '23505'));
      if (isDuplicateError) {
        console.log('   ✓ Unique constraint is properly enforced');
      } else {
        throw dupError;
      }
    }

    // Clean up test data
    await sql`DELETE FROM jobs WHERE job_url = ${testUrl}`;
    console.log('');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('   ✗ Error testing unique constraint');
    console.error(`   Error: ${errorMessage}\n`);
    await sql.end();
    process.exit(1);
  }

  // Step 5: Verify status ENUM constraint
  console.log('5. Verifying status ENUM constraint...');
  try {
    const testUrl = `https://test-${Date.now()}.example.com/job`;

    // Try to insert with invalid status
    try {
      await sql`
        INSERT INTO jobs (job_url, company, title, description, status)
        VALUES (${testUrl}, 'Test Company', 'Test Job', 'Test Description', 'invalid_status')
      `;
      console.error('   ✗ ENUM constraint is NOT enforced (invalid status was accepted)');
      await sql.end();
      process.exit(1);
    } catch (enumError: unknown) {
      const isEnumError =
        enumError instanceof Error &&
        (enumError.message.includes('invalid input value') ||
          ('code' in enumError && (enumError.code === '22P02' || enumError.code === '23514')));
      if (isEnumError) {
        console.log('   ✓ ENUM constraint is properly enforced');
      } else {
        throw enumError;
      }
    }
    console.log('');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('   ✗ Error testing ENUM constraint');
    console.error(`   Error: ${errorMessage}\n`);
    await sql.end();
    process.exit(1);
  }

  // All checks passed
  console.log('✅ All checks passed! Your database is ready for testing.\n');
  console.log('You can now run the property tests with:');
  console.log('  npm test src/db/schema.test.ts\n');

  await sql.end();
  process.exit(0);
}

// Run verification
verifySetup().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
