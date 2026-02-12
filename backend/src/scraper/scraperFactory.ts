/**
 * Scraper Factory
 *
 * Dynamically creates scraper instances based on configuration.
 * This makes it easy to add/remove scrapers without changing the worker code.
 */

import { BaseScraper } from './baseScraper.js';
import { RSSJobScraper } from './rssJobScraper.js';
import { LinkedInScraper } from './linkedinScraper.js';
import { IndeedScraper } from './indeedScraper.js';
import { LinkedInPublicScraper } from './linkedinPublicScraper.js';
import { AdzunaScraper } from './adzunaScraper.js';
import type { ScraperSourceConfig } from '../config/scraperConfig.js';

/**
 * Create a scraper instance based on scraper ID
 */
export function createScraper(scraperId: string): BaseScraper | null {
  switch (scraperId) {
    case 'rss':
      return new RSSJobScraper();

    case 'linkedin-public':
      return new LinkedInPublicScraper();

    case 'adzuna':
      return new AdzunaScraper();

    case 'linkedin':
      return new LinkedInScraper();

    case 'indeed':
      return new IndeedScraper();

    default:
      console.error(`Unknown scraper ID: ${scraperId}`);
      return null;
  }
}

/**
 * Create scraper instances for all available scrapers
 */
export function createScrapers(configs: ScraperSourceConfig[]): Map<string, BaseScraper> {
  const scrapers = new Map<string, BaseScraper>();

  for (const config of configs) {
    const scraper = createScraper(config.id);
    if (scraper) {
      scrapers.set(config.id, scraper);
    }
  }

  return scrapers;
}

/**
 * Validate that a scraper can be created
 */
export function canCreateScraper(scraperId: string): boolean {
  const scraper = createScraper(scraperId);
  return scraper !== null;
}
