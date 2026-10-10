let appInstance: any = null;

async function getApp() {
  if (appInstance) return appInstance;

  const candidatePaths = [
    '../apps/api/dist/apps/api/src/index.js',
    '../../api/dist/apps/api/src/index.js',
    '../../../apps/api/dist/apps/api/src/index.js',
    './apps/api/dist/apps/api/src/index.js',
  ];

  let lastError: any = null;
  for (const path of candidatePaths) {
    try {
      const mod = await import(path);
      if (mod?.default) {
        appInstance = mod.default;
        return appInstance;
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.url === '/api/health' || req.url === '/api/health/') {
      return res.status(200).json({
        status: 'ok',
        runtime: 'vercel-serverless',
        hasDbUrl: Boolean(process.env.DATABASE_URL),
        timestamp: new Date().toISOString(),
      });
    }

    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('SERVERLESS CATCH ERROR:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: 'SERVERLESS_IMPORT_ERROR',
          message: err?.message || String(err),
          stack: err?.stack,
        },
      });
    }
  }
}
