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

export interface CreatorRegistryItem {
  id: string;
  creatorName: string;
  email: string;
  userId?: string;
  upiId?: string;
  status?: string;
  assignedTitleIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getCreatorsRegistry(): Promise<CreatorRegistryItem[]> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'CREATOR_REGISTRY' } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {}

  // Fallback initial registry seeded from database titles
  return [
    {
      id: 'c_cupice',
      creatorName: 'Cupice productions',
      email: 'cupice@rasigan.com',
      status: 'ACTIVE',
      assignedTitleIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export async function saveCreatorsRegistry(list: CreatorRegistryItem[]) {
  const jsonStr = JSON.stringify(list);
  await prisma.setting.upsert({
    where: { key: 'CREATOR_REGISTRY' },
    update: { value: jsonStr },
    create: { key: 'CREATOR_REGISTRY', value: jsonStr },
  });

  const emails = list.map((c) => c.email.toLowerCase().trim()).filter(Boolean);
  await prisma.setting.upsert({
    where: { key: 'CREATOR_EMAILS' },
    update: { value: emails.join(',') },
    create: { key: 'CREATOR_EMAILS', value: emails.join(',') },
  });
}

// GET /api/admin/creators
router.get('/creators', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const registry = await getCreatorsRegistry();
    const titles = await prisma.title.findMany({
      select: {
        id: true,
        title: true,
        creatorName: true,
        posterUrl: true,
        fundings: {
          where: { status: 'PAID' },
          select: { amountInr: true },
        },
      },
    });
    const payouts = await prisma.creatorPayout.findMany();

    // Map each creator with real title count and earnings from database
    const creatorsWithStats = registry.map((c) => {
      const matchingTitles = titles.filter(
        (t) =>
          (t.creatorName && t.creatorName.toLowerCase() === c.creatorName.toLowerCase()) ||
          (c.assignedTitleIds && c.assignedTitleIds.includes(t.id))
      );
      const matchingPayouts = payouts.filter(
        (p) => p.creatorName.toLowerCase() === c.creatorName.toLowerCase()
      );
      const grossRaisedInr = matchingTitles.reduce(
        (sum, t) => sum + t.fundings.reduce((fSum, f) => fSum + f.amountInr, 0),
        0
      );
      const netPayable = matchingPayouts.reduce((sum, p) => sum + p.netPayableInr, 0);
      const netEarningsInr = netPayable > 0 ? netPayable : Math.floor(grossRaisedInr * 0.6);

      return {
        id: c.id,
        creatorName: c.creatorName,
        email: c.email,
        userId: c.userId,
        upiId: c.upiId || '',
        status: c.status || 'ACTIVE',
        titlesCount: matchingTitles.length,
        netEarningsInr,
        grossRaisedInr,
        assignedTitleIds: c.assignedTitleIds && c.assignedTitleIds.length > 0 ? c.assignedTitleIds : matchingTitles.map((t) => t.id),
      };
    });

    res.json({ creators: creatorsWithStats });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/creators
router.post('/creators', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { creatorName, email, userId, upiId, assignedTitleIds } = req.body;
    if (!creatorName || !creatorName.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Creator/Studio name is required' } });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Creator email is required' } });
      return;
    }

    const cleanName = creatorName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const registry = await getCreatorsRegistry();

    const newCreator: CreatorRegistryItem = {
      id: `c_${Date.now()}`,
      creatorName: cleanName,
      email: cleanEmail,
      userId,
      upiId: upiId?.trim() || '',
      status: 'ACTIVE',
      assignedTitleIds: Array.isArray(assignedTitleIds) ? assignedTitleIds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = registry.findIndex(
      (c) => c.email.toLowerCase() === cleanEmail || c.creatorName.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingIdx !== -1) {
      registry[existingIdx] = { ...registry[existingIdx], ...newCreator, id: registry[existingIdx].id };
    } else {
      registry.push(newCreator);
    }

    await saveCreatorsRegistry(registry);

    // If titles are assigned, update them in database
    if (Array.isArray(assignedTitleIds) && assignedTitleIds.length > 0) {
      await prisma.title.updateMany({
        where: { id: { in: assignedTitleIds } },
        data: { creatorName: cleanName, creatorId: cleanEmail },
      });
    }

    // Ensure CreatorPayout record exists in database
    const existingPayout = await prisma.creatorPayout.findFirst({
      where: { creatorName: { equals: cleanName, mode: 'insensitive' } },
    });
    if (!existingPayout) {
      const statementNumber = `STMT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      await prisma.creatorPayout.create({
        data: {
          creatorName: cleanName,
          statementNumber,
          cycle: `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`,
          period: `01 ${new Date().toLocaleString('en-US', { month: 'short' })} - 30 ${new Date().toLocaleString('en-US', { month: 'short' })} ${new Date().getFullYear()}`,
          grossEarningsInr: 0,
          platformFeeInr: 0,
          netPayableInr: 0,
          status: 'PROCESSING',
        },
      });
    }

    res.status(201).json({ success: true, creator: newCreator });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/creators/:id
router.put('/creators/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const id = decodeURIComponent(rawId);
    const { creatorName, email, upiId, status, assignedTitleIds } = req.body;

    const registry = await getCreatorsRegistry();
    const idx = registry.findIndex(
      (c) => c.id === id || c.creatorName.toLowerCase() === id.toLowerCase() || c.email.toLowerCase() === id.toLowerCase()
    );

    if (idx === -1) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Creator not found' } });
      return;
    }

    const prevName = registry[idx].creatorName;
    const updatedName = creatorName && creatorName.trim() ? creatorName.trim() : prevName;
    const updatedEmail = email && email.trim() ? email.toLowerCase().trim() : registry[idx].email;

    registry[idx] = {
      ...registry[idx],
      creatorName: updatedName,
      email: updatedEmail,
      upiId: upiId !== undefined ? upiId.trim() : registry[idx].upiId,
      status: status || registry[idx].status || 'ACTIVE',
      assignedTitleIds: Array.isArray(assignedTitleIds) ? assignedTitleIds : registry[idx].assignedTitleIds,
      updatedAt: new Date().toISOString(),
    };

    await saveCreatorsRegistry(registry);

    // Update CreatorPayout in database
    await prisma.creatorPayout.updateMany({
      where: { creatorName: { equals: prevName, mode: 'insensitive' } },
      data: { creatorName: updatedName },
    });

    // Update assigned titles in database
    if (Array.isArray(assignedTitleIds)) {
      if (assignedTitleIds.length > 0) {
        await prisma.title.updateMany({
          where: { id: { in: assignedTitleIds } },
          data: { creatorName: updatedName, creatorId: updatedEmail },
        });
      }
    } else if (updatedName !== prevName) {
      await prisma.title.updateMany({
        where: { creatorName: { equals: prevName, mode: 'insensitive' } },
        data: { creatorName: updatedName },
      });
    }

    res.json({ success: true, creator: registry[idx] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/creators/:id
router.delete('/creators/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const id = decodeURIComponent(rawId);

    const registry = await getCreatorsRegistry();
    const filtered = registry.filter(
      (c) => c.id !== id && c.creatorName.toLowerCase() !== id.toLowerCase() && c.email.toLowerCase() !== id.toLowerCase()
    );
    await saveCreatorsRegistry(filtered);

    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;

