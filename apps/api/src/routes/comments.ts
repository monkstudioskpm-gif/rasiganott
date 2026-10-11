import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { authenticateUser } from './auth.js';
import { commentBus } from '../services/commentBus.js';

const router = Router();

// In-memory sliding window rate limiter: max 5 comments per 60s per user
const userCommentTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  let timestamps = userCommentTimestamps.get(userId);
  if (!timestamps) {
    timestamps = [];
    userCommentTimestamps.set(userId, timestamps);
  }

  // Filter out timestamps older than 60s
  const recent = timestamps.filter((t) => now - t < windowMs);
  userCommentTimestamps.set(userId, recent);

  if (recent.length >= 5) {
    return false; // Rate limit exceeded
  }

  recent.push(now);
  return true;
}

/**
 * GET /api/comments/stream
 * Server-Sent Events (SSE) realtime comment stream
 */
router.get('/stream', async (req: Request, res: Response): Promise<void> => {
  const titleId = req.query.titleId as string;
  const episodeId = (req.query.episodeId as string) || null;

  if (!titleId || typeof titleId !== 'string') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleId query parameter is required' } });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ titleId, episodeId, time: Date.now() })}\n\n`);

  // Handle Last-Event-ID reconnection
  const lastEventId = (req.headers['last-event-id'] || req.query.lastEventId) as string;
  if (lastEventId) {
    const missed = commentBus.getMissedEvents(titleId, episodeId, lastEventId);
    for (const evt of missed) {
      res.write(`id: ${evt.id}\nevent: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
    }
  }

  // Subscribe to realtime comment events
  const unsubscribe = commentBus.subscribe(titleId, episodeId, (evt) => {
    res.write(`id: ${evt.id}\nevent: ${evt.type}\ndata: ${JSON.stringify(evt.data)}\n\n`);
  });

  // 25s Heartbeat to prevent socket timeouts
  const heartbeat = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

/**
 * GET /api/comments
 * Public list of VISIBLE comments, newest first with cursor pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const titleId = req.query.titleId as string;
    const episodeId = (req.query.episodeId as string) || null;
    const cursor = (req.query.cursor as string) || undefined;
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));

    if (!titleId || typeof titleId !== 'string') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleId is required' } });
      return;
    }

    const whereClause: Record<string, unknown> = {
      titleId,
      status: 'VISIBLE',
      episodeId: episodeId && episodeId.trim().length > 0 ? episodeId : null,
    };

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: whereClause,
      }),
    ]);

    let nextCursor: string | null = null;
    let items = comments;
    if (comments.length > limit) {
      const nextItem = comments[limit];
      nextCursor = nextItem.id;
      items = comments.slice(0, limit);
    }

    const formattedComments = items.map((c) => ({
      id: c.id,
      titleId: c.titleId,
      episodeId: c.episodeId,
      userId: c.userId,
      body: c.body,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    }));

    res.json({
      comments: formattedComments,
      nextCursor,
      totalCount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/comments
 * Authenticated user creates a new comment
 */
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'You must be signed in to post a comment' },
      });
      return;
    }

    if (user.role === 'SUSPENDED') {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Your account is suspended from commenting' },
      });
      return;
    }

    const { titleId, episodeId, body } = req.body || {};

    if (!titleId || typeof titleId !== 'string') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleId is required' } });
      return;
    }

    // Strip control characters & validate body
    const rawBody = String(body || '');
    const cleanBody = rawBody.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

    if (cleanBody.length < 1 || cleanBody.length > 500) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Comment must be between 1 and 500 characters after trimming',
        },
      });
      return;
    }

    // Rate limit check: max 5 comments per minute
    if (!checkRateLimit(user.id)) {
      res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: "You're commenting too fast. Please wait a moment before posting again.",
        },
      });
      return;
    }

    // Verify Title exists and is PUBLISHED
    const title = await prisma.title.findUnique({
      where: { id: titleId },
      select: { id: true, status: true },
    });

    if (!title || title.status !== 'PUBLISHED') {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Title not found or not published' },
      });
      return;
    }

    // Verify Episode exists and is PUBLISHED if episodeId provided
    const targetEpisodeId = episodeId && typeof episodeId === 'string' && episodeId.trim().length > 0 ? episodeId.trim() : null;
    if (targetEpisodeId) {
      const ep = await prisma.episode.findUnique({
        where: { id: targetEpisodeId },
        select: { id: true, status: true },
      });
      if (!ep || ep.status !== 'PUBLISHED') {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Episode not found or not published' },
        });
        return;
      }
    }

    // Create comment
    const created = await prisma.comment.create({
      data: {
        titleId,
        episodeId: targetEpisodeId,
        userId: user.id,
        body: cleanBody,
        status: 'VISIBLE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const commentDto = {
      id: created.id,
      titleId: created.titleId,
      episodeId: created.episodeId,
      userId: created.userId,
      body: created.body,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      user: created.user,
    };

    // Broadcast live to all viewers on this title / episode
    commentBus.emitCreated(titleId, targetEpisodeId, commentDto);

    res.status(201).json({ comment: commentDto });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/comments/:id
 * Author only soft delete (sets status = DELETED)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const commentId = String(req.params.id);
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.status === 'DELETED') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found' } });
      return;
    }

    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You can only delete your own comments' },
      });
      return;
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { status: 'DELETED' },
    });

    // Broadcast deletion in realtime
    commentBus.emitDeleted(comment.titleId, comment.episodeId, comment.id);

    res.json({ success: true, id: comment.id });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/comments/:id/report
 * Authenticated user reports a comment
 */
router.post('/:id/report', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required to report' } });
      return;
    }

    const commentId = String(req.params.id);
    const reason = req.body?.reason ? String(req.body.reason).slice(0, 200) : null;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found' } });
      return;
    }

    await prisma.commentReport.upsert({
      where: { commentId_userId: { commentId, userId: user.id } },
      update: { reason },
      create: { commentId, userId: user.id, reason },
    });

    res.json({ success: true, message: 'Comment reported successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
