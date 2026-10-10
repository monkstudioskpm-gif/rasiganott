import { prisma } from '../../db.js';
import { Candidate, FeedContext } from './strategy.js';

export function decidePlaybackMode(title: any, episode?: any): { mode: 'CLIP' | 'FULL' | null; streamUrl: string | null; durationSec: number } {
  // 1. Priority 1: Admin-supplied vertical cut link
  if (title.verticalVideoUrl && typeof title.verticalVideoUrl === 'string' && title.verticalVideoUrl.startsWith('http')) {
    const dur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 5400);
    return { mode: 'FULL', streamUrl: title.verticalVideoUrl, durationSec: dur };
  }

  // 2. Priority 2: Title orientation is VERTICAL
  if (title.orientation === 'VERTICAL') {
    const dur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 5400);
    const url = title.videoUrl || title.trailerUrl;
    if (url) {
      return { mode: 'FULL', streamUrl: url, durationSec: dur };
    }
  }

  // 3. Priority 3: Landscape content (Movie, Short Film, or Web Series)
  if (title.kind === 'WEB_SERIES') {
    // For series: clipped only from Episode 1-3
    const ep = episode || title.seasons?.[0]?.episodes?.[0];
    if (ep && ep.videoUrl) {
      const epDur = ep.durationSec || (ep.durationMin ? ep.durationMin * 60 : 1800);
      return { mode: 'CLIP', streamUrl: ep.videoUrl, durationSec: epDur };
    }
  }

  // Movie or Short Film
  const movieUrl = title.videoUrl || title.trailerUrl;
  const movieDur = title.durationSec || (title.durationMin ? title.durationMin * 60 : 0);

  if (movieUrl && movieDur > 0) {
    return { mode: 'CLIP', streamUrl: movieUrl, durationSec: movieDur };
  }

  return { mode: null, streamUrl: null, durationSec: 0 };
}

export async function generateCandidates(ctx: FeedContext): Promise<Candidate[]> {
  try {
    // Recent impressions to exclude (last 20 for this user or anonId)
    let excludedTitleIds: string[] = [];
    try {
      const recentImpressions = await prisma.feedImpression.findMany({
        where: {
          OR: [
            ...(ctx.userId ? [{ userId: ctx.userId }] : []),
            ...(ctx.anonId ? [{ anonId: ctx.anonId }] : []),
          ],
        },
        select: { titleId: true },
        orderBy: { shownAt: 'desc' },
        take: 20,
      });
      excludedTitleIds = recentImpressions.map((imp) => imp.titleId);
    } catch {
      // If table empty or migration pending
      excludedTitleIds = [];
    }

    // Completed titles to exclude for logged-in users
    let completedTitleIds: string[] = [];
    if (ctx.userId) {
      try {
        const completed = await prisma.watchProgress.findMany({
          where: { userId: ctx.userId, completed: true },
          select: { titleId: true },
        });
        completedTitleIds = completed.map((c) => c.titleId);
      } catch {}
    }

    const titles = await prisma.title.findMany({
      where: {
        status: 'PUBLISHED',
        feedEligible: true,
        id: {
          notIn: Array.from(new Set([...excludedTitleIds, ...completedTitleIds])),
        },
      },
      include: {
        genres: { include: { genre: true } },
        seasons: {
          include: {
            episodes: {
              where: { number: { lte: 3 } },
              orderBy: { number: 'asc' },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            fundings: true,
          },
        },
      },
      take: 60,
    });

    const candidates: Candidate[] = [];

    for (const title of titles) {
      let chosenEpisode: any = null;
      if (title.kind === 'WEB_SERIES') {
        const eligibleEpisodes = title.seasons?.[0]?.episodes || [];
        if (eligibleEpisodes.length > 0) {
          // Pick one random episode among Episodes 1-3
          chosenEpisode = eligibleEpisodes[Math.floor(Math.random() * eligibleEpisodes.length)];
        }
      }

      const decision = decidePlaybackMode(title, chosenEpisode);
      if (decision.mode && decision.streamUrl && decision.durationSec >= 25) {
        candidates.push({
          title,
          episode: chosenEpisode,
          mode: decision.mode,
          durationSec: decision.durationSec,
          streamUrl: decision.streamUrl,
        });
      }
    }

    // If candidate pool was small due to exclusions, fallback without recent impression filter
    if (candidates.length < 5) {
      const fallbackTitles = await prisma.title.findMany({
        where: {
          status: 'PUBLISHED',
          feedEligible: true,
        },
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: {
              episodes: { where: { number: { lte: 3 } } },
            },
          },
          _count: { select: { reactions: true, fundings: true } },
        },
        take: 30,
      });

      for (const title of fallbackTitles) {
        if (!candidates.some((c) => c.title.id === title.id)) {
          const decision = decidePlaybackMode(title);
          if (decision.mode && decision.streamUrl && decision.durationSec >= 25) {
            candidates.push({
              title,
              episode: null,
              mode: decision.mode,
              durationSec: decision.durationSec,
              streamUrl: decision.streamUrl,
            });
          }
        }
      }
    }

    return candidates;
  } catch (err) {
    console.error('Candidate generation failed:', err);
    return [];
  }
}
