import app from '../../apps/api/src/index.js';

export default function handler(req: any, res: any) {
  return app(req, res);
}
