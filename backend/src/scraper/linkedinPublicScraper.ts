import { BaseScraper, type ScrapedJob } from './baseScraper.js';

/**
 * LinkedIn Public Jobs Scraper
 * Uses LinkedIn's public jobs API (no authentication required)
 * This is their official public endpoint, not web scraping
 */
export class LinkedInPublicScraper extends BaseScraper {
  private baseUrl = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

  /**
   * Scrape jobs from LinkedIn's public API
   * @param searchQuery - Job title or keywords
   * @param maxJobs - Maximum number of jobs to return
   */
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      // Search parameters
      const locations = ['Tel Aviv, Israel', 'Israel', 'Remote'];

      // Time filters (f_TPR parameter)
      // r86400 = last 24 hours
      // r604800 = last week
      // r2592000 = last month
      const timeFilter = 'r86400'; // Last 24 hours for freshest jobs

      for (const location of locations) {
        if (jobs.length >= maxJobs) break;

        try {
          console.log(`Fetching LinkedIn jobs for: ${searchQuery} in ${location}`);

          // Build URL with parameters
          const params = new URLSearchParams({
            keywords: searchQuery,
            location: location,
            f_TPR: timeFilter, // Time filter: last 24 hours
            start: '0',
            sortBy: 'DD', // Sort by date (most recent first)
          });

          const url = `${this.baseUrl}?${params.toString()}`;
          console.log(`URL: ${url}`);

          // Fetch jobs
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
          });

          if (!response.ok) {
            console.error(`LinkedIn API returned ${response.status}`);
            continue;
          }

          const html = await response.text();

          // Parse HTML to extract job listings
          // LinkedIn returns HTML with job cards
          const jobMatches = html.matchAll(
            /<li[^>]*>.*?data-job-id="(\d+)".*?<h3[^>]*>(.*?)<\/h3>.*?<h4[^>]*>(.*?)<\/h4>.*?<\/li>/gs
          );

          for (const match of jobMatches) {
            if (jobs.length >= maxJobs) break;

            const jobId = match[1];
            const title = this.cleanHtml(match[2]);
            const company = this.cleanHtml(match[3]);

            // Build job URL
            const jobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;

            // Fetch job description and posting date
            const jobDetails = await this.fetchJobDescription(jobId);

            jobs.push({
              url: jobUrl,
              company: company,
              title: title,
              description: jobDetails.description || 'No description available',
              postedAt: jobDetails.postedAt,
            });

            console.log(`Added LinkedIn job: ${title} at ${company}`);

            // Rate limiting - be respectful
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          console.log(`Found ${jobs.length} jobs so far from LinkedIn`);
        } catch (error) {
          console.error(`Error fetching LinkedIn jobs for ${location}:`, error);
        }

        // Delay between location searches
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(`LinkedIn Public Scraper: Total ${jobs.length} jobs found`);
    } catch (error) {
      console.error('LinkedIn public scraping error:', error);
    }

    return jobs;
  }

  /**
   * Fetch job description from LinkedIn
   */
  private async fetchJobDescription(
    jobId: string
  ): Promise<{ description: string | null; postedAt: Date | undefined }> {
    try {
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { description: null, postedAt: undefined };
      }

      const html = await response.text();

      // Extract description from HTML
      const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/s);

      const description = descMatch ? this.cleanHtml(descMatch[1]) : null;

      // Extract posting date
      const postedAt = this.extractPostedDate(html);

      return { description, postedAt };
    } catch (error) {
      console.error(`Error fetching description for job ${jobId}:`, error);
      return { description: null, postedAt: undefined };
    }
  }

  /**
   * Extract posting date from HTML
   * Looks for patterns like "Posted 2 days ago", "Posted 1 hour ago", etc.
   */
  private extractPostedDate(html: string): Date | undefined {
    // Common patterns in LinkedIn HTML
    const patterns = [
      /Posted\s+(\d+)\s+hour[s]?\s+ago/i,
      /Posted\s+(\d+)\s+day[s]?\s+ago/i,
      /Posted\s+(\d+)\s+week[s]?\s+ago/i,
      /Posted\s+(\d+)\s+month[s]?\s+ago/i,
      /(\d+)h\s+ago/i, // Short format
      /(\d+)d\s+ago/i,
      /(\d+)w\s+ago/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const value = parseInt(match[1], 10);
        const now = new Date();

        if (pattern.source.includes('hour')) {
          now.setHours(now.getHours() - value);
          return now;
        } else if (pattern.source.includes('day') || pattern.source.includes('d\\s')) {
          now.setDate(now.getDate() - value);
          return now;
        } else if (pattern.source.includes('week') || pattern.source.includes('w\\s')) {
          now.setDate(now.getDate() - value * 7);
          return now;
        } else if (pattern.source.includes('month')) {
          now.setMonth(now.getMonth() - value);
          return now;
        }
      }
    }

    return undefined;
  }

  /**
   * Clean HTML tags and entities
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Override init - no browser needed for API calls
   */
  async init(): Promise<void> {
    console.log('LinkedIn Public Scraper initialized (using public API)');
  }

  /**
   * Override close - no browser to close
   */
  async close(): Promise<void> {
    console.log('LinkedIn Public Scraper closed');
  }
}
