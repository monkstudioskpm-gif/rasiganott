import { Router, Request, Response, NextFunction } from 'express';
import { generateFeed, FeedContext } from '../services/feed/index.js';
import { prisma } from '../db.js';

const router = Router();

function extractContext(req: Request): FeedContext {
  const anonId = (req.headers['x-anon-id'] as string) || (req.query.anonId as string) || `anon_${Date.now()}`;
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || null;
  const cursor = (req.query.cursor as string) || null;
  const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    userId,
    anonId,
    requestId,
    limit,
    cursor,
  };
}

// GET /api/feed
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ctx = extractContext(req);
    const feed = await generateFeed(ctx);
    res.json(feed);
  } catch (err) {
    next(err);
  }
});

// GET /api/playback/:titleId
router.get('/playback/:titleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).titleId as string;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
    });

    if (!title) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    const streamUrl = title.verticalVideoUrl || title.videoUrl || title.trailerUrl || '';
    res.json({
      titleId: title.id,
      streamUrl,
      streamType: title.streamType || (streamUrl.includes('.m3u8') ? 'HLS' : 'MP4'),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/feed/events (Batch impression & engagement tracking)
router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId, events } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'events array required' } });
      return;
    }

    const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || null;
    const anonId = (req.headers['x-anon-id'] as string) || (req.body.anonId as string) || 'anon_client';

    for (const ev of events) {
      if (!ev.titleId) continue;

      // Handle qualified FULL view count according to §C8
      if (ev.mode === 'FULL' && ev.watchedSec && ev.watchedSec >= 30) {
        try {
          await prisma.viewEvent.create({
            data: {
              titleId: ev.titleId,
              episodeId: ev.episodeId || null,
              userId: userId || null,
              anonId,
              source: 'FEED_FULL',
            },
          });
        } catch {}
      }

      // Log FeedImpression
      try {
        await prisma.feedImpression.create({
          data: {
            requestId: requestId || `req_batch_${Date.now()}`,
            strategy: ev.strategy || 'v1',
            userId: userId || null,
            anonId,
            titleId: ev.titleId,
            episodeId: ev.episodeId || null,
            mode: ev.mode === 'FULL' ? 'FULL' : 'CLIP',
            clipStartSec: ev.clipStartSec ? Math.floor(ev.clipStartSec) : null,
            clipEndSec: ev.clipEndSec ? Math.floor(ev.clipEndSec) : null,
            position: ev.position || 0,
            watchedSec: ev.watchedSec ? Math.floor(ev.watchedSec) : 0,
            loops: ev.loops || 0,
            skipped: ev.skipped || false,
            clickedWatchFull: ev.clickedWatchFull || false,
            liked: ev.liked || false,
            wishlisted: ev.wishlisted || false,
            openedSupport: ev.openedSupport || false,
          },
        });
      } catch (e) {
        // Safe logging fallback
        console.warn('Could not record feed impression:', e);
      }
    }

    res.json({ success: true, count: events.length });
  } catch (err) {
    next(err);
  }
});

export default router;
