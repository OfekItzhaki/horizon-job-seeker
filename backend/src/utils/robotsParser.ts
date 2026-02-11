/**
 * Simple robots.txt parser
 * Checks if a URL is allowed for scraping based on robots.txt rules
 */
export class RobotsParser {
  private disallowedPaths: Map<string, string[]> = new Map();

  /**
   * Fetch and parse robots.txt for a domain
   */
  async fetchRobotsTxt(domain: string): Promise<void> {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl);

      if (!response.ok) {
        console.log(`No robots.txt found for ${domain}, allowing all paths`);
        return;
      }

      const text = await response.text();
      this.parseRobotsTxt(domain, text);
    } catch (error) {
      console.error(`Error fetching robots.txt for ${domain}:`, error);
      // If we can't fetch robots.txt, be conservative and allow scraping
    }
  }

  /**
   * Parse robots.txt content
   */
  private parseRobotsTxt(domain: string, content: string): void {
    const lines = content.split('\n');
    const disallowed: string[] = [];
    let isRelevantSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this section applies to us
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        const agent = trimmed.substring(11).trim();
        isRelevantSection = agent === '*' || agent.toLowerCase().includes('bot');
      }

      // Parse disallow rules
      if (isRelevantSection && trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.substring(9).trim();
        if (path) {
          disallowed.push(path);
        }
      }
    }

    this.disallowedPaths.set(domain, disallowed);
    console.log(`Parsed robots.txt for ${domain}: ${disallowed.length} disallowed paths`);
  }

  /**
   * Check if a URL is allowed for scraping
   */
  isAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;

      const disallowed = this.disallowedPaths.get(domain);
      if (!disallowed || disallowed.length === 0) {
        return true; // No restrictions or robots.txt not found
      }

      // Check if path matches any disallowed pattern
      for (const disallowedPath of disallowed) {
        if (path.startsWith(disallowedPath)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking robots.txt:', error);
      return true; // Be permissive on error
    }
  }
}
