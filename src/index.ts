import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

import routes from './routes';
import authRoutes from './auth.routes';
import './workers/crawler.worker';

app.use(express.json());

app.use('/api', routes);
app.use('/api/auth', authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'VibeUI API is running!' });
});

// Basic endpoint to test DB connection
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
