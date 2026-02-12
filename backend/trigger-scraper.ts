/**
 * Manual script to trigger the job scraper
 * Run this to populate the database with fresh jobs
 */
import 'dotenv/config';
import { BackgroundWorker } from './src/worker/backgroundWorker.js';

async function triggerScraper() {
  console.log('Starting manual job scraper...\n');
  
  const worker = new BackgroundWorker();
  
  try {
    await worker.runScrapeJob();
    console.log('\n✓ Scraping completed successfully!');
  } catch (error) {
    console.error('\n✗ Scraping failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

triggerScraper();
