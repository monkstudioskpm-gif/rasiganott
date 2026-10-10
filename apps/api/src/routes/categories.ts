import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/categories
router.get('/', async (_req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ categories: genres, genres });
  } catch (err) {
    next(err);
  }
});

export default router;
