#!/usr/bin/env node
import { BackgroundWorker } from './backgroundWorker.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY not set - job scoring will be disabled');
}

// Create and start the worker
const worker = new BackgroundWorker();

// Export for use in API routes
export const backgroundWorker = worker;

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  worker.stop();
  process.exit(0);
});

// Start the worker
// Default: run every hour (3600000ms)
// For testing, you can pass a shorter interval: node worker/index.js 60000 (1 minute)
const intervalMs = process.argv[2] ? parseInt(process.argv[2], 10) : 3600000;

console.log('='.repeat(60));
console.log('Job Search Agent - Background Worker');
console.log('='.repeat(60));
console.log(`Interval: ${intervalMs}ms (${intervalMs / 1000 / 60} minutes)`);
console.log(`Database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
console.log(`OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
console.log('='.repeat(60));

worker.start(intervalMs);
