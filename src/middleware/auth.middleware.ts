import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vibeui-jwt-super-secret-key-12345';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  workspaceId?: string;
  isAnonymous?: boolean;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }
  
  if (!token) {
    // Anonymous/Guest bypass for testing & non-authenticated flow
    (req as any).userId = 'guest-user-id';
    (req as any).workspaceId = 'guest-workspace-id';
    (req as any).isAnonymous = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    (req as any).workspaceId = decoded.workspaceId;
    (req as any).isAnonymous = decoded.isAnonymous || false;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized session' });
  }
}
