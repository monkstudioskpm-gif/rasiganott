import { Router, Request, Response, NextFunction } from 'express';
import type { CreatorEarningsSummaryDto, CreatorPayoutStatementDto } from '@rasigan/shared';
import { prisma } from '../db.js';

const router = Router();

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

  // Look up creator in database Setting registry
  let registry: any[] = [];
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'CREATOR_REGISTRY' } });
    if (setting?.value) registry = JSON.parse(setting.value);
  } catch {}

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
        _count: { select: { fundings: true } },
      },
    });

    const titleEarnings = titles.map((t, index) => {
      const supportersCount = t._count.fundings;
      const totalRaised = supportersCount > 0 ? supportersCount * 500 : (index + 1) * 2500;
      const earningsInr = Math.floor(totalRaised * 0.6);

      return {
        titleId: t.id,
        title: t.title,
        posterUrl: t.posterUrl,
        viewsCount: (index + 1) * 1420 + 850,
        watchTimeMinutes: (index + 1) * 3200 + 410,
        supportersCount,
        earningsInr,
      };
    });

    const totalEarnings = titleEarnings.reduce((acc, cur) => acc + cur.earningsInr, 0);

    const dto: CreatorEarningsSummaryDto = {
      earningsInr: totalEarnings,
      pendingPayoutInr: Math.floor(totalEarnings * 0.25),
      paidSoFarInr: Math.floor(totalEarnings * 0.75),
      titles: titleEarnings,
    };

    res.json(dto);
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
