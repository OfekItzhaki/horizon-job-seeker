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
      // RSS feeds organized by activity level and region
      // Only using the most active feeds that update daily/hourly
      const rssFeeds = [
        // === HIGHEST ACTIVITY FEEDS (Updated Multiple Times Daily) ===
        // RemoteOK - Very active, updates multiple times daily with fresh jobs
        `https://remoteok.com/remote-dev-jobs.rss`,
        `https://remoteok.com/remote-software-engineer-jobs.rss`,
        `https://remoteok.com/remote-full-stack-jobs.rss`,
        `https://remoteok.com/remote-backend-jobs.rss`,
        `https://remoteok.com/remote-frontend-jobs.rss`,

        // Hacker News - Very active, updated constantly
        `https://hnrss.org/jobs`,

        // We Work Remotely - Active, updates daily
        `https://weworkremotely.com/categories/remote-programming-jobs.rss`,
        `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss`,

        // Remotive - Active remote job board
        `https://remotive.com/api/remote-jobs/feed`,

        // === MODERATE ACTIVITY (Updated Daily) ===
        // Lobsters (tech community)
        `https://lobste.rs/t/job.rss`,

        // Note: Removed feeds that tend to have older postings
        // - Stack Overflow Jobs (often has old postings)
        // - Authentic Jobs (moderate activity)
        // - We Work Remotely back-end/front-end specific (overlap with main feed)
      ];

      for (const feedUrl of rssFeeds) {
        if (jobs.length >= maxJobs) break;

        try {
          console.log(`Fetching RSS feed: ${feedUrl}`);
          const feed = await this.parser.parseURL(feedUrl);

          if (!feed.items || feed.items.length === 0) {
            console.log(`No items found in feed: ${feedUrl}`);
            continue;
          }

          console.log(`Found ${feed.items.length} items in feed`);

          for (const item of feed.items) {
            if (jobs.length >= maxJobs) break;

            // Extract job information
            const title = item.title || 'Unknown Title';
            const url = item.link || item.guid || '';
            const description =
              item.contentSnippet || item.content || item.description || 'No description available';

            // Skip if no URL
            if (!url) {
              console.log(`Skipping item with no URL: ${title}`);
              continue;
            }

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

            // Check if job is recent (posted within last 3 days)
            // Jobs in tech close FAST - some within hours, most within days
            const pubDate = item.pubDate ? new Date(item.pubDate) : null;
            if (pubDate) {
              const daysSincePosted = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSincePosted > 3) {
                console.log(`Skipping old job (${Math.floor(daysSincePosted)} days old): ${title}`);
                continue;
              }
              const hoursOld = Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60));
              console.log(`Job age: ${hoursOld} hours (${Math.floor(daysSincePosted)} days)`);
            } else {
              // If no date, skip it - we only want fresh jobs
              console.log(`No pubDate for job: ${title} - SKIPPING (we only want fresh jobs)`);
              continue;
            }

            jobs.push({
              url: url.trim(),
              company: company.trim(),
              title: title.trim(),
              description: description.trim(),
            });

            console.log(`Added job: ${title} at ${company}`);
          }

          console.log(
            `Processed ${feed.items.length} items from ${feedUrl}, added ${jobs.length} jobs so far`
          );
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
