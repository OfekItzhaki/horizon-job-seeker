import { checkDuplicate, insertJob } from '../services/jobService.js';
import { scoreJob } from '../services/scoringService.js';
import { db } from '../db/index.js';
import { userProfile } from '../db/schema.js';
import type { ScrapedJob } from '../scraper/baseScraper.js';
import { getAvailableScrapers, getScraperStats } from '../config/scraperConfig.js';
import { createScraper } from '../scraper/scraperFactory.js';

export class BackgroundWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the background worker with periodic scraping
   * @param intervalMs - Interval between scrape runs in milliseconds (default: 1 hour)
   */
  start(intervalMs: number = 3600000): void {
    if (this.isRunning) {
      console.log('Background worker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting background worker with ${intervalMs}ms interval`);

    // Run immediately on start
    this.runScrapeJob().catch((error) => {
      console.error('Initial scrape job failed:', error);
    });

    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runScrapeJob().catch((error) => {
        console.error('Scheduled scrape job failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Background worker stopped');
  }

  /**
   * Run a single scrape job cycle
   * Returns statistics about the scraping run
   */
  async runScrapeJob(): Promise<{
    newJobsCount: number;
    duplicatesCount: number;
    totalScraped: number;
  }> {
    console.log('=== Starting scrape job ===');
    const startTime = Date.now();

    // Get available scrapers from config
    const availableScrapers = getAvailableScrapers();

    // Log scraper stats
    const stats = getScraperStats();
    console.log(`\nScraper Status:`);
    console.log(`  Total configured: ${stats.total}`);
    console.log(`  Enabled: ${stats.enabled}`);
    console.log(`  Available (with auth): ${stats.available}`);

    if (stats.missingAuth.length > 0) {
      console.log(`\n  Missing auth for:`);
      stats.missingAuth.forEach((s) => {
        console.log(`    - ${s.name}: needs ${s.requiredEnvVars.join(', ')}`);
      });
    }

    console.log(`\nRunning ${availableScrapers.length} scrapers:\n`);

    let newJobsCount = 0;
    let duplicatesCount = 0;
    let totalScraped = 0;

    try {
      // Run each available scraper in priority order
      for (const scraperConfig of availableScrapers) {
        console.log(
          `\n--- Scraping from ${scraperConfig.name} (priority: ${scraperConfig.priority}) ---`
        );

        const scraper = createScraper(scraperConfig.id);
        if (!scraper) {
          console.error(`Failed to create scraper: ${scraperConfig.id}`);
          continue;
        }

        try {
          await scraper.init();

          // Scrape jobs
          const scrapedJobs = await scraper.scrapeJobs(
            'Full Stack Developer',
            scraperConfig.maxJobs
          );
          totalScraped += scrapedJobs.length;

          console.log(`Found ${scrapedJobs.length} jobs from ${scraperConfig.name}`);

          // Process each scraped job
          for (const job of scrapedJobs) {
            const result = await this.processJob(job);
            if (result === 'new') {
              newJobsCount++;
            } else if (result === 'duplicate') {
              duplicatesCount++;
            }
          }

          console.log(`Processed ${scrapedJobs.length} jobs from ${scraperConfig.name}`);
        } catch (error) {
          console.error(`Error scraping from ${scraperConfig.name}:`, error);
        } finally {
          await scraper.close();
        }

        // Delay between scrapers to be respectful
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const duration = Date.now() - startTime;
      console.log(`\n=== Scrape job completed in ${duration}ms ===`);
      console.log(
        `Stats: ${newJobsCount} new, ${duplicatesCount} duplicates, ${totalScraped} total scraped`
      );

      return { newJobsCount, duplicatesCount, totalScraped };
    } catch (error) {
      console.error('Scrape job error:', error);
      return { newJobsCount, duplicatesCount, totalScraped };
    }
  }

  /**
   * Process a single scraped job: check duplicates, score, and store
   * Returns 'new' if job was added, 'duplicate' if skipped, 'error' if failed
   */
  private async processJob(job: ScrapedJob): Promise<'new' | 'duplicate' | 'error'> {
    try {
      // Check for duplicates
      const isDuplicate = await checkDuplicate(job.company, job.title);

      if (isDuplicate) {
        console.log(`Skipping duplicate: ${job.company} - ${job.title}`);
        return 'duplicate';
      }

      console.log(`Processing new job: ${job.company} - ${job.title}`);

      // Get user profile for scoring
      const profile = await this.getUserProfile();

      if (!profile) {
        console.warn('No user profile found - storing job without score');
        await insertJob({
          jobUrl: job.url,
          company: job.company,
          title: job.title,
          description: job.description,
          matchScore: null,
          status: 'new',
          postedAt: job.postedAt || null,
        });
        return 'new';
      }

      // Score the job
      const score = await scoreJob(job.description, profile.resumeText);

      if (score === null) {
        console.warn(`Scoring failed for ${job.title} - storing with null score`);
      } else {
        console.log(`Match score: ${score}/100`);
      }

      // Store the job
      await insertJob({
        jobUrl: job.url,
        company: job.company,
        title: job.title,
        description: job.description,
        matchScore: score,
        status: 'new',
        postedAt: job.postedAt || null,
      });

      console.log(`✓ Stored job: ${job.company} - ${job.title}`);
      return 'new';
    } catch (error) {
      console.error(`Error processing job ${job.title}:`, error);
      // Continue with next job
      return 'error';
    }
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile() {
    try {
      const profiles = await db.select().from(userProfile).limit(1);
      return profiles[0] || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}
