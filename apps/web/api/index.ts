import app from '../../apps/api/dist/apps/api/src/index.js';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless Handler Error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: 'SERVERLESS_INVOCATION_ERROR',
          message: err?.message || 'Serverless invocation error',
        },
      });
    }
  }
}
