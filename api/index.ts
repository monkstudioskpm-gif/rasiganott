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

    const { default: app } = await import('../apps/api/dist/apps/api/src/index.js');
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
