import robotsParser from 'robots-parser';

export class RobotsService {
  private cache: Map<string, any> = new Map();

  async isAllowed(url: string, userAgent: string = '*'): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.origin}/robots.txt`;

      let robots = this.cache.get(robotsUrl);

      if (!robots) {
        const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const content = await response.text();
          robots = robotsParser(robotsUrl, content);
          this.cache.set(robotsUrl, robots);
        } else {
          // If no robots.txt found, assume allowed
          this.cache.set(robotsUrl, { isAllowed: () => true });
          return true;
        }
      }

      // If cached object has a direct isAllowed function (like our fallback)
      if (typeof robots.isAllowed === 'function') {
        const allowed = robots.isAllowed(url, userAgent);
        // robots-parser returns undefined if not explicitly allowed or disallowed
        return allowed !== false;
      }
      
      return true;
    } catch (error) {
      console.warn(`[RobotsService] Error checking robots.txt for ${url}:`, error);
      // Fail open if we can't reach the server
      return true;
    }
  }
}
