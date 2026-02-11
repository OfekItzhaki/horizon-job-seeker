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
   * Includes Israeli job boards and tech-specific sources
   */
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    try {
      // RSS feeds organized by region and type
      const rssFeeds = [
        // === ISRAELI JOB BOARDS ===
        // Note: These URLs are examples - you'll need to verify actual RSS feed URLs
        `https://www.alljobs.co.il/rss/jobs.xml`,
        `https://www.drushim.co.il/rss/jobs.xml`,
        `https://www.jobmaster.co.il/rss/jobs.xml`,
        
        // === TECH-SPECIFIC (GLOBAL) ===
        // Stack Overflow Jobs
        `https://stackoverflow.com/jobs/feed?q=${encodeURIComponent(searchQuery)}`,
        
        // RemoteOK - supports location filtering
        `https://remoteok.com/remote-${encodeURIComponent(searchQuery.toLowerCase().replace(/\s+/g, '-'))}-jobs.rss`,
        
        // We Work Remotely
        `https://weworkremotely.com/categories/remote-programming-jobs.rss`,
        `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss`,
        
        // AngelList/Wellfound (if they have RSS)
        // Note: AngelList may require API access instead of RSS
        
        // === ADDITIONAL TECH SOURCES ===
        // Hacker News Who's Hiring
        `https://hnrss.org/jobs`,
        
        // Lobsters (tech community)
        `https://lobste.rs/t/job.rss`,
        
        // Authentic Jobs
        `https://authenticjobs.com/rss/custom.php?terms=${encodeURIComponent(searchQuery)}`,
        
        // GitHub Jobs (if still available)
        `https://jobs.github.com/positions.rss?description=${encodeURIComponent(searchQuery)}`,
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
            const parenthesesMatch = title.match(/\(([^)]+)\)/); // (Company Name)

            if (atMatch) {
              company = atMatch[1].trim();
            } else if (dashMatch) {
              company = dashMatch[1].trim();
            } else if (parenthesesMatch) {
              company = parenthesesMatch[1].trim();
            }

            // Filter for Israeli/Tel Aviv jobs if location is mentioned
            const hasIsraeliLocation = 
              description.toLowerCase().includes('israel') ||
              description.toLowerCase().includes('tel aviv') ||
              description.toLowerCase().includes('jerusalem') ||
              description.toLowerCase().includes('haifa') ||
              title.toLowerCase().includes('israel') ||
              title.toLowerCase().includes('tel aviv');

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
          // Continue with next feed - don't let one failure stop everything
        }

        // Add delay between feeds to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
