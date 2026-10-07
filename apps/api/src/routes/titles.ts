import { Router } from 'express';
import { PrismaClient, Kind, Orientation } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

export function parseTitleJsonFields(title: any) {
  if (!title) return title;
  return {
    ...title,
    editorRating: title.editorRating ? Number(title.editorRating) : null,
    subtitles: typeof title.subtitles === 'string' ? JSON.parse(title.subtitles || '[]') : title.subtitles,
    audioTracks: typeof title.audioTracks === 'string' ? JSON.parse(title.audioTracks || '[]') : title.audioTracks,
    castNames: typeof title.castNames === 'string' ? JSON.parse(title.castNames || '[]') : title.castNames,
    crewCredits: typeof title.crewCredits === 'string' ? JSON.parse(title.crewCredits || '[]') : title.crewCredits,
    categories: title.categories ? title.categories.map((tc: any) => tc.category || tc) : [],
    seasons: title.seasons
      ? title.seasons.map((season: any) => ({
          ...season,
          episodes: season.episodes
            ? season.episodes.map((ep: any) => ({
                ...ep,
                subtitles: typeof ep.subtitles === 'string' ? JSON.parse(ep.subtitles || '[]') : ep.subtitles,
                audioTracks: typeof ep.audioTracks === 'string' ? JSON.parse(ep.audioTracks || '[]') : ep.audioTracks,
              }))
            : [],
        }))
      : [],
  };
}

// GET /api/titles
router.get('/', async (req, res, next) => {
  try {
    const { kind, orientation, category, q, sort = 'newest', page = '1', limit = '20' } = req.query;

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

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category as string,
          },
        },
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q as string } },
        { description: { contains: q as string } },
        { tagline: { contains: q as string } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'rating') orderBy = { editorRating: 'desc' };
    if (sort === 'title') orderBy = { title: 'asc' };

    const [titles, total] = await Promise.all([
      prisma.title.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          categories: {
            include: { category: true },
          },
        },
      }),
      prisma.title.count({ where }),
    ]);

    const formattedTitles = titles.map(parseTitleJsonFields);

    res.json({
      titles: formattedTitles,
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
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const title = await prisma.title.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        categories: {
          include: { category: true },
        },
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

    res.json({ title: parseTitleJsonFields(title) });
  } catch (err) {
    next(err);
  }
});

export default router;
