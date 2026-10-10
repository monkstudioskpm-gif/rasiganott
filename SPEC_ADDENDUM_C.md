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
- **Vertical series**: `FULL` mode — plays the user's next unfinished episode (or Episode 1 for new viewers), with the episode drawer.
- **Landscape series**: `CLIP` mode, clipped only from **Episode 1–3** (random among them) to avoid spoilers from later episodes. Label shows `S1 · E2`. "Watch full" opens that episode and "Next episodes" opens the series page.

---

## C3. Clip Selection Algorithm

### C3.1 Inputs and settings (in `AppSetting`, editable by Super Admin)
| Key | Default |
| :--- | :--- |
| `feedClipMinSec` | `30` |
| `feedClipMaxSec` | `60` |
| `feedSafeStartPct` | `20` |
| `feedSafeEndPct` | `20` |
| `feedMinClipSec` | `15` (shortest clip allowed for very short films) |

`D` = `durationSec` of the title (or the chosen episode).

### C3.2 Steps
```
safeStart = ceil(D * feedSafeStartPct / 100)        // e.g. D=7200 -> 1440
safeEnd   = floor(D * (100 - feedSafeEndPct) / 100) // e.g. D=7200 -> 5760
window    = safeEnd - safeStart                     // length of the allowed middle zone

if window < feedMinClipSec        -> title not eligible for CLIP mode (skip)
maxLen = min(feedClipMaxSec, window)
minLen = min(feedClipMinSec, maxLen)                // for short films where window < 30
L      = randomInt(minLen, maxLen)                  // clip length in seconds
start  = randomInt(safeStart, safeEnd - L)          // clip start
end    = start + L                                  // always <= safeEnd
```

### C3.3 Rules
- The clip **must always satisfy** `start >= safeStart` and `end <= safeEnd`. Enforced on the server **and** clamped on the client.
- **Random but stable per session:** randomness uses a seeded generator, `seed = hash(requestId + titleId + episodeId)`. Scrolling back to an item shows the **same clip**, not a new one.
- **No repeats:** the same user (or anonymous id) should not see overlapping clips of the same title. The server checks the last 3 impressions of that title; if the new clip overlaps by ≥ 50%, it re-rolls (max 5 attempts).
- Start is an **integer second**. HLS segment boundaries are handled by the player (C5), so the start may buffer a segment earlier but playback must begin at `start`.

### C3.4 Worked examples (must be unit tests)
| Duration D | safeStart – safeEnd | window | Clip length range | Result |
| :--- | :--- | :--- | :--- | :--- |
| 7200 s (2 h) | 1440 – 5760 | 4320 | 30–60 | any clip fully inside 1440–5760 |
| 100 s | 20 – 80 | 60 | 30–60 | start 20…(80−L) |
| 50 s | 10 – 40 | 30 | 30–30 | exactly 10–40 |
| 40 s | 8 – 32 | 24 | 24–24 | clip 8–32 (short film, shorter than 30 s) |
| 20 s | 4 – 16 | 12 | — | not eligible (window < 15) |

---

## C4. Duration Source (required for clipping)

Add `durationSec` (integer seconds) as the **source of truth** on `Title` and `Episode` (the existing `durationMin` stays for display and is derived).

**Order used when an admin saves/tests a video link:**
1. **Bunny Stream API (preferred):** if the URL matches a Bunny pattern (`https://<pullzone>.b-cdn.net/<videoGuid>/playlist.m3u8`), the server extracts the video GUID and calls the Bunny Stream API (`BUNNY_STREAM_API_KEY`, `BUNNY_LIBRARY_ID`) to read the video length in seconds. *(Verify the exact field name against the current Bunny Stream API docs.)*
2. **Parse the HLS playlist:** fetch `playlist.m3u8` → pick the lowest variant → sum all `#EXTINF` durations of the media playlist → round to seconds.
3. **Browser fallback:** the admin "Test URL" tool reads `video.duration` from a hidden player and sends it with the form.
4. If all fail, the form shows "Duration unknown — this title will not appear in the vertical feed until duration is set" and allows manual entry.

Also:
- Duration is **read-only with a "Refresh" button** in the form; manual override allowed.
- A **backfill job** (`npm run backfill:durations`) fills missing durations for existing titles/episodes.
- Re-fetch duration whenever the video link changes.

---

## C5. Playing a Clip from a Bunny HLS Link

Bunny-side requirements (add to README):
- The library's **allowed domains/referrers** include the website and admin origins; CORS works for `.m3u8` and segments.
- If Bunny **token authentication** is enabled, the server returns a short-lived signed URL (`GET /api/playback/:titleId`) and the feed uses it; otherwise it uses the stored URL.
- MP4 fallback is not used for feed clips (HLS only).

Client behaviour (`useClipPlayer` built on the shared `useVideoEngine`):
1. Create hls.js with `startPosition: clipStart`, `autoStartLoad: false`; call `hls.startLoad(clipStart)` when the item is about to become active so only the needed segments load.
2. On `loadedmetadata`, if `video.currentTime` is not within `[clipStart, clipStart+1]`, set `video.currentTime = clipStart`.
3. On `timeupdate`: when `currentTime >= clipEnd` → seek back to `clipStart` and **loop**. After 2 loops show a gentle "Watch full movie" nudge. (Setting `feedAutoAdvance`, default off, advances to the next item instead.)
4. Limit seeking to `[clipStart, clipEnd]` — the progress bar shows **clip time (0:00–0:45)**, not movie time, and cannot scrub outside the clip (no spoilers).
5. Quality in feed: start at ~360p–480p and cap at 720p on mobile (`capLevelToPlayerSize: true`, `autoLevelCapping`), to save data and start fast; full playback pages keep the normal ABR ladder.
6. Muted autoplay by default; tap to unmute; the unmute choice is remembered.
7. Preload: while item N plays, prepare item N+1 (manifest + first segments at its `clipStart`); item N+2 only fetches its manifest. Destroy hls.js instances for items more than 1 away.
8. If the clip fails to start within 6 s or throws a fatal error, **skip silently to the next item** and send an `error` event so the title is flagged (C9).

### C5.1 UI for CLIP mode
- Landscape video is shown **letterboxed (contain)** in the vertical frame over a **blurred poster backdrop** (cheap; no second video).
- Badge: "Preview" + title + category/genre chips; for series `S1 · E2`.
- Buttons (right rail): ❤ Like, ＋ Wishlist, 💰 Support, ↗ Share, 🔊 Mute, ⋯ More.
- Primary CTA at bottom: **▶ Watch full movie** (opens `/watch/:titleId`, resuming if the user has progress; otherwise from start) and secondary **Watch from here** (opens `/watch/:titleId?t=<clipStart + currentOffset>`).
- For `FULL` mode (vertical content): normal vertical player UI from Addendum A / SPEC §9.2; no CTA button, full seek bar.

---

## C6. Feed Ranking (Strategy v1) — pluggable

### C6.1 Architecture
```
apps/api/src/services/feed/
├── strategy.ts          // FeedStrategy interface
├── strategies/
│   └── v1.ts            // current algorithm
├── clip.ts              // pickClip() from C3 (shared by all strategies)
├── candidates.ts        // eligibility filters
└── index.ts             // selects strategy from AppSetting `feedStrategy`
```
```ts
export interface FeedStrategy {
  id: string;                                                // "v1"
  generateCandidates(ctx: FeedContext): Promise<Candidate[]>;
  score(c: Candidate, ctx: FeedContext): number;
  rerank(scored: Scored[], ctx: FeedContext): Scored[];       // diversity rules
  decideMode(c: Candidate): 'CLIP' | 'FULL' | null;           // C2 rules
}
```
- `AppSetting.feedStrategy = "v1"` selects the strategy. Optional `feedExperiment` setting can route a % of users (by `hash(userId|anonId) % 100`) to another strategy for comparison.
- Every response includes `strategy` and `requestId`; every impression logs them, so a future v2 can be compared against v1 with real numbers.
- **Changing the algorithm later = add `strategies/v2.ts` and flip the setting.** No client change needed because the client only renders items returned by the server.

### C6.2 Candidate generation (v1)
Include a title if **all** are true: `status = PUBLISHED`, `feedEligible = true`, has a playable video link, mode is decidable (C2), `durationSec` known (for CLIP), not blocked/age-restricted for the user. Exclude titles already **completed** by the user (for logged-in users) and titles shown in the last 20 impressions.

### C6.3 Scoring (v1)
```
score = w_pop   * popularity
      + w_fresh * freshness
      + w_pers  * personalisation
      + w_eng   * feedEngagement
      + w_rand  * random(0..1, seeded)
```
Default weights (`AppSetting.feedWeights`): `pop 0.25, fresh 0.15, pers 0.30, eng 0.20, rand 0.10` (guests: pers = 0, its weight redistributed to pop and rand).

| Signal | Definition (normalised 0–1 across candidates) |
| :--- | :--- |
| **popularity** | qualified views + wishlist adds + likes in the last 14 days (from `DailyTitleStats`) |
| **freshness** | decays with `publishedAt` age (full score ≤ 7 days, half-life 30 days) |
| **personalisation** | overlap between the title's genres/tags/kind and the user's affinity profile built from watch history, likes (+), dislikes (−), wishlist, supported titles; recent actions weigh more |
| **feedEngagement** | from feed impressions: click-through to "Watch full" + average clip watch ratio − quick-skip rate (swiped away < 3 s), with a minimum of 50 impressions before it counts (otherwise neutral 0.5) |
| **random** | seeded random for exploration so new/low-data titles get exposure |

### C6.4 Re-ranking (diversity rules)
- Never show the **same title twice** within 15 items.
- No more than **2 consecutive** items of the same genre or the same category (movie/short/series).
- At least **1 in every 5** items is a "discovery" item (low impressions or new).
- Mix `FULL` (vertical) and `CLIP` items naturally; no more than 3 consecutive `CLIP`s from the same creator.
- Cold start (new user): first 5 items = top popularity across genres, then personalise as signals arrive.

### C6.5 Paging
`GET /api/feed?cursor=<token>&limit=10` — the server builds a page of 10, stores the item list for the `requestId` so a user scrolling back sees the same order and same clips, and returns `nextCursor`. The client prefetches the next page when 3 items from the end.

---

## C7. Data Model and API Changes

### C7.1 Prisma delta
```prisma
enum FeedMode   { CLIP FULL }
enum ViewSource { WATCH FEED_CLIP FEED_FULL }

model Title {                    // changes only
  // ...existing...
  durationSec       Int?           // source of truth for duration
  verticalVideoUrl  String?        // optional vertical cut (HLS from Bunny)
  feedEligible      Boolean  @default(true)
}

model Episode {                  // changes only
  // ...existing...
  durationSec Int?
}

model ViewEvent {                // changes only
  // ...existing...
  source ViewSource @default(WATCH)
}

model FeedImpression {
  id            String   @id @default(cuid())
  requestId     String
  strategy      String
  userId        String?
  anonId        String
  titleId       String
  episodeId     String?
  mode          FeedMode
  clipStartSec  Int?
  clipEndSec    Int?
  position      Int                       // index within the feed session
  shownAt       DateTime @default(now())
  watchedSec    Int      @default(0)
  loops         Int      @default(0)
  skipped       Boolean  @default(false) // left within 3 s
  clickedWatchFull Boolean @default(false)
  liked         Boolean  @default(false)
  wishlisted    Boolean  @default(false)
  openedSupport Boolean  @default(false)
  @@index([titleId, shownAt])
  @@index([userId, shownAt])
  @@index([requestId])
}
```

### C7.2 Feed API
`GET /api/feed?cursor=&limit=10` →
```json
{
  "requestId": "req_123",
  "strategy": "v1",
  "nextCursor": "abc",
  "items": [
    {
      "titleId": "…", "episodeId": null, "slug": "…", "title": "…",
      "kind": "MOVIE", "orientation": "LANDSCAPE",
      "mode": "CLIP",
      "streamUrl": "https://vz-xxxx.b-cdn.net/<guid>/playlist.m3u8",
      "clipStartSec": 2310, "clipEndSec": 2352,
      "durationSec": 7200,
      "posterUrl": "…", "genres": ["Action"], "label": null,
      "userProgressSec": 0,
      "fundingEnabled": true
    }
  ]
}
```
`POST /api/feed/events` (batched, `sendBeacon` on unload): `impression`, `watched` (seconds), `loop`, `skip`, `watch_full_click`, `watch_from_here_click`, `like`, `wishlist`, `support_open`, `error`.

`GET /api/playback/:titleId` — returns the (optionally signed) stream URL when Bunny token authentication is enabled.

Admin: `POST /admin/titles/:id/refresh-duration`, `POST /admin/titles/:id/feed-preview` (returns 5 sample clips), `PUT /admin/titles/:id/feed-eligibility`, `GET/PUT /admin/feed/settings`, `GET /admin/feed/issues`, `GET /admin/feed/stats`.

---

## C8. Analytics Rules for Feed Plays

To keep content analytics and creator earnings honest:
- **Clip plays do NOT count as content "Views"** (Addendum A §A8.1). They are tracked with `source = FEED_CLIP` and reported as **Reel plays** and **Reel → Watch conversions**.
- `FULL` plays of vertical content in the feed **do count** as Views when they meet the qualified-view rule (≥ 30 s actually watched), with `source = FEED_FULL`.
- A "Watch full movie" click that leads to real playback is counted as a normal `WATCH` view under the usual rule.
- New analytics columns (admin and creator): **Reel plays, Reel completion rate, Reel → Watch-full rate**. Creators see these per title without any money fields (Addendum B §B1 still applies).
- Admin "Vertical Feed" analytics tab: impressions, avg watch ratio, skip rate, click-through rate, by title / genre / category.

---

## C9. Admin Additions

- **Content form (Addendum B §B4)**: add under the Movie link section: **Vertical cut link (optional)** with Test URL, and **Duration (auto)** with Refresh; add a **"Show in vertical feed"** toggle (default on).
- **Content detailed view**: "Feed preview" panel with a **Generate sample clips** button (shows 5 random clips with start/end times and a mini player) so the admin can QA the 20% / 20% rule.
- **Vertical Feed page (`/feed`)** in the admin sidebar:
  - Settings: clip min/max, safe start/end %, strategy selector, weights, auto-advance, page size.
  - **Issues list**: titles with missing duration, failed clip starts, high skip rates or errors, with "Fix" links.
  - Stats: top clips by watch-full conversion, titles with lowest engagement, strategy comparison table (when an experiment is active).
- All changes audited.

---

## C10. Edge Cases

- Duration changes after links are replaced → pending impressions keep their original clip; new requests use the new duration.
- Very short landscape content (< 25 s) is never clipped (not eligible, C3.4).
- Clip reaches segment edges: the client never plays past `clipEnd`; if the stream ends early (shorter than recorded), the client loops from `clipStart`.
- Slow networks: if the buffer stalls > 3 s on a clip, drop to the lowest level; if still stalled at 6 s, skip.
- Data saver: a user setting "Data saver" caps feed quality at 360p and disables prefetch of the next-next item.
- Guests have no watch history: "Watch from here" and "Watch full" still work (resume from localStorage).
- Age-rated content (A) is excluded from the feed for guests and for users who haven't confirmed their age (future flag; default: hide `A`-rated content from the feed for guests).
- Accessibility: reduced-motion users don't autoplay with sound; captions shown if the clip's HLS has subtitle tracks.

---

## C11. Build Phase and Acceptance

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