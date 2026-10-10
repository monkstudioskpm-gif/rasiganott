import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-rasigan-secret-key-change-in-prod-123456789';

function extractUser(req: Request): { id?: string; email?: string; name?: string } | null {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('rasigan_token='));
    if (match) {
      token = decodeURIComponent(match.split('=')[1]);
    }
  }

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const [b64Header, b64Payload, signature] = parts;
        const expectedSignature = crypto
          .createHmac('sha256', JWT_SECRET)
          .update(`${b64Header}.${b64Payload}`)
          .digest('base64url');

        if (signature === expectedSignature) {
          const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
          if (!payload.exp || payload.exp > Math.floor(Date.now() / 1000)) {
            return {
              id: payload.id,
              email: payload.email,
              name: payload.name,
            };
          }
        }
      }
    } catch {}
  }

  // Fallback to headers or query
  const headerEmail = (req.headers['x-user-email'] as string) || (req.query.email as string) || (req.body?.userEmail as string);
  const headerUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  const headerName = (req.headers['x-user-name'] as string) || (req.query.name as string) || (req.body?.userName as string);

  if (headerUserId || headerEmail) {
    return {
      id: headerUserId,
      email: headerEmail?.toLowerCase().trim(),
      name: headerName?.trim(),
    };
  }

  return null;
}

async function resolveUserId(userObj: { id?: string; email?: string; name?: string } | null): Promise<string> {
  if (userObj?.id) {
    const existing = await prisma.user.findUnique({ where: { id: userObj.id } });
    if (existing) return existing.id;
  }

  if (userObj?.email) {
    const existing = await prisma.user.findUnique({ where: { email: userObj.email } });
    if (existing) return existing.id;

    // Create user if not existing
    const created = await prisma.user.create({
      data: {
        email: userObj.email,
        googleId: `google_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: userObj.name || userObj.email.split('@')[0],
        role: 'USER',
      },
    });
    return created.id;
  }

  // Anonymous guest user fallback
  const guestEmail = 'guest@rasigan.local';
  let guest = await prisma.user.findUnique({ where: { email: guestEmail } });
  if (!guest) {
    guest = await prisma.user.create({
      data: {
        email: guestEmail,
        googleId: 'guest_rasigan_viewer',
        name: 'Guest Viewer',
        role: 'USER',
      },
    });
  }
  return guest.id;
}

// GET /api/progress/:titleId
router.get('/:titleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).titleId as string;
    const user = extractUser(req);

    if (!user) {
      res.json({ progress: null });
      return;
    }

    const userId = await resolveUserId(user);
    const progress = await prisma.watchProgress.findFirst({
      where: {
        userId,
        titleId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ progress });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress (Continue watching list)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = extractUser(req);
    if (!user) {
      res.json({ list: [] });
      return;
    }

    const userId = await resolveUserId(user);
    const progressList = await prisma.watchProgress.findMany({
      where: {
        userId,
        completed: false,
        positionSec: { gt: 5 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        title: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            verticalPosterUrl: true,
            bannerUrl: true,
            durationMin: true,
            kind: true,
            genres: true,
          },
        },
      },
    });

    res.json({ list: progressList });
  } catch (err) {
    next(err);
  }
});

// PUT /api/progress
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { titleId, episodeId, positionSec, durationSec } = req.body;

    if (!titleId || typeof positionSec !== 'number') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleId and positionSec are required' } });
      return;
    }

    const user = extractUser(req);
    const userId = await resolveUserId(user);

    const pos = Math.max(0, Math.floor(positionSec));
    const dur = Math.max(1, Math.floor(durationSec || 0));
    const completed = dur > 10 ? pos >= dur - 15 : false;

    const existing = await prisma.watchProgress.findFirst({
      where: {
        userId,
        titleId,
        episodeId: episodeId || null,
      },
    });

    let saved;
    if (existing) {
      saved = await prisma.watchProgress.update({
        where: { id: existing.id },
        data: {
          positionSec: pos,
          durationSec: dur,
          completed,
          updatedAt: new Date(),
        },
      });
    } else {
      saved = await prisma.watchProgress.create({
        data: {
          userId,
          titleId,
          episodeId: episodeId || null,
          positionSec: pos,
          durationSec: dur,
          completed,
        },
      });
    }

    res.json({ progress: saved });
  } catch (err) {
    next(err);
  }
});

export default router;
