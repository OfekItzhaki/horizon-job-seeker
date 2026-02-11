import { BaseScraper, type ScrapedJob } from './baseScraper.js';
import Parser from 'rss-parser';

/**
 * RSS Job Scraper
 * Scrapes jobs from RSS feeds - more reliable than web scraping
 * Many job boards offer RSS feeds that are easy to parse
 */
export class RSSJobScraper extends BaseScraper {
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser({
      customFields: {
        item: ['description', 'content:encoded', 'summary'],
      },
    });
  }

  /**
   * Scrape jobs from RSS feeds
   * This is a demonstration using public RSS feeds
   */
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      // Example RSS feeds (you can add more)
      const rssFeeds = [
        // GitHub Jobs (if available)
        `https://jobs.github.com/positions.rss?description=${encodeURIComponent(searchQuery)}`,

        // Stack Overflow Jobs RSS
        `https://stackoverflow.com/jobs/feed?q=${encodeURIComponent(searchQuery)}`,

        // RemoteOK RSS
        `https://remoteok.com/remote-${encodeURIComponent(searchQuery.toLowerCase().replace(/\s+/g, '-'))}-jobs.rss`,

        // We Work Remotely RSS
        `https://weworkremotely.com/categories/remote-programming-jobs.rss`,
      ];

      for (const feedUrl of rssFeeds) {
        if (jobs.length >= maxJobs) break;

        try {
          console.log(`Fetching RSS feed: ${feedUrl}`);
          const feed = await this.parser.parseURL(feedUrl);

          for (const item of feed.items) {
            if (jobs.length >= maxJobs) break;

            // Extract job information
            const title = item.title || 'Unknown Title';
            const url = item.link || item.guid || '';
            const description =
              item.contentSnippet || item.content || item.description || 'No description available';

            // Try to extract company name from title or content
            let company = 'Unknown Company';

            // Common patterns: "Company Name - Job Title" or "Job Title at Company Name"
            const atMatch = title.match(/at\s+(.+?)(?:\s*\||$)/i);
            const dashMatch = title.match(/^(.+?)\s*-\s*/);

            if (atMatch) {
              company = atMatch[1].trim();
            } else if (dashMatch) {
              company = dashMatch[1].trim();
            }

            if (url && title) {
              jobs.push({
                url: url.trim(),
                company: company.trim(),
                title: title.trim(),
                description: description.trim(),
              });
            }
          }

          console.log(`Found ${feed.items.length} jobs from ${feedUrl}`);
        } catch (error) {
          console.error(`Error fetching RSS feed ${feedUrl}:`, error);
          // Continue with next feed
        }
      }

      console.log(`RSS Scraper: Total ${jobs.length} jobs found`);
    } catch (error) {
      console.error('RSS scraping error:', error);
    }

    return jobs;
  }

  /**
   * Override init - RSS scraping doesn't need a browser
   */
  async init(): Promise<void> {
    console.log('RSS Scraper initialized (no browser needed)');
  }

  /**
   * Override close - no browser to close
   */
  async close(): Promise<void> {
    console.log('RSS Scraper closed');
  }
}
