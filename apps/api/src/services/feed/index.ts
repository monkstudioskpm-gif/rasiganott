import { FeedStrategy, FeedContext } from './strategy.js';
export type { FeedContext } from './strategy.js';
import { StrategyV1 } from './strategies/v1.js';
import { pickClip, ClipSettings } from './clip.js';
import { prisma } from '../../db.js';

const strategies: Record<string, FeedStrategy> = {
  v1: new StrategyV1(),
};

async function getActiveStrategyId(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'feedStrategy' } });
    if (setting?.value && strategies[setting.value]) {
      return setting.value;
    }
  } catch {}
  return 'v1';
}

async function getFeedClipSettings(): Promise<ClipSettings> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'feedClipSettings' } });
    if (setting?.value) {
      return JSON.parse(setting.value);
    }
  } catch {}
  return {
    feedClipMinSec: 30,
    feedClipMaxSec: 60,
    feedSafeStartPct: 20,
    feedSafeEndPct: 20,
    feedMinClipSec: 15,
  };
}

export interface FeedResponseItem {
  titleId: string;
  episodeId: string | null;
  slug: string;
  title: string;
  kind: string;
  orientation: string;
  mode: 'CLIP' | 'FULL';
  streamUrl: string;
  clipStartSec: number | null;
  clipEndSec: number | null;
  durationSec: number;
  posterUrl: string;
  verticalPosterUrl: string | null;
  bannerUrl: string | null;
  genres: string[];
  label: string | null;
  userProgressSec: number;
  fundingEnabled: boolean;
  creatorName: string | null;
  editorRating: number;
  description: string;
}

export interface FeedResponse {
  requestId: string;
  strategy: string;
  nextCursor: string | null;
  items: FeedResponseItem[];
}

export async function generateFeed(ctx: FeedContext): Promise<FeedResponse> {
  const strategyId = await getActiveStrategyId();
  const strategy = strategies[strategyId] || strategies.v1;
  const clipSettings = await getFeedClipSettings();

  // 1. Generate Candidates
  const candidates = await strategy.generateCandidates(ctx);

  // 2. Score Candidates
  const scored = await Promise.all(candidates.map((c) => strategy.score(c, ctx)));

  // 3. Re-rank with diversity rules
  const reranked = strategy.rerank(scored, ctx);

  // 4. Transform to FeedResponseItem
  const items: FeedResponseItem[] = [];

  for (const item of reranked) {
    const c = item.candidate;
    let clipStartSec: number | null = null;
    let clipEndSec: number | null = null;

    if (c.mode === 'CLIP') {
      const seed = `${ctx.requestId}_${c.title.id}_${c.episode?.id || ''}`;
      const clip = pickClip(c.durationSec, seed, clipSettings);
      if (clip) {
        clipStartSec = clip.clipStartSec;
        clipEndSec = clip.clipEndSec;
      } else {
        // If clipping was impossible for this candidate, fallback to 0..min(60, durationSec)
        clipStartSec = 0;
        clipEndSec = Math.min(60, c.durationSec);
      }
    }

    const genres = (c.title.genres || []).map((g: any) => g.genre?.name || g.name).filter(Boolean);
    const label = c.episode ? `S${c.episode.season?.number || 1} · E${c.episode.number}` : null;

    items.push({
      titleId: c.title.id,
      episodeId: c.episode?.id || null,
      slug: c.title.slug,
      title: c.title.title,
      kind: c.title.kind,
      orientation: c.title.orientation,
      mode: c.mode,
      streamUrl: c.streamUrl,
      clipStartSec,
      clipEndSec,
      durationSec: c.durationSec,
      posterUrl: c.title.posterUrl,
      verticalPosterUrl: c.title.verticalPosterUrl || null,
      bannerUrl: c.title.bannerUrl || null,
      genres,
      label,
      userProgressSec: 0,
      fundingEnabled: c.title.fundingEnabled ?? true,
      creatorName: c.title.creatorName || null,
      editorRating: c.title.editorRating ? Number(c.title.editorRating) : 9.1,
      description: c.title.description || '',
    });
  }

  // Next page cursor
  const nextCursor = items.length >= ctx.limit ? `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : null;

  return {
    requestId: ctx.requestId,
    strategy: strategyId,
    nextCursor,
    items,
  };
}
