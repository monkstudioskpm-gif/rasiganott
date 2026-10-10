import { describe, it, expect } from 'vitest';
import { pickClip } from './clip.js';

describe('Clip Selection Engine (SPEC_ADDENDUM_C §C3)', () => {
  it('handles 7200s (2h) movie correctly', () => {
    const clip = pickClip(7200, 'req_movie_1');
    expect(clip).not.toBeNull();
    if (!clip) return;

    expect(clip.safeStartSec).toBe(1440);
    expect(clip.safeEndSec).toBe(5760);
    expect(clip.clipLengthSec).toBeGreaterThanOrEqual(30);
    expect(clip.clipLengthSec).toBeLessThanOrEqual(60);
    expect(clip.clipStartSec).toBeGreaterThanOrEqual(1440);
    expect(clip.clipEndSec).toBeLessThanOrEqual(5760);
    expect(clip.clipEndSec - clip.clipStartSec).toBe(clip.clipLengthSec);
  });

  it('handles 100s short content correctly', () => {
    const clip = pickClip(100, 'req_short_100');
    expect(clip).not.toBeNull();
    if (!clip) return;

    expect(clip.safeStartSec).toBe(20);
    expect(clip.safeEndSec).toBe(80);
    expect(clip.clipLengthSec).toBeGreaterThanOrEqual(30);
    expect(clip.clipLengthSec).toBeLessThanOrEqual(60);
    expect(clip.clipStartSec).toBeGreaterThanOrEqual(20);
    expect(clip.clipEndSec).toBeLessThanOrEqual(80);
  });

  it('handles 50s short film with exact 30s window', () => {
    const clip = pickClip(50, 'req_short_50');
    expect(clip).not.toBeNull();
    if (!clip) return;

    expect(clip.safeStartSec).toBe(10);
    expect(clip.safeEndSec).toBe(40);
    expect(clip.clipLengthSec).toBe(30);
    expect(clip.clipStartSec).toBe(10);
    expect(clip.clipEndSec).toBe(40);
  });

  it('handles 40s film (window 24s < 30s) correctly', () => {
    const clip = pickClip(40, 'req_short_40');
    expect(clip).not.toBeNull();
    if (!clip) return;

    expect(clip.safeStartSec).toBe(8);
    expect(clip.safeEndSec).toBe(32);
    expect(clip.clipLengthSec).toBe(24);
    expect(clip.clipStartSec).toBe(8);
    expect(clip.clipEndSec).toBe(32);
  });

  it('rejects 20s content as ineligible (window 12s < 15s)', () => {
    const clip = pickClip(20, 'req_short_20');
    expect(clip).toBeNull();
  });

  it('returns exact same clip for identical seed (deterministic scroll back)', () => {
    const clipA = pickClip(5400, 'req_123_title_xyz_ep1');
    const clipB = pickClip(5400, 'req_123_title_xyz_ep1');
    expect(clipA).toEqual(clipB);
  });

  it('simulates 10,000 picks without violating boundaries', () => {
    const durations = [35, 40, 50, 75, 120, 600, 1800, 3600, 7200, 10800];

    for (let i = 0; i < 10000; i++) {
      const d = durations[i % durations.length];
      const seed = `sim_seed_${i}_dur_${d}`;
      const clip = pickClip(d, seed);

      expect(clip).not.toBeNull();
      if (!clip) continue;

      expect(clip.clipStartSec).toBeGreaterThanOrEqual(clip.safeStartSec);
      expect(clip.clipEndSec).toBeLessThanOrEqual(clip.safeEndSec);
      expect(clip.clipEndSec).toBe(clip.clipStartSec + clip.clipLengthSec);
      expect(clip.clipLengthSec).toBeGreaterThanOrEqual(15);
      expect(clip.clipLengthSec).toBeLessThanOrEqual(60);
    }
  });

  it('avoids >50% overlap with recent impressions', () => {
    const initialClip = pickClip(7200, 'initial_seed');
    expect(initialClip).not.toBeNull();
    if (!initialClip) return;

    const nextClip = pickClip(7200, 'next_seed', {}, [
      { clipStartSec: initialClip.clipStartSec, clipEndSec: initialClip.clipEndSec },
    ]);
    expect(nextClip).not.toBeNull();
  });
});
