import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import homeRouter from './routes/home.js';
import titlesRouter from './routes/titles.js';
import genresRouter from './routes/genres.js';
import peopleRouter from './routes/people.js';
import tagsRouter from './routes/tags.js';
import creatorRouter from './routes/creator.js';
import adminRouter from './routes/admin.js';
import fundingRouter from './routes/funding.js';
import authRouter from './routes/auth.js';
import progressRouter from './routes/progress.js';
import feedRouter from './routes/feed.js';
import { ensureSchemaUpgrades } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Security & Middleware
const helmetFn = helmet as unknown as (options?: object) => express.RequestHandler;
app.use(helmetFn({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Auto-upgrade database schema on request if needed
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureSchemaUpgrades();
  next();
});

// Healthcheck & DB Migration triggers
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/admin/migrate-db', async (_req: Request, res: Response) => {
  await ensureSchemaUpgrades();
  res.json({ success: true, message: 'Schema upgrade triggered successfully' });
});

// Routes
app.use('/api/home', homeRouter);
app.use('/api/titles', titlesRouter);
app.use('/api/genres', genresRouter);
app.use('/api/categories', genresRouter); // legacy alias for Genre
app.use('/api/admin', adminRouter);
app.use('/api/admin/people', peopleRouter);
app.use('/api/admin/tags', tagsRouter);
app.use('/api/creator', creatorRouter);
app.use('/api/funding', fundingRouter);
app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/feed', feedRouter);

// 404 Handler
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
if (!isServerless && process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Rasigan API backend running at http://localhost:${port}`);
  });
}

export default app;
