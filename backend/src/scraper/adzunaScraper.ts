import { BaseScraper, type ScrapedJob } from './baseScraper.js';

/**
 * Adzuna API Scraper
 * Uses Adzuna's official API (free tier: 1000 calls/month)
 * Sign up at: https://developer.adzuna.com/
 *
 * Set environment variables:
 * ADZUNA_APP_ID=your_app_id
 * ADZUNA_API_KEY=your_api_key
 */
export class AdzunaScraper extends BaseScraper {
  private appId: string;
  private apiKey: string;
  private baseUrl = 'https://api.adzuna.com/v1/api/jobs';

  constructor() {
    super();
    this.appId = process.env.ADZUNA_APP_ID || '';
    this.apiKey = process.env.ADZUNA_API_KEY || '';
  }

  /**
   * Scrape jobs from Adzuna API
   */
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Check if API credentials are configured
    if (!this.appId || !this.apiKey) {
      console.log('⚠️ Adzuna API credentials not configured. Skipping Adzuna.');
      console.log('   Sign up at: https://developer.adzuna.com/');
      console.log('   Set ADZUNA_APP_ID and ADZUNA_API_KEY in .env');
      return jobs;
    }

    try {
      // Countries to search
      const countries = [
        { code: 'il', name: 'Israel' },
        { code: 'us', name: 'United States' },
        { code: 'gb', name: 'United Kingdom' },
      ];

      for (const country of countries) {
        if (jobs.length >= maxJobs) break;

        try {
          console.log(`Fetching Adzuna jobs in ${country.name}...`);

          // Build API URL
          const params = new URLSearchParams({
            app_id: this.appId,
            app_key: this.apiKey,
            results_per_page: '50',
            what: searchQuery,
            max_days_old: '1', // Only jobs from last 24 hours
            sort_by: 'date', // Most recent first
          });

          const url = `${this.baseUrl}/${country.code}/search/1?${params.toString()}`;

          const response = await fetch(url);

          if (!response.ok) {
            console.error(`Adzuna API returned ${response.status} for ${country.name}`);
            continue;
          }

          interface AdzunaJob {
            title?: string;
            company?: { display_name?: string };
            description?: string;
            redirect_url?: string;
            created?: string;
          }

          interface AdzunaResponse {
            results?: AdzunaJob[];
          }

          const data = (await response.json()) as AdzunaResponse;

          if (!data.results || data.results.length === 0) {
            console.log(`No jobs found in ${country.name}`);
            continue;
          }

          console.log(`Found ${data.results.length} jobs in ${country.name}`);

          // Process each job
          for (const job of data.results) {
            if (jobs.length >= maxJobs) break;

            // Extract job data
            const title = job.title || 'Unknown Title';
            const company = job.company?.display_name || 'Unknown Company';
            const description = job.description || 'No description available';
            const url = job.redirect_url || '';

            // Skip if no URL
            if (!url) {
              console.log(`Skipping job with no URL: ${title}`);
              continue;
            }

            // Check job age
            const createdDate = job.created ? new Date(job.created) : null;
            if (createdDate) {
              const hoursOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
              if (hoursOld > 24) {
                console.log(`Skipping old job (${Math.floor(hoursOld)} hours): ${title}`);
                continue;
              }
            }

            jobs.push({
              url: url,
              company: company,
              title: title,
              description: description,
              postedAt: createdDate || undefined,
            });

            console.log(`Added Adzuna job: ${title} at ${company}`);
          }

          console.log(`Processed ${data.results.length} jobs from ${country.name}`);
        } catch (error) {
          console.error(`Error fetching Adzuna jobs for ${country.name}:`, error);
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`Adzuna Scraper: Total ${jobs.length} jobs found`);
    } catch (error) {
      console.error('Adzuna scraping error:', error);
    }

    return jobs;
  }

  /**
   * Override init - no browser needed for API calls
   */
  async init(): Promise<void> {
    console.log('Adzuna Scraper initialized (using official API)');
  }

  /**
   * Override close - no browser to close
   */
  async close(): Promise<void> {
    console.log('Adzuna Scraper closed');
  }
}
