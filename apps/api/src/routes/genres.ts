import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/genres (Public & Admin)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const genres = await prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ genres, categories: genres }); // categories fallback included
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/genres (Admin view including inactive)
router.get('/admin', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ genres });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/genres
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Genre name is required' } });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const genre = await prisma.genre.upsert({
      where: { slug },
      update: { name: name.trim(), isActive: true },
      create: {
        name: name.trim(),
        slug,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isActive: true,
      },
    });

    res.status(201).json({ genre });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/genres/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = (req.params as any).id as string;
    const { name, sortOrder, isActive } = req.body;

    const updateData: any = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const genre = await prisma.genre.update({
      where: { id: genreId },
      data: updateData,
    });

    res.json({ genre });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/genres/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = (req.params as any).id as string;
    await prisma.genre.delete({ where: { id: genreId } });
    res.json({ success: true, id: genreId });
  } catch (err) {
    next(err);
  }
});

export default router;
