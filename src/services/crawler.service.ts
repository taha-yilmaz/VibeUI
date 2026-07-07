import { Browser, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { StorageService } from './storage.service';

chromium.use(stealth());

export interface CrawlResult {
  url: string;
  title: string;
  rawHtml: string;
  desktopScreenshotPath: string;
  mobileScreenshotPath: string;
}

export class CrawlerService {
  private browser: Browser | null = null;
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlPage(url: string, jobId: string, pageId: string, storageState?: any): Promise<CrawlResult> {
    if (!this.browser) {
      await this.init();
    }

    const contextOptions: any = {};
    if (storageState) {
      contextOptions.storageState = storageState;
    }

    const context = await this.browser!.newContext(contextOptions);
    const page = await context.newPage();

    try {
      // 1. URL ziyaret edilir (networkidle e-ticaret sitelerinde timeout'a düşürdüğü için domcontentloaded kullanıyoruz)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 2. Lazy load içerikler için scroll yapılır (MAX_SCROLLS=15)
      await this.autoScroll(page);

      // 3. Desktop screenshot alınır ve buluta yüklenir
      await page.setViewportSize({ width: 1440, height: 900 });
      const desktopBuffer = await page.screenshot({ fullPage: true });
      const desktopScreenshotPath = await this.storageService.uploadScreenshot(desktopBuffer, jobId, pageId, 'desktop') || `storage/${jobId}/${pageId}/desktop.png`;

      // 4. Mobile screenshot alınır ve buluta yüklenir
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileBuffer = await page.screenshot({ fullPage: true });
      const mobileScreenshotPath = await this.storageService.uploadScreenshot(mobileBuffer, jobId, pageId, 'mobile') || `storage/${jobId}/${pageId}/mobile.png`;

      // 5. HTML alınır
      const rawHtml = await page.evaluate(() => document.body.innerHTML);
      
      // 6. Sayfa başlığı alınır
      const title = await page.title();

      return {
        url,
        title,
        rawHtml,
        desktopScreenshotPath,
        mobileScreenshotPath
      };

    } finally {
      await context.close();
    }
  }

  private async autoScroll(page: Page) {
    const maxScrolls = 15;
    let currentScroll = 0;
    
    while (currentScroll < maxScrolls) {
      const scrolled = await page.evaluate(() => {
        const currentPosition = window.scrollY;
        window.scrollBy(0, window.innerHeight);
        return window.scrollY > currentPosition; // Scroll olduysa true döner
      });
      
      if (!scrolled) break; // Eğer sayfa daha fazla aşağı inmiyorsa döngüyü kır
      
      await page.waitForTimeout(500); // İçeriğin yüklenmesi için kısa bir bekleme
      currentScroll++;
    }
  }
}
