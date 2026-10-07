import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import homeRouter from './routes/home.js';
import titlesRouter from './routes/titles.js';
import categoriesRouter from './routes/categories.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Security & Middleware
const helmetFn = helmet as unknown as (options?: object) => express.RequestHandler;
app.use(helmetFn({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true, // Allow any dev client origin (localhost:5180, localhost:5173, etc.)
    credentials: true,
  })
);
app.use(express.json());

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/home', homeRouter);
app.use('/api/titles', titlesRouter);
app.use('/api/categories', categoriesRouter);

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

app.listen(port, () => {
  console.log(`Rasigan API backend running at http://localhost:${port}`);
});

export default app;
