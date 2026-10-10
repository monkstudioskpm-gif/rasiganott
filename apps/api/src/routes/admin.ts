import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

const router = Router();



// GET /api/admin/genres
router.get('/genres', async (_req: Request, res: Response, next: NextFunction) => {
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
router.post('/genres', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Genre name is required' } });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const genre = await prisma.genre.upsert({
      where: { slug },
      update: {
        name: name.trim(),
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : 0,
        isActive: true,
      },
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
router.put('/genres/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = (req.params as any).id as string;
    const { name, sortOrder, isActive } = req.body;

    const updateData: any = {};
    if (name && name.trim()) {
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
router.delete('/genres/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const genreId = (req.params as any).id as string;
    await prisma.genre.delete({ where: { id: genreId } });
    res.json({ success: true, id: genreId });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/payouts
router.get('/payouts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const payouts = await prisma.creatorPayout.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ statements: payouts });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/payouts/:id/complete
router.post('/payouts/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statementId = (req.params as any).id as string;
    const { amountInr, paymentUtrNumber, paidAt } = req.body;

    if (!paymentUtrNumber || !paymentUtrNumber.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Bank payment UTR number is required' } });
      return;
    }

    const updated = await prisma.creatorPayout.update({
      where: { id: statementId },
      data: {
        status: 'COMPLETED',
        netPayableInr: amountInr !== undefined ? parseInt(amountInr, 10) : undefined,
        paymentUtrNumber: paymentUtrNumber.trim(),
        paidAt: paidAt ? paidAt.trim() : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      },
    });

    res.json({ success: true, statement: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/settings
router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settingsList = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json({ settings: settingsMap });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings
router.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings } = req.body; // e.g. { platformFeePercent: "40", currency: "INR" }
    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid settings payload' } });
      return;
    }

    const upsertPromises = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(upsertPromises);

    const updatedList = await prisma.setting.findMany();
    const updatedMap: Record<string, string> = {};
    updatedList.forEach((s) => {
      updatedMap[s.key] = s.value;
    });

    res.json({ success: true, settings: updatedMap });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/search?q=
router.get('/users/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/creators
router.get('/creators', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const payouts = await prisma.creatorPayout.findMany({
      select: { id: true, creatorName: true },
      orderBy: { createdAt: 'desc' },
    });

    const titles = await prisma.title.findMany({
      where: { creatorName: { not: null } },
      select: { creatorName: true },
      distinct: ['creatorName'],
    });

    const set = new Set<string>();
    payouts.forEach((p) => {
      if (p.creatorName && p.creatorName.trim()) set.add(p.creatorName.trim());
    });
    titles.forEach((t) => {
      if (t.creatorName && t.creatorName.trim()) set.add(t.creatorName.trim());
    });

    const creators = Array.from(set).map((name) => ({ creatorName: name }));
    res.json({ creators });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/creators
router.post('/creators', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { creatorName, email } = req.body;
    if (!creatorName || !creatorName.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Creator/Studio name is required' } });
      return;
    }

    const statementNumber = `STMT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const newPayout = await prisma.creatorPayout.create({
      data: {
        creatorName: creatorName.trim(),
        statementNumber,
        cycle: `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()} (New)`,
        period: `01 ${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()} - 30 ${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()}`,
        grossEarningsInr: 0,
        platformFeeInr: 0,
        netPayableInr: 0,
        status: 'PROCESSING',
      },
    });

    res.status(201).json({ success: true, creator: { creatorName: creatorName.trim(), email: email || 'creator@rasigan.com', id: newPayout.id } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/creators/:id
router.put('/creators/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const id = decodeURIComponent(rawId);
    const { creatorName } = req.body;
    if (!creatorName || !creatorName.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Creator name is required' } });
      return;
    }

    const updated = await prisma.creatorPayout.updateMany({
      where: {
        OR: [
          { id },
          { creatorName: id },
        ],
      },
      data: { creatorName: creatorName.trim() },
    });

    res.json({ success: true, updatedCount: updated.count, creatorName: creatorName.trim() });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/creators/:id
router.delete('/creators/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const id = decodeURIComponent(rawId);
    await prisma.creatorPayout.deleteMany({
      where: {
        OR: [
          { id },
          { creatorName: id },
        ],
      },
    });

    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;

