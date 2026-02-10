import { BaseScraper, type ScrapedJob } from './baseScraper.js';

export class IndeedScraper extends BaseScraper {
  /**
   * Scrape jobs from Indeed
   */
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    try {
      if (!this.page) {
        throw new Error('Browser not initialized');
      }

      // Indeed job search URL
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=`;
      
      await this.navigateWithRateLimit(searchUrl);

      // Wait for job listings to load
      await this.page.waitForSelector('.job_seen_beacon', { timeout: 10000 }).catch(() => {
        console.log('Indeed: Job listings not found or page structure changed');
      });

      // Extract job cards
      const jobCards = await this.page.$$('.job_seen_beacon');
      
      for (let i = 0; i < Math.min(jobCards.length, maxJobs); i++) {
        try {
          const card = jobCards[i];
          
          // Extract job URL
          const linkElement = await card.$('a[data-jk]');
          const jobKey = linkElement ? await linkElement.getAttribute('data-jk') : '';
          const url = jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : '';
          
          // Extract company name
          const companyElement = await card.$('[data-testid="company-name"]');
          const company = companyElement ? await companyElement.textContent() : '';
          
          // Extract job title
          const titleElement = await card.$('.jobTitle');
          const title = titleElement ? await titleElement.textContent() : '';
          
          // Extract job snippet/description
          const descElement = await card.$('.job-snippet');
          const description = descElement ? await descElement.textContent() : 'Full job description available on Indeed';

          if (url && company && title) {
            jobs.push({
              url: url.trim(),
              company: company.trim(),
              title: title.trim(),
              description: description.trim(),
            });
          }
        } catch (error) {
          console.error('Error extracting job card:', error);
          continue;
        }
      }

      console.log(`Indeed: Scraped ${jobs.length} jobs`);
    } catch (error) {
      console.error('Indeed scraping error:', error);
    }

    return jobs;
  }
}
