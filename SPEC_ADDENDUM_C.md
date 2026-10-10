<USER_REQUEST>
# Rasigan OTT v2 — Addendum C: Vertical Feed Algorithm (Highlight Clips)

> **Save as:** `SPEC_ADDENDUM_C.md` next to `SPEC.md`, `SPEC_ADDENDUM_A.md`, `SPEC_ADDENDUM_B.md`.
> **Precedence:** C > B > A > SPEC. It **replaces SPEC §9.1 (vertical feed behaviour)** and adds feed rules to the view-counting definitions in Addendum A §A8.1.

---

## C1. Concept

The vertical feed (`/reels`) works like Reels/Shorts, but most content in the catalog is landscape. So the feed shows **highlight clips**:

1. Take the title's **total duration**.
2. Ignore the **first 20%** (intro, credits, set-up) and the **last 20%** (climax, ending — avoids spoilers).
3. From the remaining middle 60%, pick a **random clip of 30–60 seconds** and auto-play it.
4. If a **vertical version** of the video exists, play that instead (no clipping).
5. The ranking logic (what appears, in what order) is a **replaceable strategy**, so the algorithm can be upgraded later without rewriting the feed.

All movie videos are **HLS links from Bunny Stream** (`.../playlist.m3u8`), so clip playback uses HLS seeking to a start position rather than cutting files.

---

## C2. Playback Modes (decided per item by the server)

| Priority | Condition | Mode | Behaviour |
| :-: | :--- | :--- | :--- |
| 1 | Title has an admin-supplied **Vertical cut link** (`verticalVideoUrl`) | `FULL` | Play the vertical video from the start (or the user's resume point). No clipping. |
| 2 | Title `orientation = VERTICAL` | `FULL` | Play the title normally (from start/resume). No clipping. |
| 3 | Title is **landscape** (movie, short film, series) with known duration | `CLIP` | Random 30–60 s clip from the middle 60% (C3). |
| — | Duration unknown, link broken, or `feedEligible = false` | skipped | Not shown in feed; flagged in admin (C9). |

> "Future algorithm update" hook: modes are returned by the server per item, so new modes (e.g. AI-detected scenes, trailer-first) can be added later without changing the client contract.

### C2.1 Series
- **Vertical ser
<truncated 15420 bytes>
ce

**Replace the vertical-feed part of Phase 4 with:**

- **Phase 4B-1 — Durations:** `durationSec` fields, Bunny API lookup, HLS `#EXTINF` fallback, backfill command, form display.
  *Accept:* saving a Bunny HLS link fills `durationSec` within ±2 s of the true length.
- **Phase 4B-2 — Clip engine:** `pickClip()` with unit tests from C3.4; seeded randomness; overlap avoidance.
  *Accept:* 10,000 simulated picks across durations never start before `safeStart` or end after `safeEnd`; lengths are always within 30–60 (or the window rule); same seed returns the same clip.
- **Phase 4B-3 — Feed API + strategy v1:** candidates, scoring, re-rank, paging, impressions/events.
  *Accept:* no same title within 15 items; no more than 2 consecutive same genre; scrolling back shows identical clips.
- **Phase 4B-4 — Feed UI:** CLIP mode player (hls.js start position, loop, clip-relative progress bar, limited seeking), FULL mode, CTAs, prefetch, error skip.
  *Accept:* a real Bunny HLS movie starts at the clip start within ~2 s on Fast 4G; clip never plays outside its window; "Watch from here" opens at the right time.
- **Phase 4B-5 — Admin feed tools:** vertical cut link, feed toggle, sample-clip preview, Vertical Feed page, issues list.
- **Phase 4B-6 — Analytics hooks:** `source` on view events, Reel metrics, rollups.

### Definition of Done (feed)
- [ ] Every landscape title in the feed plays a random 30–60 s clip entirely inside its middle 60%.
- [ ] Vertical titles and titles with a vertical cut play as full vertical videos.
- [ ] Clips are stable within a session and rarely repeat for the same user.
- [ ] Bunny HLS links work (CORS/referrer/token handled) and failing items are skipped automatically and flagged.
- [ ] Switching `feedStrategy` to a new strategy requires **no client change**.
- [ ] Clip plays are excluded from content Views and creator metrics, and shown as Reel metrics instead.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-10T15:07:31+05:30.
</ADDITIONAL_METADATA>