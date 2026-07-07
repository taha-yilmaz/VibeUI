import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { CrawlerService } from '../services/crawler.service';
import { CleanerService } from '../services/cleaner.service';
import { RobotsService } from '../services/robots.service';
import { scrapeQueue } from '../queue';
import * as cheerio from 'cheerio';

function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    const baseParsed = new URL(baseUrl);
    
    if (parsed.hostname !== baseParsed.hostname) return null;
    
    let normalized = parsed.origin + parsed.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch (e) {
    return null;
  }
}

function hashUrl(normalizedUrl: string): string {
  return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
}

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const crawlerService = new CrawlerService();
const cleanerService = new CleanerService();
const robotsService = new RobotsService();
const prisma = new PrismaClient();

export const scrapeWorker = new Worker(
  'scrape-queue',
  async (job: Job) => {
    const { url, jobId, pageId } = job.data;
    console.log(`[Worker] İşleme başlandı: Job ${jobId} - Sayfa ${pageId} - URL: ${url}`);
    
    try {
      const currentJob = await prisma.crawlJob.findUnique({
        where: { id: jobId },
        include: { authSession: true }
      });

      if (!currentJob) {
        console.log(`[Worker] Job ${jobId} silinmiş veya bulunamadı, işlem iptal ediliyor.`);
        return;
      }

      const storageState = currentJob.authSession?.storageState || undefined;

      // 1. Playwright servisi kullanılarak sayfanın taranması
      const result = await crawlerService.crawlPage(url, jobId, pageId, storageState);
      
      // 2. DOM Cleaner ile HTML'in temizlenmesi
      const cleanHtml = cleanerService.clean(result.rawHtml);
      const htmlSize = Buffer.byteLength(cleanHtml, 'utf8');

      // 3. Veritabanına kaydet (ScrapedPage güncellenir)
      const updatedPage = await prisma.scrapedPage.update({
        where: { id: pageId },
        data: {
          title: result.title,
          cleanHtml: cleanHtml,
          htmlSize: htmlSize,
          screenshotDesktopUrl: result.desktopScreenshotPath,
          screenshotMobileUrl: result.mobileScreenshotPath,
          status: 'COMPLETED',
        },
        include: { job: true }
      });

      await prisma.crawlJob.update({
        where: { id: jobId },
        data: { pagesProcessed: { increment: 1 } }
      });

      // 4. Linkleri Çıkart ve Kuyruğa Ekle
      if (updatedPage.depthLevel < updatedPage.job.maxDepth) {
        const $ = cheerio.load(cleanHtml);
        const links: string[] = [];
        
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          if (href) links.push(href);
        });

        const uniqueLinks = [...new Set(links)];
        
        for (const href of uniqueLinks) {
          const normalized = normalizeUrl(href, updatedPage.job.targetUrl);
          if (!normalized) continue;
          
          const isAllowed = await robotsService.isAllowed(normalized);
          if (!isAllowed) {
            console.log(`[Worker] URL engellenmiş (robots.txt): ${normalized}`);
            continue;
          }

          const urlHash = hashUrl(normalized);
          
          try {
            const currentJob = await prisma.crawlJob.findUnique({ where: { id: jobId }});
            if (currentJob && currentJob.pagesDiscovered < currentJob.maxPages) {
              const newPage = await prisma.scrapedPage.create({
                data: {
                  jobId: jobId,
                  url: normalized,
                  urlHash: urlHash,
                  depthLevel: updatedPage.depthLevel + 1,
                  status: 'PENDING'
                }
              });

              await prisma.crawlJob.update({
                where: { id: jobId },
                data: { pagesDiscovered: { increment: 1 } }
              });

              await scrapeQueue.add('scrape-page', {
                url: normalized,
                jobId: jobId,
                pageId: newPage.id
              });
            }
          } catch (e: any) {
            if (e.code !== 'P2002') {
              console.error(`[Worker] Link eklenirken hata: ${normalized}`, e);
            }
          }
        }
      }

      // 5. Job Tamamlandı mı Kontrol Et
      const finalJobState = await prisma.crawlJob.findUnique({ where: { id: jobId } });
      if (finalJobState && finalJobState.pagesProcessed >= finalJobState.pagesDiscovered) {
        await prisma.crawlJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETED' }
        });
        console.log(`[Worker] Job ${jobId} tüm sayfaları tamamladı (COMPLETED).`);
      }

      console.log(`[Worker] Başarıyla tamamlandı ve kaydedildi: ${url}`);
      return result;
      
    } catch (error: any) {
      console.error(`[Worker] Hata: ${url}`, error);
      
      // Hata durumunda statüyü güncelle
      await prisma.scrapedPage.update({
        where: { id: pageId },
        data: {
          status: 'FAILED',
          errorMessage: String(error.message || error)
        }
      });
      
      throw error;
    }
  },
  { 
    connection: connection as any,
    concurrency: 1 
  }
);

scrapeWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} başarıyla tamamlandı!`);
});

scrapeWorker.on('failed', (job, err) => {
  console.log(`[Worker] Job ${job?.id} hata aldı: ${err.message}`);
});
