import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { scrapeQueue } from './queue';
import { chromium, Browser, BrowserContext } from 'playwright';
import { authMiddleware } from './middleware/auth.middleware';

interface ActiveCapture {
  browser: Browser;
  context: BrowserContext;
  url: string;
}
const activeCaptures = new Map<string, ActiveCapture>();

const router = Router();
const prisma = new PrismaClient();

// Mount Auth Middleware to scope all workspace assets
router.use(authMiddleware);

function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    let normalized = parsed.origin + parsed.pathname;
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch (e) {
    return rawUrl;
  }
}

function hashUrl(normalizedUrl: string): string {
  return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
}

// 0. Update Workspace Name
router.put('/workspaces/current', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  const { name } = req.body;

  if (!workspaceId) return res.status(401).json({ message: 'Unauthorized' });
  if (!name) return res.status(400).json({ message: 'Workspace name is required' });

  try {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: name }
    });
    res.json({ success: true, workspace: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 1. Create Job (scoped by workspaceId)
router.post('/jobs', async (req: Request, res: Response) => {
  const { url, name, maxDepth = 1, authSessionId } = req.body;
  const workspaceId = (req as any).workspaceId;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
    const normalized = normalizeUrl(url);
    const urlHash = hashUrl(normalized);

    // Create Job scoped by workspaceId
    const job = await prisma.crawlJob.create({
      data: {
        name: name || null,
        targetUrl: normalized,
        maxDepth: maxDepth,
        authSessionId: authSessionId || null,
        workspaceId: workspaceId || null,
        status: 'PROCESSING',
        pagesDiscovered: 1,
        pagesProcessed: 0,
      }
    });

    // Create first ScrapedPage record
    const page = await prisma.scrapedPage.create({
      data: {
        jobId: job.id,
        url: normalized,
        urlHash: urlHash,
        depthLevel: 1,
        status: 'PENDING'
      }
    });

    // Add job to BullMQ queue
    await scrapeQueue.add('scrape-page', {
      url: normalized,
      jobId: job.id,
      pageId: page.id
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Job queued'
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1.5 Get All Jobs (scoped by workspaceId)
router.get('/jobs', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;

  try {
    const jobs = await prisma.crawlJob.findMany({
      where: {
        workspaceId: workspaceId || null
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        targetUrl: true,
        status: true,
        createdAt: true
      }
    });

    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 1.8 Update Job
router.put('/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { name } = req.body;
  const workspaceId = (req as any).workspaceId;

  try {
    const job = await prisma.crawlJob.update({
      where: { 
        id: jobId,
        workspaceId: workspaceId || null
      },
      data: { name }
    });
    res.json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Job Status
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const workspaceId = (req as any).workspaceId;

  try {
    const job = await prisma.crawlJob.findFirst({
      where: { 
        id: jobId,
        workspaceId: workspaceId || null
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status === 'PROCESSING' && job.pagesProcessed > 0 && job.pagesProcessed >= job.pagesDiscovered) {
      await prisma.crawlJob.update({ where: { id: jobId }, data: { status: 'COMPLETED' } });
      job.status = 'COMPLETED';
    }

    res.json({
      id: job.id,
      status: job.status,
      pagesDiscovered: job.pagesDiscovered,
      pagesProcessed: job.pagesProcessed,
      createdAt: job.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 2.5 Delete Job
router.delete('/jobs/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const workspaceId = (req as any).workspaceId;

  try {
    const job = await prisma.crawlJob.findFirst({
      where: {
        id: jobId,
        workspaceId: workspaceId || null
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found in this workspace' });
    }

    const waitingJobs = await scrapeQueue.getWaiting();
    for (const j of waitingJobs) {
      if (j.data?.jobId === jobId) await j.remove();
    }
    const delayedJobs = await scrapeQueue.getDelayed();
    for (const j of delayedJobs) {
      if (j.data?.jobId === jobId) await j.remove();
    }

    await prisma.crawlJob.delete({
      where: { id: jobId }
    });

    res.json({ success: true, message: 'Job stopped and deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Job Pages
router.get('/jobs/:jobId/pages', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const workspaceId = (req as any).workspaceId;

  try {
    const job = await prisma.crawlJob.findFirst({
      where: {
        id: jobId,
        workspaceId: workspaceId || null
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found in this workspace' });
    }

    const pages = await prisma.scrapedPage.findMany({
      where: { jobId: jobId },
      select: {
        id: true,
        url: true,
        title: true,
        status: true,
        screenshotDesktopUrl: true
      }
    });

    res.json({ pages });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Page details
router.get('/pages/:pageId', async (req: Request, res: Response) => {
  const { pageId } = req.params;
  const { format } = req.query;
  const workspaceId = (req as any).workspaceId;

  try {
    const page = await prisma.scrapedPage.findFirst({
      where: { 
        id: pageId,
        job: {
          workspaceId: workspaceId || null
        }
      }
    });

    if (!page) {
      return res.status(404).json({ message: 'Page reference not found' });
    }

    if (format === 'markdown') {
      const markdown = `Below is the screenshot and cleaned DOM structure of a reference web page.

Screenshot:
${page.screenshotDesktopUrl || '[NO_SCREENSHOT_URL]'}

DOM:
\`\`\`html
${page.cleanHtml || ''}
\`\`\`

Please recreate this screen as accurately as possible using React + Tailwind.
Rules:
- Maintain responsive design
- Divide into logical components
- Preserve visual hierarchy
- Match the layout as closely as possible`;

      return res.type('text/markdown').send(markdown);
    }

    res.json({
      url: page.url,
      title: page.title,
      cleanHtml: page.cleanHtml,
      screenshotDesktopUrl: page.screenshotDesktopUrl,
      screenshotMobileUrl: page.screenshotMobileUrl,
      status: page.status
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Auth Sessions (scoped by workspaceId)
router.get('/sessions', async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;
  try {
    const sessions = await prisma.authSession.findMany({
      where: { workspaceId: workspaceId || null },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Capture Auth Session
router.post('/sessions/capture', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const captureId = crypto.randomUUID();
    const browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
      ignoreDefaultArgs: ['--enable-automation']
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url);

    activeCaptures.set(captureId, { browser, context, url });

    res.json({ success: true, captureId, message: 'Browser opened. Please login and then call /save' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// 7. Save Auth Session (scoped by workspaceId)
router.post('/sessions/capture/:captureId/save', async (req: Request, res: Response) => {
  const { captureId } = req.params;
  const { name } = req.body;
  const workspaceId = (req as any).workspaceId;

  if (!name) return res.status(400).json({ message: 'Session name is required' });

  const capture = activeCaptures.get(captureId);
  if (!capture) {
    return res.status(404).json({ message: 'Capture session not found or already closed' });
  }

  try {
    const state = await capture.context.storageState();
    
    const session = await prisma.authSession.create({
      data: {
        name,
        storageState: state as any,
        workspaceId: workspaceId || null
      }
    });

    await capture.browser.close();
    activeCaptures.delete(captureId);

    res.json({ success: true, sessionId: session.id, message: 'Session saved successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
