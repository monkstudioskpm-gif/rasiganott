import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { formatTitleResponse } from './titles.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/home
router.get('/', async (_req, res, next) => {
  try {
    const [featured, genres, newReleases, topRated, trending] = await Promise.all([
      // Featured titles
      prisma.title.findMany({
        where: { status: 'PUBLISHED', isFeatured: true },
        take: 5,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          cast: { include: { person: true } },
          crew: { include: { person: true } },
        },
      }),

      // Active genres with published titles
      prisma.genre.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          titles: {
            where: { title: { status: 'PUBLISHED' } },
            take: 12,
            include: {
              title: {
                include: {
                  genres: { include: { genre: true } },
                  tags: { include: { tag: true } },
                  cast: { include: { person: true } },
                  crew: { include: { person: true } },
                },
              },
            },
          },
        },
      }),

      // New releases
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          cast: { include: { person: true } },
          crew: { include: { person: true } },
        },
      }),

      // Top rated
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { editorRating: 'desc' },
        take: 10,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          cast: { include: { person: true } },
          crew: { include: { person: true } },
        },
      }),

      // Trending
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          cast: { include: { person: true } },
          crew: { include: { person: true } },
        },
      }),
    ]);

    const formattedFeatured = featured.map(formatTitleResponse);
    const formattedNewReleases = newReleases.map(formatTitleResponse);
    const formattedTopRated = topRated.map(formatTitleResponse);
    const formattedTrending = trending.map(formatTitleResponse);

    const formattedGenres = genres
      .map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        titles: g.titles.map((tg) => formatTitleResponse(tg.title)),
      }))
      .filter((g) => g.titles.length > 0);

    res.json({
      featured: formattedFeatured,
      genres: formattedGenres,
      categories: formattedGenres, // fallback key for legacy UI consumers
      trending: formattedTrending,
      newReleases: formattedNewReleases,
      topRated: formattedTopRated,
      mostSupported: formattedTrending,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
