import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
