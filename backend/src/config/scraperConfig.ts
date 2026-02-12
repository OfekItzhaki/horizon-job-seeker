/**
 * Modular Scraper Configuration
 *
 * This file defines all available job scrapers and their settings.
 * To enable/disable a scraper, just change the 'enabled' flag.
 * To add a new scraper, add a new entry to the config array.
 */

export interface ScraperSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority (runs first)
  maxJobs: number; // Max jobs to fetch from this source
  description: string;
  requiresAuth: boolean;
  authEnvVars?: string[]; // Required environment variables
}

/**
 * Scraper configuration
 * Scrapers are executed in priority order (lowest first)
 */
export const scraperConfig: ScraperSourceConfig[] = [
  {
    id: 'linkedin-public',
    name: 'LinkedIn Public API',
    enabled: true,
    priority: 1, // Highest priority - freshest jobs (24 hours)
    maxJobs: 100,
    description: 'LinkedIn official public API - last 24 hours, no auth required',
    requiresAuth: false,
  },
  {
    id: 'adzuna',
    name: 'Adzuna API',
    enabled: true,
    priority: 2, // Second priority - fresh jobs (3 days) from multiple sources
    maxJobs: 100,
    description: 'Adzuna official API - aggregates jobs from 20+ sources',
    requiresAuth: true,
    authEnvVars: ['ADZUNA_APP_ID', 'ADZUNA_API_KEY'],
  },
  {
    id: 'rss',
    name: 'RSS Feeds',
    enabled: true,
    priority: 3, // Third priority - fallback
    maxJobs: 50,
    description: 'RSS feeds from RemoteOK, Hacker News, We Work Remotely',
    requiresAuth: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Scraper (Requires Login)',
    enabled: false, // Disabled by default - requires LinkedIn account
    priority: 10,
    maxJobs: 50,
    description: 'LinkedIn web scraper - requires authentication, risky',
    requiresAuth: true,
    authEnvVars: ['LINKEDIN_EMAIL', 'LINKEDIN_PASSWORD'],
  },
  {
    id: 'indeed',
    name: 'Indeed Scraper',
    enabled: false, // Disabled by default - has bot detection
    priority: 11,
    maxJobs: 50,
    description: 'Indeed web scraper - has bot detection, may fail',
    requiresAuth: false,
  },
];

/**
 * Get enabled scrapers sorted by priority
 */
export function getEnabledScrapers(): ScraperSourceConfig[] {
  return scraperConfig.filter((scraper) => scraper.enabled).sort((a, b) => a.priority - b.priority);
}

/**
 * Get scraper by ID
 */
export function getScraperById(id: string): ScraperSourceConfig | undefined {
  return scraperConfig.find((scraper) => scraper.id === id);
}

/**
 * Check if scraper has required auth credentials
 */
export function hasRequiredAuth(scraper: ScraperSourceConfig): boolean {
  if (!scraper.requiresAuth) {
    return true;
  }

  if (!scraper.authEnvVars) {
    return false;
  }

  // Check if all required env vars are set
  return scraper.authEnvVars.every((envVar) => {
    const value = process.env[envVar];
    return value && value.trim().length > 0;
  });
}

/**
 * Get scrapers that are enabled and have required auth
 */
export function getAvailableScrapers(): ScraperSourceConfig[] {
  return getEnabledScrapers().filter((scraper) => hasRequiredAuth(scraper));
}

/**
 * Get scraper statistics
 */
export function getScraperStats() {
  const enabled = getEnabledScrapers();
  const available = getAvailableScrapers();
  const missingAuth = enabled.filter((s) => !hasRequiredAuth(s));

  return {
    total: scraperConfig.length,
    enabled: enabled.length,
    available: available.length,
    missingAuth: missingAuth.map((s) => ({
      id: s.id,
      name: s.name,
      requiredEnvVars: s.authEnvVars || [],
    })),
  };
}
