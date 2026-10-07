import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseTitleJsonFields } from './titles.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/home
router.get('/', async (_req, res, next) => {
  try {
    const [featured, categories, newReleases, topRated, trending] = await Promise.all([
      // Featured titles
      prisma.title.findMany({
        where: { status: 'PUBLISHED', isFeatured: true },
        take: 5,
        include: {
          categories: { include: { category: true } },
        },
      }),

      // Active categories with published titles
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          titles: {
            where: { title: { status: 'PUBLISHED' } },
            take: 12,
            include: {
              title: {
                include: {
                  categories: { include: { category: true } },
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
          categories: { include: { category: true } },
        },
      }),

      // Top rated
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { editorRating: 'desc' },
        take: 10,
        include: {
          categories: { include: { category: true } },
        },
      }),

      // Trending
      prisma.title.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          categories: { include: { category: true } },
        },
      }),
    ]);

    const formattedFeatured = featured.map(parseTitleJsonFields);
    const formattedNewReleases = newReleases.map(parseTitleJsonFields);
    const formattedTopRated = topRated.map(parseTitleJsonFields);
    const formattedTrending = trending.map(parseTitleJsonFields);

    const formattedCategories = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        titles: cat.titles.map((tc) => parseTitleJsonFields(tc.title)),
      }))
      .filter((cat) => cat.titles.length > 0);

    res.json({
      featured: formattedFeatured,
      categories: formattedCategories,
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
