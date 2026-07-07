import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'vibeui-jwt-super-secret-key-12345';

// Helper to hash passwords using Node's built-in crypto
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, workspaceName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const finalWorkspaceName = workspaceName || `${name}'s Workspace`;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);
    
    // Create Plan first if it doesn't exist
    let freePlan = await prisma.plan.findUnique({ where: { type: 'FREE' } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          type: 'FREE',
          maxCrawlJobs: 2,
          maxDepth: 1,
          maxPagesPerJob: 50,
          maxAuthSessions: 0,
        }
      });
    }

    // Create User, Workspace, WorkspaceMember in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          name: finalWorkspaceName,
          slug: finalWorkspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          planId: freePlan.id,
        }
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        }
      });

      return { user, workspace };
    });

    const token = jwt.sign(
      { userId: result.user.id, workspaceId: result.workspace.id, isAnonymous: false },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      workspaceName: result.workspace.name,
      message: 'Registered successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const membership = user.memberships[0];
    if (!membership) {
      return res.status(400).json({ message: 'No workspace found for user' });
    }

    const token = jwt.sign(
      { userId: user.id, workspaceId: membership.workspaceId, isAnonymous: false },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      workspaceName: membership.workspace.name,
      message: 'Logged in successfully',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Guest token generation
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const guestId = crypto.randomUUID();
    const email = `guest-${guestId}@vibeui.local`;
    const workspaceName = `Guest Workspace`;

    // Ensure FREE plan exists
    let freePlan = await prisma.plan.findUnique({ where: { type: 'FREE' } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          name: 'Free Plan',
          type: 'FREE',
          maxCrawlJobs: 2,
          maxDepth: 1,
          maxPagesPerJob: 50,
          maxAuthSessions: 0,
        }
      });
    }

    // Transactionally create guest user and workspace
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: 'Guest User',
          email,
          isAnonymous: true,
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: `guest-ws-${guestId}`,
          planId: freePlan.id,
        }
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        }
      });

      return { user, workspace };
    });

    const token = jwt.sign(
      { userId: result.user.id, workspaceId: result.workspace.id, isAnonymous: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      workspaceName: result.workspace.name,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Me endpoint
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.isAnonymous) {
      return res.json({
        id: decoded.userId,
        name: 'Guest User',
        email: 'guest@vibeui.com',
        isAnonymous: true,
        workspace: { name: 'Guest Workspace', id: decoded.workspaceId }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatarUrl: true }
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: decoded.workspaceId },
      include: { plan: true }
    });

    res.json({
      ...user,
      isAnonymous: false,
      workspace,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid session' });
  }
});

export default router;
