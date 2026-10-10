/**
 * Feed Strategy Interface (SPEC_ADDENDUM_C §C6.1)
 */

export interface FeedContext {
  userId?: string | null;
  anonId: string;
  requestId: string;
  limit: number;
  cursor?: string | null;
}

export interface Candidate {
  title: any;
  episode?: any | null;
  mode: 'CLIP' | 'FULL';
  durationSec: number;
  streamUrl: string;
}

export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  signals: {
    popularity: number;
    freshness: number;
    personalisation: number;
    feedEngagement: number;
    random: number;
  };
}

export interface FeedStrategy {
  id: string; // "v1"
  generateCandidates(ctx: FeedContext): Promise<Candidate[]>;
  score(c: Candidate, ctx: FeedContext): Promise<ScoredCandidate>;
  rerank(scored: ScoredCandidate[], ctx: FeedContext): ScoredCandidate[];
  decideMode(title: any, episode?: any): 'CLIP' | 'FULL' | null;
}
