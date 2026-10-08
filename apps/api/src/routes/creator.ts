import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import type { CreatorEarningsSummaryDto, CreatorPayoutStatementDto } from '@rasigan/shared';

const router = Router();
const prisma = new PrismaClient();

// GET /api/creator/earnings
router.get('/earnings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const titles = await prisma.title.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        posterUrl: true,
        _count: { select: { fundings: true } },
      },
    });

    const titleEarnings = titles.map((t, index) => {
      const supportersCount = t._count.fundings;
      const mockTotalRaised = supportersCount > 0 ? supportersCount * 500 : (index + 1) * 2500;
      const earningsInr = Math.floor(mockTotalRaised * 0.6); // Calculated internally on server, NOT revealing percentage formula

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
router.get('/payouts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rawPayouts = await prisma.creatorPayout.findMany({
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
router.get('/supporters', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fundings = await prisma.funding.findMany({
      where: { status: 'PAID' },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        title: { select: { title: true } },
      },
    });

    // STRICT RULE: No contribution amounts in creator supporter list!
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
