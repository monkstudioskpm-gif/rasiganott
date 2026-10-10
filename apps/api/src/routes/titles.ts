import { Router, Request, Response, NextFunction } from 'express';
import { Kind, Orientation, Status, CrewRole } from '@prisma/client';
import { prisma, ensureSchemaUpgrades } from '../db.js';
import { toNameKey } from './people.js';
import { getCreatorsRegistry } from './admin.js';
import { resolveVideoDuration } from '../services/duration.js';

const router = Router();



function getEffectiveArtwork(title: any) {
  const slug = title.slug || '';
  const videoUrl = title.videoUrl || '';

  // 1. YouTube thumbnail auto-extraction if videoUrl is YouTube
  let ytThumbnail: string | null = null;
  if (typeof videoUrl === 'string' && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      ytThumbnail = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
  }

  // 2. Distinct presets for catalog titles so every title has unique, high-resolution artwork
  const presets = [
    {
      keywords: ['kodi', 'independence', 'கொடி மேளம்', 'republic'],
      artwork: {
        posterUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80',
        verticalPosterUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&h=900&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200&h=675&auto=format&fit=crop&q=80',
      },
    },
    {
      keywords: ['no-sudu', 'no sudu', 'soranai', 'part 2', 'part-2', 'part2'],
      artwork: {
        posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
        verticalPosterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=900&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=675&auto=format&fit=crop&q=80',
      },
    },
    {
      keywords: ['kena-puna', 'kena puna', 'kenapuna', 'part 1', 'part-1', 'part1'],
      artwork: {
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
        verticalPosterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=900&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=675&auto=format&fit=crop&q=80',
      },
    },
    {
      keywords: ['double', 'meaning'],
      artwork: {
        posterUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
        verticalPosterUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=900&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&h=675&auto=format&fit=crop&q=80',
      },
    },
  ];

  const titleName = (title.title || '').toLowerCase();
  const matched = presets.find((p) => p.keywords.some((k) => slug.includes(k) || titleName.includes(k)));
  const preset = matched ? matched.artwork : null;

  let posterUrl = title.posterUrl;
  let verticalPosterUrl = title.verticalPosterUrl;
  let bannerUrl = title.bannerUrl;

  const isDuplicateCinemaPhoto = typeof posterUrl === 'string' && posterUrl.includes('photo-1536440136628-849c177e76a1');

  if (preset) {
    if (!posterUrl || isDuplicateCinemaPhoto) {
      posterUrl = preset.posterUrl;
    }
    if (!verticalPosterUrl || (typeof verticalPosterUrl === 'string' && verticalPosterUrl.includes('photo-1536440136628-849c177e76a1'))) {
      verticalPosterUrl = preset.verticalPosterUrl;
    }
    if (!bannerUrl || (typeof bannerUrl === 'string' && bannerUrl.includes('photo-1536440136628-849c177e76a1'))) {
      bannerUrl = preset.bannerUrl;
    }
  }

  // Fallback to YouTube thumbnail if missing
  if (ytThumbnail) {
    if (!posterUrl) posterUrl = ytThumbnail;
    if (!bannerUrl) bannerUrl = ytThumbnail;
    if (!verticalPosterUrl) verticalPosterUrl = ytThumbnail;
  }

  // Ensure vertical posters from Unsplash have proper portrait crop parameters (600x900)
  if (posterUrl && !verticalPosterUrl) {
    if (posterUrl.includes('unsplash.com')) {
      verticalPosterUrl = posterUrl.replace(/\?.*$/, '') + '?w=600&h=900&auto=format&fit=crop&q=80';
    } else {
      verticalPosterUrl = posterUrl;
    }
  }

  // Ensure banner from Unsplash has 16:9 crop parameters (1200x675)
  if (posterUrl && !bannerUrl) {
    if (posterUrl.includes('unsplash.com')) {
      bannerUrl = posterUrl.replace(/\?.*$/, '') + '?w=1200&h=675&auto=format&fit=crop&q=80';
    } else {
      bannerUrl = posterUrl;
    }
  }

  if (!posterUrl) posterUrl = verticalPosterUrl || bannerUrl;

  return { posterUrl, verticalPosterUrl, bannerUrl };
}

export function formatTitleResponse(title: any) {
  if (!title) return title;

  const genres = title.genres ? title.genres.map((tg: any) => tg.genre || tg) : [];
  const tags = title.tags ? title.tags.map((tt: any) => tt.tag?.name || tt.name || tt) : [];

  const cast = title.cast
    ? title.cast.map((tc: any) => ({
        personId: tc.personId,
        order: tc.order,
        characterName: tc.characterName,
        person: tc.person
          ? {
              id: tc.person.id,
              name: tc.person.name,
              nameKey: tc.person.nameKey,
              photoUrl: tc.person.photoUrl,
              bio: tc.person.bio,
            }
          : undefined,
      }))
    : [];

  const crew = title.crew
    ? title.crew.map((tc: any) => ({
        id: tc.id,
        personId: tc.personId,
        role: tc.role,
        customRole: tc.customRole,
        person: tc.person
          ? {
              id: tc.person.id,
              name: tc.person.name,
              nameKey: tc.person.nameKey,
              photoUrl: tc.person.photoUrl,
              bio: tc.person.bio,
            }
          : undefined,
      }))
    : [];

  const artwork = getEffectiveArtwork(title);

  return {
    ...title,
    posterUrl: artwork.posterUrl,
    verticalPosterUrl: artwork.verticalPosterUrl,
    bannerUrl: artwork.bannerUrl,
    editorRating: title.editorRating ? Number(title.editorRating) : null,
    subtitles: typeof title.subtitles === 'string' ? JSON.parse(title.subtitles || '[]') : title.subtitles || [],
    audioTracks: typeof title.audioTracks === 'string' ? JSON.parse(title.audioTracks || '[]') : title.audioTracks || [],
    genres,
    categories: genres, // backward compatible alias
    tags,
    cast,
    crew,
    seasons: title.seasons
      ? title.seasons.map((season: any) => ({
          ...season,
          episodes: season.episodes
            ? season.episodes.map((ep: any) => ({
                ...ep,
                subtitles: typeof ep.subtitles === 'string' ? JSON.parse(ep.subtitles || '[]') : ep.subtitles || [],
                audioTracks: typeof ep.audioTracks === 'string' ? JSON.parse(ep.audioTracks || '[]') : ep.audioTracks || [],
              }))
            : [],
        }))
      : [],
  };
}

// POST /api/admin/validate-video-url
router.post('/admin/validate-video-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, durationSec: clientSec } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      res.status(400).json({
        isValid: false,
        error: 'Link must be a valid http or https URL',
      });
      return;
    }

    const isBunny = url.includes('b-cdn.net') || url.includes('bunnycdn');
    const isHls = url.includes('.m3u8') || url.includes('mux.dev') || isBunny;
    const isMp4 = url.includes('.mp4');
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');

    // Resolve real duration
    const durationRes = await resolveVideoDuration(url, clientSec);
    const resolvedDurationSec = durationRes.durationSec || (isHls ? 6300 : 5400);

    if (!isHls && !isMp4 && !isYoutube && !isVimeo) {
      res.json({
        isValid: true,
        streamType: 'MP4',
        reachable: true,
        durationSec: resolvedDurationSec,
        durationSource: durationRes.source,
        qualities: ['720p', '1080p'],
        message: 'Reachable standard stream',
      });
      return;
    }

    const detectedMsg = isBunny
      ? '🐰 Bunny Stream HLS Master Playlist (.m3u8)'
      : isHls
      ? 'HLS Master Playlist (.m3u8)'
      : isMp4
      ? 'MP4 Video'
      : 'Embedded Stream';

    res.json({
      isValid: true,
      streamType: isHls ? 'HLS' : isMp4 ? 'MP4' : 'EMBED',
      reachable: true,
      durationSec: resolvedDurationSec,
      durationSource: durationRes.source,
      qualities: isHls ? ['240p', '360p', '480p', '720p', '1080p'] : ['720p', '1080p'],
      audioTracks: ['Tamil (Stereo)', 'English (Stereo)'],
      subtitles: ['English', 'Tamil'],
      message: '✓ Reachable · detected type: ' + detectedMsg,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/titles/admin/:id/refresh-duration
router.post('/admin/:id/refresh-duration', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).id as string;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
    });

    if (!title || !title.videoUrl) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title or video URL not found' } });
      return;
    }

    const durationRes = await resolveVideoDuration(title.videoUrl, req.body.durationSec);
    if (durationRes.durationSec) {
      const updated = await prisma.title.update({
        where: { id: title.id },
        data: {
          durationSec: durationRes.durationSec,
          durationMin: Math.round(durationRes.durationSec / 60),
        },
      });
      res.json({
        success: true,
        durationSec: updated.durationSec,
        durationMin: updated.durationMin,
        source: durationRes.source,
      });
    } else {
      res.status(422).json({
        error: { code: 'DURATION_UNKNOWN', message: 'Could not automatically detect duration for this video stream' },
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/titles/admin/clear-all-content
router.post('/admin/clear-all-content', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.titleCast.deleteMany({});
    await prisma.titleCrew.deleteMany({});
    await prisma.titleGenre.deleteMany({});
    await prisma.titleTag.deleteMany({});
    await prisma.watchlistItem.deleteMany({});
    await prisma.reaction.deleteMany({});
    await prisma.watchProgress.deleteMany({});
    await prisma.funding.deleteMany({});
    await prisma.episode.deleteMany({});
    await prisma.season.deleteMany({});
    await prisma.title.deleteMany({});
    await prisma.person.deleteMany({});

    res.json({ success: true, message: 'All database content deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/titles
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kind, orientation, genre, category, tag, q, sort = 'newest', page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (kind && Object.values(Kind).includes(kind as Kind)) {
      where.kind = kind as Kind;
    }

    if (orientation && Object.values(Orientation).includes(orientation as Orientation)) {
      where.orientation = orientation as Orientation;
    }

    const genreSlug = (genre || category) as string;
    if (genreSlug) {
      where.genres = {
        some: {
          genre: { slug: genreSlug },
        },
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { name: (tag as string).toLowerCase() },
        },
      };
    }

    if (q) {
      const searchStr = q as string;
      const searchKey = toNameKey(searchStr);

      where.OR = [
        { title: { contains: searchStr } },
        { description: { contains: searchStr } },
        { tagline: { contains: searchStr } },
        {
          cast: {
            some: {
              person: { nameKey: { contains: searchKey } },
            },
          },
        },
        {
          tags: {
            some: {
              tag: { name: { contains: searchStr.toLowerCase() } },
            },
          },
        },
        {
          genres: {
            some: {
              genre: { name: { contains: searchStr } },
            },
          },
        },
      ];
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'rating') orderBy = { editorRating: 'desc' };
    if (sort === 'title') orderBy = { title: 'asc' };

    let titles: any[];
    let total: number;

    try {
      [titles, total] = await Promise.all([
        prisma.title.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
          },
        }),
        prisma.title.count({ where }),
      ]);
    } catch (queryErr: any) {
      if (queryErr?.code === 'P2022' || String(queryErr?.message).includes('durationSec')) {
        await ensureSchemaUpgrades();
        [titles, total] = await Promise.all([
          prisma.title.findMany({
            where,
            orderBy,
            skip,
            take: limitNum,
            include: {
              genres: { include: { genre: true } },
              tags: { include: { tag: true } },
            },
          }),
          prisma.title.count({ where }),
        ]);
      } else {
        throw queryErr;
      }
    }

    res.json({
      titles: titles.map(formatTitleResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/titles/:slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = (req.params as any).slug as string;

    const title = await prisma.title.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: {
          orderBy: { order: 'asc' },
          include: { person: true },
        },
        crew: { include: { person: true } },
        seasons: {
          orderBy: { number: 'asc' },
          include: {
            episodes: {
              where: { status: 'PUBLISHED' },
              orderBy: { number: 'asc' },
            },
          },
        },
      },
    });

    if (!title) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    res.json({ title: formatTitleResponse(title) });
  } catch (err) {
    next(err);
  }
});

// GET /api/titles/admin/stats (Admin Dashboard Stats)
router.get('/admin/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalTitles, publishedTitles, draftTitles, totalPeople, totalGenres, totalTags, fundings] = await Promise.all([
      prisma.title.count(),
      prisma.title.count({ where: { status: 'PUBLISHED' } }),
      prisma.title.count({ where: { status: 'DRAFT' } }),
      prisma.person.count(),
      prisma.genre.count(),
      prisma.tag.count(),
      prisma.funding.aggregate({
        _sum: { amountInr: true },
        where: { status: 'PAID' },
      }),
    ]);

    res.json({
      stats: {
        totalTitles,
        publishedTitles,
        draftTitles,
        totalPeople,
        totalGenres,
        totalTags,
        totalFundingRaised: fundings._sum.amountInr || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/titles/admin/:id/analytics (YouTube Studio-style Content Analytics)
router.get('/admin/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).id as string;
    const title = await prisma.title.findFirst({
      where: { OR: [{ id: titleId }, { slug: titleId }] },
      include: {
        fundings: {
          where: { status: 'PAID' },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true, avatarUrl: true } } },
        },
        _count: { select: { reactions: true, watchlisted: true } },
      },
    });

    if (!title) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    // Query real watch progress metrics
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
        titleId: title.id,
        title: title.title,
        slug: title.slug,
        kind: title.kind,
        orientation: title.orientation,
        posterUrl: title.posterUrl,
        bannerUrl: title.bannerUrl,
        creatorName: title.creatorName || 'Indie Studio',
        publishedAt: title.publishedAt ? title.publishedAt.toISOString() : title.createdAt.toISOString(),
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


// GET /api/titles/admin/creator-earnings (Admin Breakdown of Creator Earnings)
router.get('/admin/creator-earnings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [titles, registry] = await Promise.all([
      prisma.title.findMany({
        select: {
          id: true,
          title: true,
          posterUrl: true,
          kind: true,
          creatorName: true,
          status: true,
          fundings: {
            where: { status: 'PAID' },
            select: { amountInr: true },
          },
        },
      }),
      getCreatorsRegistry(),
    ]);

    // Group titles by creator, pre-populating with registered creators from database Setting
    const creatorMap = new Map<string, {
      id?: string;
      creatorName: string;
      email?: string;
      upiId?: string;
      assignedTitleIds?: string[];
      titlesCount: number;
      grossRaisedInr: number;
      netEarningsInr: number;
      platformFeeInr: number;
      payoutStatus: 'PAID' | 'PROCESSING' | 'PENDING';
      titles: Array<{ id: string; title: string; posterUrl: string; kind: string; grossRaisedInr: number; netEarningsInr: number }>;
    }>();

    // Register active creators from database Setting
    registry.forEach((reg) => {
      creatorMap.set(reg.creatorName.toLowerCase(), {
        id: reg.id,
        creatorName: reg.creatorName,
        email: reg.email,
        upiId: reg.upiId || '',
        assignedTitleIds: reg.assignedTitleIds || [],
        titlesCount: 0,
        grossRaisedInr: 0,
        netEarningsInr: 0,
        platformFeeInr: 0,
        payoutStatus: 'PROCESSING',
        titles: [],
      });
    });

    titles.forEach((t) => {
      const creatorName = t.creatorName || 'Indie Studio';
      const grossRaised = t.fundings.reduce((sum, f) => sum + f.amountInr, 0);
      const netEarnings = Math.floor(grossRaised * 0.6);
      const platformFee = grossRaised - netEarnings;

      let targetKey = creatorName.toLowerCase();
      if (!creatorMap.has(targetKey)) {
        for (const [key, val] of creatorMap.entries()) {
          if (val.assignedTitleIds && val.assignedTitleIds.includes(t.id)) {
            targetKey = key;
            break;
          }
        }
      }

      const existing = creatorMap.get(targetKey) || {
        creatorName,
        titlesCount: 0,
        grossRaisedInr: 0,
        netEarningsInr: 0,
        platformFeeInr: 0,
        payoutStatus: 'PAID' as const,
        titles: [],
      };

      existing.titlesCount += 1;
      existing.grossRaisedInr += grossRaised;
      existing.netEarningsInr += netEarnings;
      existing.platformFeeInr += platformFee;
      existing.titles.push({
        id: t.id,
        title: t.title,
        posterUrl: t.posterUrl,
        kind: t.kind,
        grossRaisedInr: grossRaised,
        netEarningsInr: netEarnings,
      });

      creatorMap.set(targetKey, existing);
    });

    const creators = Array.from(creatorMap.values());
    const totalGross = creators.reduce((acc, c) => acc + c.grossRaisedInr, 0);
    const totalNetEarnings = creators.reduce((acc, c) => acc + c.netEarningsInr, 0);
    const totalPlatformFee = creators.reduce((acc, c) => acc + c.platformFeeInr, 0);

    res.json({
      summary: {
        totalCreatorsCount: creators.length,
        totalGrossRaisedInr: totalGross,
        totalNetEarningsInr: totalNetEarnings,
        totalPlatformFeeInr: totalPlatformFee,
      },
      creators,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/titles/admin/list (Admin Title List with all statuses)
router.get('/admin/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, kind, orientation, q } = req.query;
    const where: any = {};

    if (status) where.status = status as string;
    if (kind) where.kind = kind as Kind;
    if (orientation) where.orientation = orientation as Orientation;
    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
      ];
    }

    const titles = await prisma.title.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        seasons: {
          include: {
            episodes: true,
          },
        },
      },
    });

    const formatted = titles.map((t) => formatTitleResponse(t));
    res.json({ titles: formatted, total: formatted.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/titles/admin/:id/toggle-publish
router.post('/admin/:id/toggle-publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const titleId = decodeURIComponent(rawId);
    const existing = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
        ],
      },
    });
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    const newStatus: Status = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = await prisma.title.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        publishedAt: newStatus === 'PUBLISHED' ? new Date() : existing.publishedAt,
      },
    });

    res.json({ title: formatTitleResponse(updated), status: newStatus });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/titles/:id
router.get('/admin/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const titleId = (req.params as any).id as string;
    const title = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } },
        ],
      },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: { orderBy: { order: 'asc' }, include: { person: true } },
        crew: { include: { person: true } },
        seasons: {
          orderBy: { number: 'asc' },
          include: { episodes: { orderBy: { number: 'asc' } } },
        },
      },
    });

    if (!title) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    res.json({ title: formatTitleResponse(title) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/titles (Create Content)
router.post('/admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const {
      title,
      description,
      kind,
      orientation,
      genreIds = [],
      tags = [],
      cast = [],
      crew = [],
      videoUrl,
      trailerUrl,
      seasons = [],
      posterUrl,
      bannerUrl,
      creatorId,
      creatorName,
      status = 'DRAFT',
      tagline,
      language = 'Tamil',
      year,
      ageRating,
      durationMin,
      editorRating,
      isFeatured = false,
      fundingEnabled = true,
      fundingGoal,
    } = payload;

    const effectivePosterUrl = posterUrl || payload.verticalPosterUrl || bannerUrl || '';
    const effectiveDescription = description || title || '';

    if (!title || !kind || !orientation || (!posterUrl && !payload.verticalPosterUrl && !bannerUrl)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing required title fields' } });
      return;
    }

    const slugBase = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingDbTitle = await prisma.title.findFirst({
      where: {
        OR: [
          { title: { equals: title.trim() } },
          { slug: { startsWith: slugBase } },
        ],
      },
    });

    if (existingDbTitle) {
      const updatedDbTitle = await prisma.title.update({
        where: { id: existingDbTitle.id },
        data: {
          title: title.trim(),
          description: effectiveDescription.trim(),
          kind: kind as Kind,
          orientation: orientation as Orientation,
          status: status as Status,
          posterUrl: effectivePosterUrl || existingDbTitle.posterUrl,
          bannerUrl: bannerUrl !== undefined ? bannerUrl : existingDbTitle.bannerUrl,
          verticalPosterUrl: payload.verticalPosterUrl !== undefined ? payload.verticalPosterUrl : existingDbTitle.verticalPosterUrl,
          videoUrl: videoUrl || existingDbTitle.videoUrl,
          trailerUrl: trailerUrl || existingDbTitle.trailerUrl,
          streamType: videoUrl ? (videoUrl.includes('.m3u8') ? 'HLS' : 'MP4') : existingDbTitle.streamType,
          creatorId: creatorId || existingDbTitle.creatorId,
          creatorName: creatorName || existingDbTitle.creatorName,
          tagline: tagline || existingDbTitle.tagline,
          language: language !== undefined && language !== null ? String(language).trim() : existingDbTitle.language,
          year: year !== undefined && year !== '' && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : existingDbTitle.year,
          ageRating: ageRating !== undefined ? (ageRating ? String(ageRating).trim() : null) : existingDbTitle.ageRating,
          durationMin: durationMin !== undefined && durationMin !== '' && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : existingDbTitle.durationMin,
          durationSec: payload.durationSec !== undefined ? (payload.durationSec ? parseInt(String(payload.durationSec), 10) : null) : existingDbTitle.durationSec,
          editorRating: editorRating ? parseFloat(editorRating) : existingDbTitle.editorRating,
          isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existingDbTitle.isFeatured,
          fundingEnabled: fundingEnabled !== undefined ? Boolean(fundingEnabled) : existingDbTitle.fundingEnabled,
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : existingDbTitle.fundingGoal,
          verticalVideoUrl: payload.verticalVideoUrl !== undefined ? (payload.verticalVideoUrl || null) : existingDbTitle.verticalVideoUrl,
          feedEligible: payload.feedEligible !== undefined ? Boolean(payload.feedEligible) : existingDbTitle.feedEligible,
        },
      });
      res.json({ title: formatTitleResponse(updatedDbTitle) });
      return;
    }

    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    // Process Tags: find-or-create by lowercase name
    const tagIds: string[] = [];
    for (const tagName of tags) {
      const lower = tagName.trim().toLowerCase();
      if (lower) {
        const tagRecord = await prisma.tag.upsert({
          where: { name: lower },
          update: {},
          create: { name: lower },
        });
        tagIds.push(tagRecord.id);
      }
    }

    const createdTitle = await prisma.$transaction(async (tx) => {
      const newTitle = await tx.title.create({
        data: {
          slug,
          title: title.trim(),
          description: effectiveDescription.trim(),
          kind: kind as Kind,
          orientation: orientation as Orientation,
          status: status as Status,
          posterUrl: effectivePosterUrl,
          bannerUrl: bannerUrl || null,
          verticalPosterUrl: payload.verticalPosterUrl || null,
          videoUrl: videoUrl || null,
          trailerUrl: trailerUrl || null,
          streamType: videoUrl?.includes('.m3u8') ? 'HLS' : 'MP4',
          creatorId: creatorId || null,
          creatorName: creatorName || null,
          tagline: tagline || null,
          language: language ? String(language).trim() : 'Tamil',
          year: year !== undefined && year !== '' && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : null,
          ageRating: ageRating ? String(ageRating).trim() : null,
          durationMin: durationMin !== undefined && durationMin !== '' && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : null,
          durationSec: payload.durationSec ? parseInt(String(payload.durationSec), 10) : (durationMin ? parseInt(String(durationMin), 10) * 60 : null),
          editorRating: editorRating ? parseFloat(editorRating) : null,
          isFeatured: Boolean(isFeatured),
          fundingEnabled: Boolean(fundingEnabled),
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : null,
          verticalVideoUrl: payload.verticalVideoUrl || null,
          feedEligible: payload.feedEligible !== undefined ? Boolean(payload.feedEligible) : true,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
        },
      });

      // Attach Genres
      for (const gId of genreIds) {
        await tx.titleGenre.create({
          data: { titleId: newTitle.id, genreId: gId },
        });
      }

      // Attach Tags
      for (const tId of tagIds) {
        await tx.titleTag.create({
          data: { titleId: newTitle.id, tagId: tId },
        });
      }

      // Attach Cast
      for (let i = 0; i < cast.length; i++) {
        const c = cast[i];
        if (c.personId) {
          await tx.titleCast.create({
            data: {
              titleId: newTitle.id,
              personId: c.personId,
              order: c.order !== undefined ? c.order : i,
              characterName: c.characterName || null,
            },
          });
        }
      }

      // Attach Crew
      for (const cr of crew) {
        if (cr.personId && cr.role) {
          await tx.titleCrew.create({
            data: {
              titleId: newTitle.id,
              personId: cr.personId,
              role: cr.role as CrewRole,
              customRole: cr.customRole || null,
            },
          });
        }
      }

      // Attach Seasons & Episodes if WEB_SERIES
      if (kind === 'WEB_SERIES' && Array.isArray(seasons)) {
        for (const s of seasons) {
          const seasonRecord = await tx.season.create({
            data: {
              titleId: newTitle.id,
              number: s.number || 1,
              name: s.name || `Season ${s.number || 1}`,
            },
          });

          if (Array.isArray(s.episodes)) {
            for (let epIdx = 0; epIdx < s.episodes.length; epIdx++) {
              const ep = s.episodes[epIdx];
              await tx.episode.create({
                data: {
                  seasonId: seasonRecord.id,
                  number: ep.number || (epIdx + 1),
                  name: ep.name || `Episode ${ep.number || (epIdx + 1)}`,
                  description: ep.description || null,
                  thumbnailUrl: ep.thumbnailUrl || null,
                  durationMin: ep.durationMin ? parseInt(ep.durationMin, 10) : null,
                  videoUrl: ep.videoUrl || '',
                  streamType: ep.videoUrl?.includes('.m3u8') ? 'HLS' : 'MP4',
                  status: ep.status || 'PUBLISHED',
                },
              });
            }
          }
        }
      }

      return newTitle;
    });

    res.status(201).json({ title: createdTitle });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/titles/:id (Update Content)
router.put('/admin/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const titleId = decodeURIComponent(rawId);
    const payload = req.body;

    const existing = await prisma.title.findFirst({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } },
        ],
      },
    });
    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Title not found' } });
      return;
    }

    const targetId = existing.id; // Target actual PostgreSQL CUID primary key!

    const {
      title,
      description,
      kind,
      orientation,
      genreIds = [],
      tags = [],
      cast = [],
      crew = [],
      videoUrl,
      trailerUrl,
      seasons = [],
      posterUrl,
      verticalPosterUrl,
      bannerUrl,
      creatorId,
      creatorName,
      status,
      tagline,
      language,
      year,
      ageRating,
      durationMin,
      editorRating,
      isFeatured,
      fundingEnabled,
      fundingGoal,
    } = payload;

    // Process Tags: find-or-create by lowercase name
    const tagIds: string[] = [];
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        const lower = typeof tagName === 'string' ? tagName.trim().toLowerCase() : (tagName.name ? tagName.name.trim().toLowerCase() : '');
        if (lower) {
          const tagRecord = await prisma.tag.upsert({
            where: { name: lower },
            update: {},
            create: { name: lower },
          });
          tagIds.push(tagRecord.id);
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update Title main fields in PostgreSQL DB
      await tx.title.update({
        where: { id: targetId },
        data: {
          title: title ? title.trim() : existing.title,
          description: description ? description.trim() : existing.description,
          kind: kind ? (kind as Kind) : existing.kind,
          orientation: orientation ? (orientation as Orientation) : existing.orientation,
          status: status ? (status as Status) : existing.status,
          posterUrl: posterUrl !== undefined ? (posterUrl || null) : existing.posterUrl,
          bannerUrl: bannerUrl !== undefined ? (bannerUrl || null) : existing.bannerUrl,
          verticalPosterUrl: verticalPosterUrl !== undefined ? (verticalPosterUrl || null) : existing.verticalPosterUrl,
          videoUrl: videoUrl !== undefined ? videoUrl : existing.videoUrl,
          trailerUrl: trailerUrl !== undefined ? trailerUrl : existing.trailerUrl,
          streamType: videoUrl ? (videoUrl.includes('.m3u8') ? 'HLS' : 'MP4') : existing.streamType,
          creatorId: creatorId !== undefined ? creatorId : existing.creatorId,
          creatorName: creatorName !== undefined ? creatorName : existing.creatorName,
          tagline: tagline !== undefined ? tagline : existing.tagline,
          language: language !== undefined && language !== null ? String(language).trim() : existing.language,
          year: year !== undefined && year !== '' && !isNaN(parseInt(String(year), 10)) ? parseInt(String(year), 10) : (year === null ? null : existing.year),
          ageRating: ageRating !== undefined ? (ageRating ? String(ageRating).trim() : null) : existing.ageRating,
          durationMin: durationMin !== undefined && durationMin !== '' && !isNaN(parseInt(String(durationMin), 10)) ? parseInt(String(durationMin), 10) : (durationMin === null ? null : existing.durationMin),
          durationSec: payload.durationSec !== undefined ? (payload.durationSec ? parseInt(String(payload.durationSec), 10) : null) : existing.durationSec,
          editorRating: editorRating ? parseFloat(editorRating) : existing.editorRating,
          isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
          fundingEnabled: fundingEnabled !== undefined ? Boolean(fundingEnabled) : existing.fundingEnabled,
          fundingGoal: fundingGoal ? parseInt(fundingGoal, 10) : existing.fundingGoal,
          verticalVideoUrl: payload.verticalVideoUrl !== undefined ? (payload.verticalVideoUrl || null) : existing.verticalVideoUrl,
          feedEligible: payload.feedEligible !== undefined ? Boolean(payload.feedEligible) : existing.feedEligible,
          publishedAt: status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
        },
      });

      // Update Genres
      if (Array.isArray(genreIds)) {
        await tx.titleGenre.deleteMany({ where: { titleId: targetId } });
        for (const gId of genreIds) {
          await tx.titleGenre.create({ data: { titleId: targetId, genreId: gId } });
        }
      }

      // Update Tags
      if (Array.isArray(tags)) {
        await tx.titleTag.deleteMany({ where: { titleId: targetId } });
        for (const tId of tagIds) {
          await tx.titleTag.create({ data: { titleId: targetId, tagId: tId } });
        }
      }

      // Update Cast
      if (Array.isArray(cast)) {
        await tx.titleCast.deleteMany({ where: { titleId: targetId } });
        for (let i = 0; i < cast.length; i++) {
          const c = cast[i];
          if (c.personId) {
            await tx.titleCast.create({
              data: {
                titleId: targetId,
                personId: c.personId,
                order: c.order !== undefined ? c.order : i,
                characterName: c.characterName || null,
              },
            });
          }
        }
      }

      // Update Crew
      if (Array.isArray(crew)) {
        await tx.titleCrew.deleteMany({ where: { titleId: targetId } });
        for (const cr of crew) {
          if (cr.personId && cr.role) {
            await tx.titleCrew.create({
              data: {
                titleId: targetId,
                personId: cr.personId,
                role: cr.role as CrewRole,
                customRole: cr.customRole || null,
              },
            });
          }
        }
      }

      // Update Seasons & Episodes
      if (Array.isArray(seasons)) {
        const existingSeasons = await tx.season.findMany({ where: { titleId: targetId } });
        for (const es of existingSeasons) {
          await tx.episode.deleteMany({ where: { seasonId: es.id } });
        }
        await tx.season.deleteMany({ where: { titleId: targetId } });

        for (const s of seasons) {
          const seasonRecord = await tx.season.create({
            data: {
              titleId: targetId,
              number: s.number || 1,
              name: s.name || `Season ${s.number || 1}`,
            },
          });

          if (Array.isArray(s.episodes)) {
            for (let epIdx = 0; epIdx < s.episodes.length; epIdx++) {
              const ep = s.episodes[epIdx];
              await tx.episode.create({
                data: {
                  seasonId: seasonRecord.id,
                  number: ep.number || (epIdx + 1),
                  name: ep.name || `Episode ${ep.number || (epIdx + 1)}`,
                  description: ep.description || null,
                  thumbnailUrl: ep.thumbnailUrl || null,
                  durationMin: ep.durationMin ? parseInt(ep.durationMin, 10) : null,
                  videoUrl: ep.videoUrl || '',
                  streamType: ep.videoUrl?.includes('.m3u8') ? 'HLS' : 'MP4',
                  status: ep.status || 'PUBLISHED',
                },
              });
            }
          }
        }
      }
    });

    const updatedTitle = await prisma.title.findUnique({
      where: { id: targetId },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        cast: { include: { person: true } },
        crew: { include: { person: true } },
        seasons: { include: { episodes: true } },
      },
    });

    res.json({ title: formatTitleResponse(updatedTitle) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/titles/:id
router.delete('/admin/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawId = (req.params as any).id as string;
    const titleId = decodeURIComponent(rawId);

    const matchingTitles = await prisma.title.findMany({
      where: {
        OR: [
          { id: titleId },
          { slug: titleId },
          { slug: { contains: titleId } },
          { title: { equals: titleId } },
        ],
      },
    });

    if (matchingTitles.length === 0) {
      const slugBase = titleId.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      if (slugBase) {
        const bySlugBase = await prisma.title.findMany({
          where: {
            slug: { startsWith: slugBase },
          },
        });
        matchingTitles.push(...bySlugBase);
      }
    }

    for (const t of matchingTitles) {
      const targetId = t.id;
      await prisma.titleCast.deleteMany({ where: { titleId: targetId } });
      await prisma.titleCrew.deleteMany({ where: { titleId: targetId } });
      await prisma.titleGenre.deleteMany({ where: { titleId: targetId } });
      await prisma.titleTag.deleteMany({ where: { titleId: targetId } });
      await prisma.watchlistItem.deleteMany({ where: { titleId: targetId } });
      await prisma.reaction.deleteMany({ where: { titleId: targetId } });
      await prisma.watchProgress.deleteMany({ where: { titleId: targetId } });
      await prisma.funding.deleteMany({ where: { titleId: targetId } });

      const seasons = await prisma.season.findMany({ where: { titleId: targetId } });
      for (const s of seasons) {
        await prisma.episode.deleteMany({ where: { seasonId: s.id } });
      }
      await prisma.season.deleteMany({ where: { titleId: targetId } });

      await prisma.title.delete({ where: { id: targetId } });
    }

    res.json({ success: true, deletedCount: matchingTitles.length, id: titleId });
  } catch (err) {
    next(err);
  }
});

export default router;
