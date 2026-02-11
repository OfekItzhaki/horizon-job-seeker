import { LinkedInScraper } from '../scraper/linkedinScraper.js';
import { IndeedScraper } from '../scraper/indeedScraper.js';
import { RSSJobScraper } from '../scraper/rssJobScraper.js';
import { checkDuplicate, insertJob } from '../services/jobService.js';
import { scoreJob } from '../services/scoringService.js';
import { db } from '../db/index.js';
import { userProfile } from '../db/schema.js';
import type { ScraperConfig, ScrapedJob } from '../scraper/baseScraper.js';

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
   */
  async runScrapeJob(): Promise<void> {
    console.log('=== Starting scrape job ===');
    const startTime = Date.now();

    const config: ScraperConfig = {
      sources: ['rss', 'linkedin', 'indeed'], // RSS first (most reliable)
      searchQuery: 'Full Stack Developer',
      delayBetweenRequests: 30000, // 30 seconds
      maxJobsPerRun: 10,
    };

    try {
      // Scrape from RSS feeds (most reliable)
      await this.scrapeFromSource('rss', config);

      // Optionally scrape from LinkedIn (requires auth)
      // await this.scrapeFromSource('linkedin', config);

      // Optionally scrape from Indeed (has bot detection)
      // await this.scrapeFromSource('indeed', config);

      const duration = Date.now() - startTime;
      console.log(`=== Scrape job completed in ${duration}ms ===`);
    } catch (error) {
      console.error('Scrape job error:', error);
      // Continue execution - don't let one failure stop the worker
    }
  }

  /**
   * Scrape jobs from a specific source
   */
  private async scrapeFromSource(
    source: 'rss' | 'linkedin' | 'indeed',
    config: ScraperConfig
  ): Promise<void> {
    console.log(`\n--- Scraping from ${source} ---`);

    let scraper;
    try {
      // Initialize appropriate scraper
      if (source === 'rss') {
        scraper = new RSSJobScraper();
      } else if (source === 'linkedin') {
        scraper = new LinkedInScraper();
      } else {
        scraper = new IndeedScraper();
      }

      await scraper.init();

      // Scrape jobs
      const scrapedJobs = await scraper.scrapeJobs(config.searchQuery, config.maxJobsPerRun);

      console.log(`Found ${scrapedJobs.length} jobs from ${source}`);

      // Process each scraped job
      for (const job of scrapedJobs) {
        await this.processJob(job);
      }
    } catch (error) {
      console.error(`Error scraping from ${source}:`, error);
      // Log error but continue - don't let one source failure stop everything
    } finally {
      // Always close the scraper
      if (scraper) {
        await scraper.close();
      }
    }
  }

  /**
   * Process a single scraped job: check duplicates, score, and store
   */
  private async processJob(job: ScrapedJob): Promise<void> {
    try {
      // Check for duplicates
      const isDuplicate = await checkDuplicate(job.company, job.title);

      if (isDuplicate) {
        console.log(`Skipping duplicate: ${job.company} - ${job.title}`);
        return;
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
        });
        return;
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
      });

      console.log(`✓ Stored job: ${job.company} - ${job.title}`);
    } catch (error) {
      console.error(`Error processing job ${job.title}:`, error);
      // Continue with next job
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
