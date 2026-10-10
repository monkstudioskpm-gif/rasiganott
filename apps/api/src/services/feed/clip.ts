/**
 * Clip Selection Engine (SPEC_ADDENDUM_C §C3)
 * Deterministically picks highlight clips from the safe middle 60% of landscape content.
 */

export interface ClipSettings {
  feedClipMinSec?: number; // default: 30
  feedClipMaxSec?: number; // default: 60
  feedSafeStartPct?: number; // default: 20
  feedSafeEndPct?: number; // default: 20
  feedMinClipSec?: number; // default: 15
}

export interface PastImpression {
  clipStartSec?: number | null;
  clipEndSec?: number | null;
}

export interface ClipResult {
  clipStartSec: number;
  clipEndSec: number;
  durationSec: number;
  clipLengthSec: number;
  safeStartSec: number;
  safeEndSec: number;
}

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export class SeededRandom {
  private s: number;

  constructor(seedStr: string, salt = 0) {
    this.s = cyrb53(seedStr, salt) >>> 0;
  }

  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  randomInt(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(min + this.next() * (max - min + 1));
  }
}

function calculateOverlapRatio(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): number {
  const overlap = Math.max(0, Math.min(end1, end2) - Math.max(start1, start2));
  if (overlap <= 0) return 0;
  const minLen = Math.min(end1 - start1, end2 - start2);
  return minLen > 0 ? overlap / minLen : 0;
}

/**
 * Pick a highlight clip strictly within the middle safe window.
 * Returns null if duration is invalid or window < feedMinClipSec.
 */
export function pickClip(
  durationSec: number | null | undefined,
  seedStr = 'default_seed',
  options: ClipSettings = {},
  recentImpressions: PastImpression[] = []
): ClipResult | null {
  if (!durationSec || durationSec <= 0) return null;

  const minClipSec = options.feedClipMinSec ?? 30;
  const maxClipSec = options.feedClipMaxSec ?? 60;
  const safeStartPct = options.feedSafeStartPct ?? 20;
  const safeEndPct = options.feedSafeEndPct ?? 20;
  const minAllowedClip = options.feedMinClipSec ?? 15;

  const safeStart = Math.ceil((durationSec * safeStartPct) / 100);
  const safeEnd = Math.floor((durationSec * (100 - safeEndPct)) / 100);
  const window = safeEnd - safeStart;

  // Ineligible if window is smaller than minAllowedClip (e.g. 15s)
  if (window < minAllowedClip) {
    return null;
  }

  const maxLen = Math.min(maxClipSec, window);
  const minLen = Math.min(minClipSec, maxLen);

  // Filter valid recent impressions for overlap prevention (last 3)
  const lastImpressions = recentImpressions
    .filter((imp) => typeof imp.clipStartSec === 'number' && typeof imp.clipEndSec === 'number')
    .slice(0, 3) as Array<{ clipStartSec: number; clipEndSec: number }>;

  // Re-roll up to 5 attempts to avoid >= 50% overlap with recent impressions
  for (let attempt = 0; attempt < 5; attempt++) {
    const rng = new SeededRandom(seedStr, attempt * 101);
    const L = rng.randomInt(minLen, maxLen);
    const start = rng.randomInt(safeStart, safeEnd - L);
    const end = start + L;

    // Check overlap with recent impressions
    const hasHeavyOverlap = lastImpressions.some(
      (imp) => calculateOverlapRatio(start, end, imp.clipStartSec, imp.clipEndSec) >= 0.5
    );

    if (!hasHeavyOverlap || attempt === 4) {
      return {
        clipStartSec: start,
        clipEndSec: end,
        durationSec,
        clipLengthSec: L,
        safeStartSec: safeStart,
        safeEndSec: safeEnd,
      };
    }
  }

  return null;
}
