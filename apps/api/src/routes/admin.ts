import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Seed initial payout statements if table is empty
async function ensureInitialPayouts() {
  const count = await prisma.creatorPayout.count();
  if (count === 0) {
    await prisma.creatorPayout.createMany({
      data: [
        {
          statementNumber: 'STMT-2026-09-01',
          creatorName: 'Studio 1 Originals',
          cycle: 'September 2026',
          period: '01 Sep 2026 - 30 Sep 2026',
          grossEarningsInr: 75000,
          platformFeeInr: 30000,
          netPayableInr: 45000,
          status: 'COMPLETED',
          paymentUtrNumber: 'UTR982341029384',
          paidAt: '01 Oct 2026',
        },
        {
          statementNumber: 'STMT-2026-10-01',
          creatorName: 'Studio 1 Originals',
          cycle: 'October 2026 (Current)',
          period: '01 Oct 2026 - 31 Oct 2026',
          grossEarningsInr: 30833,
          platformFeeInr: 12333,
          netPayableInr: 18500,
          status: 'PROCESSING',
          paymentUtrNumber: null,
          paidAt: null,
        },
        {
          statementNumber: 'STMT-2026-09-02',
          creatorName: 'Madurai Indie Films',
          cycle: 'September 2026',
          period: '01 Sep 2026 - 30 Sep 2026',
          grossEarningsInr: 60000,
          platformFeeInr: 24000,
          netPayableInr: 36000,
          status: 'COMPLETED',
          paymentUtrNumber: 'UTR887123901234',
          paidAt: '02 Oct 2026',
        },
      ],
      skipDuplicates: true,
    });
  }
}

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
    await ensureInitialPayouts();
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

export default router;
