import { Router, Request, Response, NextFunction } from 'express';
import type { CreatorEarningsSummaryDto, CreatorPayoutStatementDto } from '@rasigan/shared';
import { prisma } from '../db.js';

const router = Router();

interface CreatorRegistryItem {
  id: string;
  creatorName: string;
  email: string;
  userId?: string | null;
  upiId?: string;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  assignedTitleIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

async function getCreatorsRegistry(): Promise<CreatorRegistryItem[]> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'CREATOR_REGISTRY' } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {}
  return [];
}

async function saveCreatorsRegistry(registry: CreatorRegistryItem[]) {
  await prisma.setting.upsert({
    where: { key: 'CREATOR_REGISTRY' },
    update: { value: JSON.stringify(registry) },
    create: { key: 'CREATOR_REGISTRY', value: JSON.stringify(registry) },
  });
}

async function getRequestCreator(req: Request) {
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;
  const headerEmail = (req.headers['x-user-email'] as string) || (req.query.email as string);
  const headerName = (req.headers['x-user-name'] as string) || (req.query.creatorName as string);

  let userEmail = headerEmail ? headerEmail.toLowerCase().trim() : '';
  let userName = headerName ? headerName.trim() : '';

  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookieHeader) {
    const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('rasigan_token='));
    if (match) token = decodeURIComponent(match.split('=')[1]);
  }

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.email) userEmail = payload.email.toLowerCase().trim();
        if (payload.name) userName = payload.name.trim();
      }
    } catch {}
  }

  const registry = await getCreatorsRegistry();

  const matched = registry.find(
    (c) =>
      (userEmail && c.email && c.email.toLowerCase() === userEmail) ||
      (userName && c.creatorName && c.creatorName.toLowerCase() === userName.toLowerCase())
  );

  return {
    email: userEmail,
    name: userName,
    creatorName: matched?.creatorName || userName || 'Indie Studio',
    matchedCreator: matched,
  };
}

// GET /api/creator/profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    res.json({
      creator: {
        creatorName: creatorInfo.creatorName,
        email: creatorInfo.email,
        upiId: creatorInfo.matchedCreator?.upiId || '',
        status: creatorInfo.matchedCreator?.status || 'ACTIVE',
        assignedTitleIds: creatorInfo.matchedCreator?.assignedTitleIds || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/creator/profile (Update UPI ID)
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorInfo = await getRequestCreator(req);
    const { upiId } = req.body;

    const registry = await getCreatorsRegistry();
    let updatedItem: CreatorRegistryItem | null = null;

    const targetIndex = registry.findIndex(
      (c) =>
        (creatorInfo.email && c.email && c.email.toLowerCase() === creatorInfo.email) ||
        (creatorInfo.creatorName && c.creatorName && c.creatorName.toLowerCase() === creatorInfo.creatorName.toLowerCase())
    );

    if (targetIndex >= 0) {
      registry[targetIndex].upiId = (upiId || '').trim();
      registry[targetIndex].updatedAt = new Date().toISOString();
      updatedItem = registry[targetIndex];
    } else {
      updatedItem = {
        id: `c_${Date.now()}`,
        creatorName: creatorInfo.creatorName,
        email: creatorInfo.email || '',
        upiId: (upiId || '').trim(),
        status: 'ACTIVE',
        assignedTitleIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      registry.push(updatedItem);
    }

    await saveCreatorsRegistry(registry);

    res.json({
      message: 'Creator profile updated successfully',
      creator: updatedItem,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/creator/earnings
router.get('/earnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorInfo = await getRequestCreator(req);

    const orConditions: any[] = [
      { creatorName: { equals: creatorInfo.creatorName, mode: 'insensitive' } },
    ];
    if (creatorInfo.email) {
      orConditions.push({ creatorId: creatorInfo.email });
    }
    if (creatorInfo.matchedCreator?.assignedTitleIds?.length) {
      orConditions.push({ id: { in: creatorInfo.matchedCreator.assignedTitleIds } });
    }

    const titles = await prisma.title.findMany({
      where: { OR: orConditions },
      select: {
        id: true,
        title: true,
        posterUrl: true,
        fundings: {
          where: { status: 'PAID' },
          select: { amountInr: true },
        },
      },
    });

    const titleIds = titles.map((t) => t.id);
    const progressList = titleIds.length > 0
      ? await prisma.watchProgress.findMany({
          where: { titleId: { in: titleIds } },
          select: { titleId: true, positionSec: true },
        })
      : [];

    const viewsMap = new Map<string, number>();
    const watchTimeSecMap = new Map<string, number>();
    progressList.forEach((p) => {
      viewsMap.set(p.titleId, (viewsMap.get(p.titleId) || 0) + 1);
      watchTimeSecMap.set(p.titleId, (watchTimeSecMap.get(p.titleId) || 0) + p.positionSec);
    });

    const titleEarnings = titles.map((t) => {
      const supportersCount = t.fundings.length;
      const totalRaised = t.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const earningsInr = Math.floor(totalRaised * 0.6);
      const viewsCount = viewsMap.get(t.id) || 0;
      const watchTimeSec = watchTimeSecMap.get(t.id) || 0;

      return {
        titleId: t.id,
        title: t.title,
        posterUrl: t.posterUrl,
        viewsCount,
        watchTimeMinutes: Math.round(watchTimeSec / 60),
        supportersCount,
        earningsInr,
      };
    });

    // Real payouts from database
    const payouts = await prisma.creatorPayout.findMany({
      where: {
        creatorName: { equals: creatorInfo.creatorName, mode: 'insensitive' },
      },
    });
    const paidSoFarInr = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.netPayableInr, 0);

    const totalEarnings = titleEarnings.reduce((acc, cur) => acc + cur.earningsInr, 0);
    const pendingPayoutInr = Math.max(0, totalEarnings - paidSoFarInr);

    const dto: CreatorEarningsSummaryDto = {
      earningsInr: totalEarnings,
      pendingPayoutInr,
      paidSoFarInr,
      titles: titleEarnings,
    };

    res.json(dto);
  } catch (err) {
    next(err);
  }
});

// GET /api/creator/analytics/:id (Title studio analytics for creator)
router.get('/analytics/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).id as string;
    const creatorInfo = await getRequestCreator(req);

    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
      include: {
        fundings: {
          where: { status: 'PAID' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reactions: true } },
      },
    });

    if (!title) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    const isOwner =
      (title.creatorName && title.creatorName.toLowerCase() === creatorInfo.creatorName.toLowerCase()) ||
      (creatorInfo.email && title.creatorId === creatorInfo.email) ||
      (creatorInfo.matchedCreator?.assignedTitleIds?.includes(title.id));

    if (!isOwner) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized access to title analytics' } });
      return;
    }

    const [viewsCount, progressStats] = await Promise.all([
      prisma.watchProgress.count({ where: { titleId: title.id } }),
      prisma.watchProgress.aggregate({
        where: { titleId: title.id },
        _sum: { positionSec: true },
      }),
    ]);

    const totalFundingRaisedInr = title.fundings.reduce((sum, f) => sum + f.amountInr, 0);

    const payments = title.fundings.map((f) => ({
      id: f.id,
      amountInr: f.amountInr,
      donorName: f.isAnonymous ? 'Anonymous Supporter' : f.user.name,
      donorEmail: f.isAnonymous ? 'anonymous@privacy.org' : f.user.email,
      razorpayPaymentId: f.razorpayPaymentId || `pay_rzp_${f.id}`,
      paidAt: f.paidAt ? f.paidAt.toISOString() : f.createdAt.toISOString(),
      status: f.status,
      message: f.message || null,
    }));

    const watchTimeSeconds = progressStats._sum.positionSec || 0;
    const watchTimeHours = Math.round((watchTimeSeconds / 3600) * 10) / 10;

    res.json({
      analytics: {
        id: title.id,
        title: title.title,
        posterUrl: title.posterUrl,
        kind: title.kind,
        status: title.status,
        creatorName: title.creatorName || creatorInfo.creatorName,
        fundingGoal: title.fundingGoal || 200000,
        fundingRaised: totalFundingRaisedInr,
        fundingPercent: Math.min(100, Math.round((totalFundingRaisedInr / (title.fundingGoal || 200000)) * 100)),
        supportersCount: payments.length,
        totalViews: viewsCount,
        watchTimeHours,
        editorRating: title.editorRating ? Number(title.editorRating) : 9.0,
        likesCount: title._count.reactions || 0,
        payments,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/creator/payouts
router.get('/payouts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorInfo = await getRequestCreator(req);

    const rawPayouts = await prisma.creatorPayout.findMany({
      where: {
        creatorName: { equals: creatorInfo.creatorName, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const statements: CreatorPayoutStatementDto[] = rawPayouts.map((p) => ({
      id: p.id,
      cycle: p.cycle,
      period: p.period,
      earningsInr: p.netPayableInr,
      adjustmentsInr: 0,
      netPayableInr: p.netPayableInr,
      status: p.status === 'COMPLETED' ? 'PAID' : 'PROCESSING',
      referenceUtr: p.paymentUtrNumber || undefined,
      titles: [],
    }));

    res.json({ statements });
  } catch (err) {
    next(err);
  }
});

// GET /api/creator/supporters
router.get('/supporters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorInfo = await getRequestCreator(req);

    const fundings = await prisma.funding.findMany({
      where: {
        status: 'PAID',
        title: {
          OR: [
            { creatorName: { equals: creatorInfo.creatorName, mode: 'insensitive' } },
            ...(creatorInfo.email ? [{ creatorId: creatorInfo.email }] : []),
            ...(creatorInfo.matchedCreator?.assignedTitleIds?.length ? [{ id: { in: creatorInfo.matchedCreator.assignedTitleIds } }] : []),
          ],
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        title: { select: { title: true } },
      },
    });

    const supporters = fundings.map((f) => ({
      id: f.id,
      title: f.title.title,
      supporterName: f.isAnonymous ? 'Anonymous Supporter' : f.user.name,
      avatarUrl: f.isAnonymous ? null : f.user.avatarUrl,
      message: f.message || null,
      date: f.createdAt.toISOString(),
    }));

    res.json({ supporters });
  } catch (err) {
    next(err);
  }
});

export default router;
