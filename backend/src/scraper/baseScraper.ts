import { chromium, type Browser, type Page } from 'playwright';

export interface ScrapedJob {
  url: string;
  company: string;
  title: string;
  description: string;
}

export interface ScraperConfig {
  sources: ('linkedin' | 'indeed')[];
  searchQuery: string;
  delayBetweenRequests: number; // milliseconds
  maxJobsPerRun: number;
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected lastRequestTime: Map<string, number> = new Map();
  protected readonly minDelay = 30000; // 30 seconds minimum delay
  protected readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobSearchAgent/1.0';

  /**
   * Initialize browser instance
   */
  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
    this.page = await this.browser.newPage({
      userAgent: this.userAgent,
    });
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Enforce rate limiting - wait if necessary
   */
  protected async enforceRateLimit(domain: string): Promise<void> {
    const lastRequest = this.lastRequestTime.get(domain);
    if (lastRequest) {
      const elapsed = Date.now() - lastRequest;
      if (elapsed < this.minDelay) {
        const waitTime = this.minDelay - elapsed;
        console.log(`Rate limiting: waiting ${waitTime}ms before next request to ${domain}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    this.lastRequestTime.set(domain, Date.now());
  }

  /**
   * Navigate to URL with rate limiting and exponential backoff for 429 responses
   */
  protected async navigateWithRateLimit(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const domain = new URL(url).hostname;
    await this.enforceRateLimit(domain);
    
    // Exponential backoff delays for 429 responses: 60s, 120s, 240s
    const backoffDelays = [60000, 120000, 240000];
    let attempt = 0;

    while (attempt <= backoffDelays.length) {
      try {
        const response = await this.page.goto(url, { waitUntil: 'networkidle' });
        
        // Check for rate limiting
        if (response && response.status() === 429) {
          if (attempt < backoffDelays.length) {
            const delay = backoffDelays[attempt];
            console.log(`Rate limited (429) - backing off for ${delay}ms (attempt ${attempt + 1})`);
            console.log(`[LOG] Rate limit encountered for ${domain} at ${new Date().toISOString()}`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          } else {
            throw new Error(`Rate limited after ${backoffDelays.length} retry attempts`);
          }
        }
        
        // Success - exit loop
        return;
      } catch (error) {
        // If it's not a 429 error, rethrow
        if (attempt === 0) {
          throw error;
        }
        // If we've exhausted retries, rethrow
        if (attempt >= backoffDelays.length) {
          throw error;
        }
        // Otherwise, continue with backoff
        attempt++;
      }
    }
  }

  /**
   * Abstract method to scrape jobs - must be implemented by subclasses
   */
  abstract scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]>;
}
