import app from './api-app.js';

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('SERVERLESS CATCH ERROR:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: 'SERVERLESS_INVOCATION_ERROR',
          message: err?.message || String(err),
          stack: err?.stack,
        },
      });
    }
  }
}
