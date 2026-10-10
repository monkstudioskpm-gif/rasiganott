import { FeedStrategy, Candidate, ScoredCandidate, FeedContext } from '../strategy.js';
import { generateCandidates, decidePlaybackMode } from '../candidates.js';
import { SeededRandom } from '../clip.js';

export class StrategyV1 implements FeedStrategy {
  id = 'v1';

  async generateCandidates(ctx: FeedContext): Promise<Candidate[]> {
    return generateCandidates(ctx);
  }

  decideMode(title: any, episode?: any): 'CLIP' | 'FULL' | null {
    return decidePlaybackMode(title, episode).mode;
  }

  async score(c: Candidate, ctx: FeedContext): Promise<ScoredCandidate> {
    const isGuest = !ctx.userId;

    // 1. Popularity Signal (0..1)
    const reactionCount = c.title._count?.reactions || 0;
    const fundingCount = c.title._count?.fundings || 0;
    const popularity = Math.min(1, (reactionCount * 2 + fundingCount * 5) / 50);

    // 2. Freshness Signal (0..1)
    const publishedAt = c.title.publishedAt ? new Date(c.title.publishedAt).getTime() : new Date(c.title.createdAt).getTime();
    const daysOld = Math.max(0, (Date.now() - publishedAt) / (1000 * 60 * 60 * 24));
    let freshness = 1.0;
    if (daysOld > 7) {
      // Exponential decay with half-life of 30 days
      freshness = Math.pow(0.5, (daysOld - 7) / 30);
    }

    // 3. Personalisation Signal (0..1)
    // Future expansion: user affinity vector. For now, default neutral / genre weight
    const personalisation = isGuest ? 0 : 0.6;

    // 4. Feed Engagement (0..1)
    const feedEngagement = 0.5; // neutral baseline for cold start

    // 5. Seeded Random for discovery
    const rng = new SeededRandom(`${ctx.requestId}_score_${c.title.id}`);
    const random = rng.next();

    // Weights: pop: 0.25, fresh: 0.15, pers: 0.30, eng: 0.20, rand: 0.10
    const wPop = isGuest ? 0.35 : 0.25;
    const wFresh = isGuest ? 0.25 : 0.15;
    const wPers = isGuest ? 0.0 : 0.3;
    const wEng = 0.2;
    const wRand = isGuest ? 0.2 : 0.1;

    const totalScore =
      wPop * popularity +
      wFresh * freshness +
      wPers * personalisation +
      wEng * feedEngagement +
      wRand * random;

    return {
      candidate: c,
      score: totalScore,
      signals: {
        popularity,
        freshness,
        personalisation,
        feedEngagement,
        random,
      },
    };
  }

  rerank(scored: ScoredCandidate[], ctx: FeedContext): ScoredCandidate[] {
    // Sort by score descending
    const pool = [...scored].sort((a, b) => b.score - a.score);
    const result: ScoredCandidate[] = [];

    const recentGenres: string[] = [];
    const recentCategories: string[] = [];
    const recentCreators: string[] = [];
    const seenTitleIds = new Set<string>();

    let index = 0;
    while (pool.length > 0 && result.length < ctx.limit) {
      index++;
      // Every 5th item: pick a discovery item (lower impressions / newer) if available
      const pickDiscovery = index % 5 === 0 && pool.length > 2;

      let chosenIdx = 0;
      if (pickDiscovery) {
        chosenIdx = Math.min(pool.length - 1, Math.floor(pool.length / 2));
      }

      // Check diversity constraints
      for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const titleId = item.candidate.title.id;

        if (seenTitleIds.has(titleId)) continue;

        const genreName = item.candidate.title.genres?.[0]?.genre?.name || 'General';
        const categoryKind = item.candidate.title.kind || 'MOVIE';
        const creator = item.candidate.title.creatorName || 'Indie';

        // Constraint 1: No more than 2 consecutive same genre
        const sameGenreCount = recentGenres.slice(-2).filter((g) => g === genreName).length;
        if (sameGenreCount >= 2 && pool.length > 3) continue;

        // Constraint 2: No more than 2 consecutive same category (MOVIE/WEB_SERIES)
        const sameCatCount = recentCategories.slice(-2).filter((c) => c === categoryKind).length;
        if (sameCatCount >= 2 && pool.length > 3) continue;

        // Constraint 3: No more than 3 consecutive clips from same creator
        const sameCreatorCount = recentCreators.slice(-3).filter((cr) => cr === creator).length;
        if (sameCreatorCount >= 3 && pool.length > 3) continue;

        chosenIdx = i;
        break;
      }

      const [selected] = pool.splice(chosenIdx, 1);
      if (selected) {
        result.push(selected);
        seenTitleIds.add(selected.candidate.title.id);

        const g = selected.candidate.title.genres?.[0]?.genre?.name || 'General';
        const c = selected.candidate.title.kind || 'MOVIE';
        const cr = selected.candidate.title.creatorName || 'Indie';
        recentGenres.push(g);
        recentCategories.push(c);
        recentCreators.push(cr);
      }
    }

    return result;
  }
}
