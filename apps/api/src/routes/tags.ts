import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/admin/tags/suggest?q=
router.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '15', 10)));

    const tags = await prisma.tag.findMany({
      where: q ? { name: { contains: q } } : undefined,
      take: limit,
      orderBy: { name: 'asc' },
    });

    res.json({ tags: tags.map((t) => t.name) });
  } catch (err) {
    next(err);
  }
});

export default router;
