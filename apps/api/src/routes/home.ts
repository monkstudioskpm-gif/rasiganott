import { Router } from 'express';
import { prisma, ensureSchemaUpgrades } from '../db.js';
import { formatTitleResponse } from './titles.js';

const router = Router();

// GET /api/home
router.get('/', async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    let publishedTitles: any[];
    let activeGenres: any[];

    try {
      [publishedTitles, activeGenres] = await Promise.all([
        prisma.title.findMany({
          where: { status: 'PUBLISHED' },
          include: {
            genres: { include: { genre: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 60,
        }),
        prisma.genre.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        }),
      ]);
    } catch (queryErr: any) {
      if (queryErr?.code === 'P2022' || String(queryErr?.message).includes('durationSec')) {
        await ensureSchemaUpgrades();
        [publishedTitles, activeGenres] = await Promise.all([
          prisma.title.findMany({
            where: { status: 'PUBLISHED' },
            include: {
              genres: { include: { genre: true } },
              tags: { include: { tag: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 60,
          }),
          prisma.genre.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          }),
        ]);
      } else {
        throw queryErr;
      }
    }

    const formatted = publishedTitles.map(formatTitleResponse);

    // Featured titles (prefer isFeatured, fallback to latest published)
    const featuredList = formatted.filter((t: any) => t.isFeatured);
    const formattedFeatured = (featuredList.length > 0 ? featuredList : formatted).slice(0, 5);

    // Trending = latest catalog additions
    const formattedTrending = formatted.slice(0, 10);

    // New releases = sorted by published date / creation date desc
    const formattedNewReleases = [...formatted]
      .sort((a: any, b: any) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 10);

    // Top rated = sorted by editorRating desc
    const formattedTopRated = [...formatted]
      .sort((a: any, b: any) => (Number(b.editorRating) || 0) - (Number(a.editorRating) || 0))
      .slice(0, 10);

    // Active genres grouped in-memory without extra round-trip joins
    const formattedGenres = activeGenres
      .map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        titles: formatted
          .filter((t: any) => t.genres?.some((tg: any) => tg.id === g.id || tg.slug === g.slug || tg.name === g.name))
          .slice(0, 12),
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
