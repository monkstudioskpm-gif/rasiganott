# Rasigan OTT v2 — Project Specification

> **Purpose:** A clean rebuild of Rasigan OTT. Fewer moving parts, no Supabase, a reliable adaptive video player, and a clear build order so an AI coding agent (Google Antigravity) can build it phase by phase without errors.
> **Audience:** Tamil / South Indian cinema viewers. Content: movies, short films, web series, in both **landscape** and **vertical** formats.

---

## 0. How to Use This Spec with Google Antigravity

1. Create an empty folder `rasigan-ott/` and open it in Antigravity.
2. Save this file as `SPEC.md` in the root. Also create `AGENTS.md` (see Section 20) so every agent follows the same rules.
3. Give the agent **one phase at a time** (Section 19). Do not ask for the whole app in one prompt.
4. After each phase, run the acceptance checklist for that phase before moving on.
5. Never let the agent invent features outside this spec. If something is unclear, it should add a `TODO(question)` comment instead of guessing.

**Starter prompt for the agent:**
> Read SPEC.md and AGENTS.md fully. Build **Phase 1 only**. Do not start Phase 2. When done, run lint, typecheck and build, then list what you completed against the Phase 1 acceptance checklist.

---

## 1. Goals and Non-Goals

### 1.1 Goals
- Browse and watch **Movies, Short Films, Web Series** in **Landscape** and **Vertical** formats.
- Web series have **seasons/episodes** with continuity (continue watching, next episode, auto-play next) and a dedicated episode page.
- Viewers can **fund (support) creators** through Razorpay.
- Admin can **create, edit, view, publish/unpublish, delete** any title and its episodes from a dashboard.
- Video is always provided as a **URL** (HLS preferred). No uploading of video files through the app.
- A **production-grade player**: adaptive bitrate, quality selector, subtitles, audio tracks, resume, keyboard/touch controls.
- Delivered through a **CDN**, behaving like other OTT platforms (fast start, no buffering on weak networks).
- **Google Sign-In button** for login.

### 1.2 Non-Goals (explicitly removed from v1)
- ❌ Supabase (database, auth, storage, RLS) — fully removed.
- ❌ Cast & crew profile pages / portfolios — only plain **name lists** on the detail page.
- ❌ Any user-facing video upload / creator submission page.
- ❌ Watch Party (can be a future phase).
- ❌ DRM (future phase; see Section 15).
- ❌ Subscription plans (only one-time funding/support in v1).

---

## 2. Technology Stack

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| Frontend | **React 19 + Vite + TypeScript** | SPA |
| Routing | React Router v7 | |
| Data fetching | TanStack Query | caching, retries, loading states |
| Styling | Tailwind CSS | dark theme, mobile-first |
| Icons | lucide-react | |
| Video player | **hls.js** (HLS adaptive) + native `<video>` (MP4 fallback + Safari native HLS) | custom controls built in React |
| Backend | **Node.js 22 + Express + TypeScript** | REST API under `/api` |
| ORM / DB | **Prisma** with **SQLite (dev)** → **PostgreSQL (prod)** | one schema, switch via `DATABASE_URL` |
| Auth | **Google Identity Services** (Sign in with Google button) + server verifies ID token → issues **JWT in httpOnly cookie** | no third-party BaaS |
| Payments | **Razorpay** (Orders API + signature verify + webhook) | server-side secret only |
| Validation | Zod | shared between client and server |
| Deployment | Frontend: Vercel or Cloudflare Pages · Backend: Render / Railway / Fly.io · DB: Neon or Railway Postgres | |
| Video hosting/CDN | Bunny Stream, Cloudflare Stream, Mux, or AWS (MediaConvert + S3 + CloudFront) | see Section 14 |

### 2.1 Monorepo layout (npm workspaces)

```
rasigan-ott/
├── SPEC.md
├── AGENTS.md
├── package.json                # workspaces: ["apps/*", "packages/*"]
├── apps/
│   ├── web/                    # React + Vite
│   │   ├── src/
│   │   │   ├── app/            # router, providers, layout
│   │   │   ├── components/     # shared UI (cards, rows, modals, filters)
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── catalog/
│   │   │   │   ├── player/     # landscape player + vertical player
│   │   │   │   ├── series/     # seasons, episodes, episode page
│   │   │   │   ├── funding/
│   │   │   │   ├── library/    # watchlist, likes, history
│   │   │   │   └── admin/
│   │   │   ├── lib/            # api client, hls helpers, utils
│   │   │   └── pages/
│   │   └── index.html
│   └── api/                    # Express + Prisma
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── src/
│           ├── routes/
│           ├── middleware/     # auth, admin, error, rateLimit
│           ├── services/       # razorpay, google, titles
│           └── index.ts
└── packages/
    └── shared/                 # zod schemas + shared TS types
```

---

## 3. Core Concepts (Content Model in Plain Words)

Every piece of content is a **Title**. A Title has two independent attributes:

| Attribute | Values |
| :--- | :--- |
| `kind` | `MOVIE`, `SHORT_FILM`, `WEB_SERIES` |
| `orientation` | `LANDSCAPE`, `VERTICAL` |

That gives **six combinations** (landscape movie, vertical movie, landscape short, vertical short, landscape series, vertical series). One data model, one admin form, two player layouts.

- `MOVIE` and `SHORT_FILM` → have a single `videoUrl`.
- `WEB_SERIES` → has **Seasons → Episodes**; each episode has its own `videoUrl`.
- A Title belongs to **one or more Categories** (genre/mood/language collections).
- Cast and crew are **plain text lists** on the Title (no separate profile).

---

## 4. Database Schema (Prisma)

> Implement exactly this. Use `cuid()` ids. All timestamps UTC.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite" url = env("DATABASE_URL") } // switch provider to postgresql for prod

enum Kind        { MOVIE SHORT_FILM WEB_SERIES }
enum Orientation { LANDSCAPE VERTICAL }
enum Status      { DRAFT PUBLISHED ARCHIVED }
enum StreamType  { HLS MP4 DASH }
enum PayStatus   { CREATED PAID FAILED REFUNDED }
enum Role        { USER ADMIN }

model User {
  id         String   @id @default(cuid())
  googleId   String   @unique
  email      String   @unique
  name       String
  avatarUrl  String?
  role       Role     @default(USER)
  createdAt  DateTime @default(now())

  watchlist  WatchlistItem[]
  likes      Reaction[]
  progress   WatchProgress[]
  fundings   Funding[]
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique        // e.g. "Thriller"
  slug      String   @unique
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  titles    TitleCategory[]
}

model Title {
  id             String      @id @default(cuid())
  slug           String      @unique
  kind           Kind
  orientation    Orientation
  status         Status      @default(DRAFT)

  title          String
  tagline        String?
  description    String
  language       String      @default("Tamil")
  year           Int?
  ageRating      String?                 // U, U/A, A
  durationMin    Int?                    // movie / short only
  editorRating   Decimal?                // 0.0 - 10.0

  posterUrl      String                  // vertical poster (2:3)
  bannerUrl      String?                 // landscape banner (16:9) — required for LANDSCAPE
  trailerUrl     String?

  // movie / short only
  videoUrl       String?
  streamType     StreamType?
  subtitles      Json        @default("[]")  // [{label, lang, url}]  (WebVTT)
  audioTracks    Json        @default("[]")  // [{label, lang, url?}] (for non-HLS-embedded tracks)

  // plain-text credits
  castNames      Json        @default("[]")  // string[]
  crewCredits    Json        @default("[]")  // [{role: string, name: string}]
  creatorName    String?                 // shown on funding modal

  isFeatured     Boolean     @default(false)
  fundingEnabled Boolean     @default(true)
  fundingGoal    Int?                    // INR, optional progress bar
  publishedAt    DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  categories     TitleCategory[]
  seasons        Season[]
  watchlisted    WatchlistItem[]
  reactions      Reaction[]
  progress       WatchProgress[]
  fundings       Funding[]

  @@index([kind, orientation, status])
}

model TitleCategory {
  titleId    String
  categoryId String
  title      Title    @relation(fields: [titleId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@id([titleId, categoryId])
}

model Season {
  id        String    @id @default(cuid())
  titleId   String
  number    Int
  name      String?
  title     Title     @relation(fields: [titleId], references: [id], onDelete: Cascade)
  episodes  Episode[]
  @@unique([titleId, number])
}

model Episode {
  id           String      @id @default(cuid())
  seasonId     String
  number       Int
  name         String
  description  String?
  thumbnailUrl String?
  durationMin  Int?
  videoUrl     String
  streamType   StreamType
  subtitles    Json        @default("[]")
  audioTracks  Json        @default("[]")
  introStartSec Int?                // optional "Skip Intro"
  introEndSec   Int?
  creditsStartSec Int?              // optional "Next Episode" trigger
  status       Status      @default(PUBLISHED)
  publishedAt  DateTime?
  season       Season      @relation(fields: [seasonId], references: [id], onDelete: Cascade)
  progress     WatchProgress[]
  @@unique([seasonId, number])
}

model WatchlistItem {
  userId  String
  titleId String
  addedAt DateTime @default(now())
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  title   Title @relation(fields: [titleId], references: [id], onDelete: Cascade)
  @@id([userId, titleId])
}

model Reaction {            // like / dislike
  userId  String
  titleId String
  value   Int               // 1 = like, -1 = dislike
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  title   Title @relation(fields: [titleId], references: [id], onDelete: Cascade)
  @@id([userId, titleId])
}

model WatchProgress {       // powers Continue Watching + resume
  id          String   @id @default(cuid())
  userId      String
  titleId     String
  episodeId   String?       // null for movie/short
  positionSec Int
  durationSec Int
  completed   Boolean  @default(false)
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       Title    @relation(fields: [titleId], references: [id], onDelete: Cascade)
  episode     Episode? @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  @@unique([userId, titleId, episodeId])
}

model Funding {
  id                String    @id @default(cuid())
  userId            String
  titleId           String
  amountInr         Int                       // whole rupees
  razorpayOrderId   String    @unique
  razorpayPaymentId String?   @unique
  status            PayStatus @default(CREATED)
  message           String?                   // optional note to creator
  isAnonymous       Boolean   @default(false)
  createdAt         DateTime  @default(now())
  paidAt            DateTime?
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title             Title     @relation(fields: [titleId], references: [id], onDelete: Cascade)
}
```

### 4.1 Validation rules
- `bannerUrl` is **required** when `orientation = LANDSCAPE` and `status = PUBLISHED`.
- `videoUrl` + `streamType` required for `MOVIE` / `SHORT_FILM` when publishing.
- `WEB_SERIES` needs at least 1 season with 1 published episode before publishing.
- `streamType` is **auto-detected** from URL (`.m3u8` → HLS, `.mpd` → DASH, `.mp4` → MP4) but admin can override.
- All URLs must be `https://` (reject `http://` in production).
- `slug` auto-generated from title; must be unique.

---

## 5. Authentication (Google Sign-In)

### 5.1 Flow
1. Frontend renders the official **"Sign in with Google"** button using Google Identity Services (`accounts.google.com/gsi/client`).
2. On success, Google returns an **ID token (credential)**.
3. Frontend sends it to `POST /api/auth/google`.
4. Backend verifies the token with `google-auth-library` (`OAuth2Client.verifyIdToken`, audience = `GOOGLE_CLIENT_ID`).
5. Backend upserts the `User` (by `googleId`), sets role `ADMIN` if email is in `ADMIN_EMAILS`.
6. Backend issues a **JWT (7 days)** in an **httpOnly, Secure, SameSite=Lax** cookie.
7. `GET /api/auth/me` returns the current user; `POST /api/auth/logout` clears the cookie.

### 5.2 Rules
- No email/password login in v1. Google only.
- Browsing the catalog is allowed **without login**. Login required for: watchlist, likes, progress sync, funding.
- Playing content: allowed for guests (optional flag `REQUIRE_LOGIN_TO_WATCH=false`).
- Login page (`/login`) shows logo, one Google button, and Terms/Privacy links.
- If a guest tries a protected action, show a login prompt modal with the Google button, then continue the action after login.

---

## 6. Screens and Routes

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | Home | Hero carousel (featured), format toggle **Landscape / Vertical / All**, kind filter chips, category rows, Continue Watching row (logged in) |
| `/browse/:kind` | Browse by kind | `movies`, `short-films`, `web-series` with orientation filter + category filter + sort |
| `/category/:slug` | Category page | Grid of all titles in a category |
| `/title/:slug` | **Title details** | See Section 7 |
| `/watch/:titleId` | Landscape player | Movie / short film playback |
| `/watch/:titleId/:episodeId` | Landscape episode player | Series episode playback |
| `/reels` | Vertical feed | Full-screen snap-scroll feed of vertical titles |
| `/reels/:titleId` | Vertical player | Focused vertical movie/short; series shows episode drawer |
| `/reels/:titleId/:episodeId` | Vertical episode player | Vertical series episode |
| `/series/:slug/episode/:episodeId` | **Episode page** | See Section 8 |
| `/search` | Search | Live search + filters |
| `/library` | My Library | Tabs: Watchlist, Continue Watching, Liked, Supported |
| `/login` | Login | Google button |
| `/legal/:page` | Legal | terms, privacy, refund (static content) |
| `/admin` | Admin dashboard | Section 11 (admin only) |
| `/admin/titles` | Titles list | |
| `/admin/titles/new` | Create title | |
| `/admin/titles/:id` | Detailed view | |
| `/admin/titles/:id/edit` | Edit title | |
| `/admin/categories` | Categories | |
| `/admin/funding` | Funding report | |
| `*` | 404 | |

### 6.1 Layout rules
- Desktop: top header (logo, nav: Home, Movies, Short Films, Web Series, Reels, search icon, profile menu).
- Mobile (<768px): bottom nav (Home, Reels, Search, Library, Profile); header collapses.
- Dark theme only in v1. Tokens defined as CSS variables in `index.css`.
- Poster aspect ratios: vertical poster **2:3**, landscape banner **16:9**, episode thumbnail **16:9**.
- Landscape titles use 16:9 cards in rows; vertical titles use 9:16 / 2:3 cards in rows.

---

## 7. Title Detail Page (`/title/:slug`)

Common to Movie, Short Film, Web Series:

- Backdrop (banner for landscape, blurred poster for vertical) + poster.
- Title, tagline, year, age rating, duration (or "N seasons"), language, editor rating, kind badge, orientation badge.
- Category chips (clickable → `/category/:slug`).
- Buttons: **▶ Play / Resume**, **Watch Trailer** (modal), **+ Watchlist**, **👍 / 👎**, **Share** (Web Share API → copy link fallback), **❤ Support Creator**.
- Description (expandable).
- **Cast** — plain list of names (comma/pill list).
- **Crew** — plain list: `Role — Name` (Director — X, Music — Y …). No links, no profile pages.
- Funding progress bar if `fundingGoal` is set (raised ÷ goal).
- "More like this" row (same category / kind).

**Movie / Short Film only:** single Play button → player; shows duration.

**Web Series only:**
- Season selector dropdown.
- Episode list: thumbnail, number, name, duration, short description, progress bar per episode, "Watched" tick.
- Play button label logic: no history → "Play S1 E1"; in progress → "Resume S{n} E{m}"; finished episode → "Play S{n} E{m+1}".
- Clicking an episode → episode page (Section 8).

---

## 8. Web Series: Episodes and Continuity

### 8.1 Episode page (`/series/:slug/episode/:episodeId`)
- Large embedded player (landscape or vertical based on title orientation) or "Play" hero.
- Episode title, number, season, description, duration.
- Previous / Next episode buttons.
- Full episode list of current season (current one highlighted), season switcher.
- Back to series detail link.
- Support Creator button.

### 8.2 Continuity rules
1. Progress saved every **10 seconds** and on pause / tab hide / unload (`navigator.sendBeacon` fallback) to `PUT /api/progress`.
2. An episode is `completed` when watched ≥ **92%** or when `creditsStartSec` is reached.
3. At `creditsStartSec` (or last 20 s if not set) show **"Next Episode in 5…"** overlay with Cancel; auto-play next if not cancelled.
4. Next episode crosses seasons (last episode of S1 → first of S2).
5. At the end of the final episode, show "Series completed" with related titles.
6. **Skip Intro** button appears between `introStartSec` and `introEndSec` when set.
7. Continue Watching row shows the **next unfinished episode** for each series (not the series poster at 0%).
8. Vertical series: swiping up at the end of an episode moves to the next episode; episode drawer lists all episodes.

---

## 9. Vertical Experience (Reels-style)

### 9.1 Feed (`/reels`)
- Full-viewport items using CSS `scroll-snap-type: y mandatory`; one item per screen.
- Includes vertical **movies, short films, and series** (series shown as episode 1 or the user's next episode, with an "Episode N • Series name" label).
- Auto-play when ≥ 70% visible (IntersectionObserver); pause and unload others; **preload only the next item** (metadata).
- Muted autoplay by default with tap-to-unmute; remember the mute choice.
- Tap = play/pause; double-tap on right/left = +10 / −10 s; long-press = 2× speed.
- Right action rail: Like, Watchlist, Share, **Support (funding)**, Episodes (series only), More.
- Bottom overlay: title, creator, short description (expandable), category chips.
- Slim progress bar (seekable) at the bottom.
- Keyboard: ↑/↓ next/prev, Space play/pause, M mute, L like.
- Only one `<video>` element actively playing at a time; destroy hls.js instances for off-screen items to avoid memory leaks.

### 9.2 Vertical player page (`/reels/:titleId[/:episodeId]`)
- Same player as the feed, but opened on a specific item and doesn't auto-advance to unrelated titles.
- For series: episode drawer (bottom sheet) with season switcher; auto-next-episode as per Section 8.

### 9.3 Vertical rows on Home
- When the "Vertical" toggle is on, Home shows rows of 2:3 vertical posters; tapping a poster opens the title detail page; a "Watch in Reels" button opens the vertical player.

---

## 10. Funding (Creator Support)

### 10.1 UX
- **Support** button on title detail, landscape player (overlay icon), vertical rail, and episode page.
- Modal: creator name, title, preset tiers **₹50, ₹100, ₹500, ₹1000**, custom amount (min ₹10, max ₹50,000), optional message (140 chars), "Support anonymously" toggle.
- After payment: success screen with receipt number; entry added to **Library → Supported**.
- Failure / cancel: friendly message and "Try again".
- If `fundingEnabled = false`, hide all support buttons for that title.

### 10.2 Payment flow (server-trusted)
1. `POST /api/funding/order` `{ titleId, amountInr, message?, isAnonymous? }` → server validates amount, creates Razorpay **order** (amount in paise), stores `Funding(status=CREATED)`, returns `{ orderId, keyId, amount }`.
2. Client opens Razorpay Checkout with `order_id`.
3. On success, client calls `POST /api/funding/verify` `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`.
4. Server verifies HMAC SHA256 signature using `RAZORPAY_KEY_SECRET`; marks `PAID`, sets `paidAt`.
5. **Webhook** `POST /api/funding/webhook` (verify `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET`) handles `payment.captured`, `payment.failed`, `refund.processed` — this is the source of truth if the browser closes early.
6. Idempotent: repeated verify/webhook calls never double-count.

### 10.3 Rules
- Never trust amounts from the client after order creation; always read from the stored `Funding`.
- Razorpay secret never reaches the frontend bundle.
- Public funding totals per title = sum of `PAID` fundings.
- Admin sees all fundings (Section 11.5); users see only their own.
- Legal pages must include Refund Policy and Terms (needed for Razorpay activation).

---

## 11. Admin Dashboard

Access: `role = ADMIN` only (checked on **both** frontend route guard and every `/api/admin/*` endpoint). Admins are bootstrapped from `ADMIN_EMAILS` env var.

### 11.1 Overview (`/admin`)
Cards: total titles (published/draft), total users, total funding (₹, last 30 days), total watch events today. Lists: recently added titles, latest fundings.

### 11.2 Titles list (`/admin/titles`)
- Table: poster thumb, title, kind, orientation, status, categories, episodes count, created date.
- Filters: kind, orientation, status, category. Search by title. Pagination (20/page).
- Row actions: **View**, **Edit**, **Publish/Unpublish**, **Duplicate**, **Delete** (confirm dialog).
- "＋ New Title" button.

### 11.3 Create / Edit form (single form for all six combinations)
Sections (stepper or tabs):
1. **Basics** — kind, orientation, title, tagline, description, language, year, age rating, duration (movie/short), editor rating, featured toggle.
2. **Artwork** — poster URL (required), banner URL (required for landscape), trailer URL; live image preview. *(URLs only — no file upload.)*
3. **Video** *(Movie / Short)* — video URL, stream type (auto-detected), **"Test URL" button** that loads the stream in a mini-player and shows detected qualities, duration, and any CORS/format error. Subtitle rows (label, lang, VTT URL), audio track rows.
4. **Seasons & Episodes** *(Web series)* — add/reorder seasons; add/edit/reorder/delete episodes (number, name, description, thumbnail URL, duration, video URL + Test URL, subtitles, audio, intro start/end, credits start, status).
5. **Categories** — multi-select existing categories (+ quick-create).
6. **Credits** — **Cast names**: tag-style input (type name + Enter). **Crew**: rows of `Role` + `Name`. Plain text only.
7. **Funding** — enable toggle, creator name, optional goal (₹).
8. **Publish** — Save as Draft / Publish; pre-publish validation summary listing missing required fields.

Form rules: Zod validation, inline errors, unsaved-changes warning, autosave draft locally.

### 11.4 Detailed view (`/admin/titles/:id`)
Read-only full record: all metadata, artwork previews, working preview player, seasons/episodes tree, cast & crew lists, categories, funding raised vs goal, funding list for this title, simple stats (views, watchlist adds, likes), created/updated timestamps. Buttons: Edit, Publish/Unpublish, Delete.

### 11.5 Other admin pages
- **Categories** — create, rename, reorder (drag), activate/deactivate, delete (blocked if titles attached, or reassign).
- **Funding** — table of all fundings with filters (status, date, title), totals, CSV export.
- **Users** — list with role, joined date; promote/demote admin (optional).

---

## 12. Categories

- Admin-managed (Section 11.5). Seed defaults: Action, Drama, Thriller, Comedy, Romance, Horror, Crime, Family, Sci-Fi, Devotional, Documentary, Experimental.
- Category chips on Home filter rows in place (no full reload).
- Category page `/category/:slug`: all published titles, filterable by kind and orientation.
- Home shows category rows in `sortOrder`, hiding empty categories.
- Special computed rows (not stored): **Trending** (most watch starts in 7 days), **New Releases**, **Top Rated**, **Most Supported** (funding), **Continue Watching** (user-specific).

---

## 13. REST API Specification

Base: `/api`. JSON. Errors: `{ "error": { "code": string, "message": string } }` with proper HTTP status.

### 13.1 Public
| Method | Path | Notes |
| :--- | :--- | :--- |
| GET | `/titles` | query: `kind, orientation, category, q, sort, page, limit` (published only) |
| GET | `/titles/:slug` | full detail incl. categories, seasons, episodes |
| GET | `/titles/:id/related` | |
| GET | `/home` | featured + category rows + computed rows (single call for fast load) |
| GET | `/categories` | active categories |
| GET | `/search?q=` | title, cast names, categories |
| GET | `/reels` | cursor-paginated vertical feed |
| GET | `/episodes/:id` | episode + siblings + next/prev |

### 13.2 Authenticated
| Method | Path | Notes |
| :--- | :--- | :--- |
| POST | `/auth/google` | exchange Google ID token |
| GET | `/auth/me` | |
| POST | `/auth/logout` | |
| GET/PUT/DELETE | `/library/watchlist/:titleId` | |
| PUT | `/library/reaction/:titleId` | `{ value: 1 \| -1 \| 0 }` |
| PUT | `/progress` | `{ titleId, episodeId?, positionSec, durationSec }` |
| GET | `/progress/continue` | continue-watching list |
| POST | `/funding/order` | |
| POST | `/funding/verify` | |
| GET | `/funding/mine` | |

### 13.3 Webhook
`POST /funding/webhook` — raw body, signature-verified.

### 13.4 Admin (`ADMIN` only)
`GET/POST /admin/titles`, `GET/PUT/DELETE /admin/titles/:id`, `POST /admin/titles/:id/publish|unpublish|duplicate`, `POST/PUT/DELETE /admin/titles/:id/seasons`, `POST/PUT/DELETE /admin/seasons/:id/episodes`, `PUT /admin/episodes/reorder`, `GET/POST/PUT/DELETE /admin/categories`, `GET /admin/funding`, `GET /admin/funding/export.csv`, `GET /admin/stats`, `POST /admin/validate-video-url` (server-side HEAD/GET check of the URL: reachable, content-type, is HLS manifest).

### 13.5 API hardening
- `helmet`, CORS restricted to the frontend origin with credentials, rate limiting (stricter on `/auth` and `/funding`), Zod body validation, centralized error handler, request logging.
- Pagination everywhere; never return unbounded lists.
- Public endpoints return **only `PUBLISHED`** items and never include unpublished episodes.

---

## 14. Video Delivery: URLs, CDN, and Adaptive Streaming

> This is the section that makes it "work like other OTTs". The app **does not transcode or host video**; admin pastes a URL. Quality comes from *how the video is prepared and hosted*.

### 14.1 Supported URL types
| Type | Example | Use |
| :--- | :--- | :--- |
| **HLS** (preferred) | `https://cdn.example.com/film/master.m3u8` | Adaptive bitrate on all devices |
| **MP4** | `https://cdn.example.com/film/720p.mp4` | Fallback / short clips only |
| **DASH** (optional) | `.../manifest.mpd` | Later phase, via Shaka Player |

Rule of thumb for admin guidance: **always paste the HLS master playlist (`master.m3u8`)**, not an individual quality playlist.

### 14.2 Recommended hosting pipeline (pick one)
1. **Bunny Stream** — upload original → auto-transcodes to HLS ladder → served by Bunny CDN. Cheapest, easy for India.
2. **Cloudflare Stream** — upload/URL-ingest → HLS + DASH, global CDN, signed URLs.
3. **Mux** — best analytics and player quality metrics, higher cost.
4. **AWS** — S3 (origin) + MediaConvert (HLS ladder) + CloudFront (CDN), signed URLs/cookies. Most control, most setup.
5. **Self-managed** — FFmpeg → HLS → object storage (R2/S3) behind a CDN (see ladder below).

### 14.3 Recommended encoding ladder (H.264 + AAC, 6-second segments)
| Rendition | Resolution | Video bitrate | Notes |
| :--- | :--- | :--- | :--- |
| 240p | 426×240 | 300 kbps | very weak mobile networks |
| 360p | 640×360 | 700 kbps | |
| 480p | 854×480 | 1,200 kbps | |
| 720p | 1280×720 | 2,500 kbps | default on good 4G |
| 1080p | 1920×1080 | 4,500 kbps | Wi-Fi / fibre |

- Audio: AAC 128 kbps stereo (add a 64 kbps variant for 240p).
- Keyframe interval = segment length (2 s GOP, 6 s segments), `-sc_threshold 0`, closed GOPs → clean quality switching.
- **Vertical content** uses the same ladder rotated (e.g. 360×640, 540×960, 720×1280, 1080×1920).
- Include **WebVTT** subtitles and, if multi-language, **alternate audio renditions** inside the master playlist (`EXT-X-MEDIA`).
- Thumbnail sprite / trick-play track is optional (for seek preview).

Reference FFmpeg (for the self-managed option; one rendition shown):
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -profile:v high -b:v 2500k -maxrate 2675k -bufsize 5000k \
  -vf scale=-2:720 -g 48 -keyint_min 48 -sc_threshold 0 -c:a aac -b:a 128k -ar 48000 \
  -hls_time 6 -hls_playlist_type vod -hls_segment_filename "720p/seg_%03d.ts" 720p/index.m3u8
```
(Build one per rendition, then write `master.m3u8` referencing all of them.)

### 14.4 CDN requirements
- Serve manifests and segments over **HTTPS** with **HTTP/2 or HTTP/3**.
- **CORS** headers on the CDN: `Access-Control-Allow-Origin: <frontend origin or *>`, allow `GET, HEAD, OPTIONS`, expose `Content-Length, Content-Range`. *(Most "player not working" bugs are missing CORS.)*
- **Range requests** enabled (needed for MP4 seeking).
- Cache policy: segments (`.ts`/`.m4s`) `Cache-Control: public, max-age=31536000, immutable`; `.m3u8` for VOD `max-age=300` (live would be ~2 s).
- Correct MIME types: `application/vnd.apple.mpegurl` (m3u8), `video/mp2t` (ts), `video/mp4`, `text/vtt`.
- Enable CDN features: tiered/regional caching, Brotli/Gzip for playlists, an **India edge/PoP**.
- Optional **signed URLs / token auth** with expiry to prevent hot-linking (Section 15).

### 14.5 Admin "Test URL" tool
Before saving, admin clicks **Test URL**:
1. Server `POST /admin/validate-video-url` does a HEAD/GET: reachable, status 200/206, content type plausible.
2. Browser loads it in a hidden hls.js instance: parses manifest, lists detected **qualities, audio tracks, subtitle tracks, duration**.
3. Shows green ✓ / red ✗ with a plain-language reason (e.g. "CORS blocked", "Not an HLS manifest", "Mixed content http").

---

## 15. Content Protection (Practical, Non-DRM)

- Prefer CDN **signed URLs** (short expiry) if the provider supports it; the API can return a tokenised URL via `GET /api/playback/:id` (extension point — v1 may simply return the stored URL).
- Referrer/domain lock at the CDN level (allow only the site domain).
- Disable context menu on the video element; no direct download button. (This deters casual copying only; true protection needs DRM — Widevine/FairPlay, future phase.)
- Never expose admin-only fields in public API responses.

---

## 16. Video Player Specification

Two UI skins, **one shared engine**: `useVideoEngine()` hook wrapping `<video>` + hls.js.

### 16.1 Engine behaviour
- If `streamType = HLS`:
  - If `Hls.isSupported()` → use hls.js (`enableWorker: true`, `lowLatencyMode: false`, `capLevelToPlayerSize: true`, `startLevel: -1` (auto), `abrEwmaDefaultEstimate` tuned for Indian mobile networks ≈ 1.5 Mbps, `maxBufferLength: 30`, `backBufferLength: 30`).
  - Else if `video.canPlayType('application/vnd.apple.mpegurl')` → native HLS (Safari/iOS).
- If `MP4` → assign `src` directly.
- Always **destroy** hls.js and clear `src` on unmount/route change (prevents leaks and ghost audio).
- **Error recovery**: on `NETWORK_ERROR` retry up to 3× with backoff (`startLoad()`); on `MEDIA_ERROR` call `recoverMediaError()`; on fatal → show error screen with **Retry** and "Report problem".
- **Fast start**: begin at the lowest sensible level (or bandwidth estimate), then ramp up; preconnect to the CDN origin on the detail page (`<link rel="preconnect">` injected dynamically).
- Resume at saved `positionSec` (from API, fallback to localStorage for guests).

### 16.2 Landscape player controls
- Play/Pause, ±10 s skip, seek bar with **buffered ranges** and hover time (thumbnail preview if sprite provided), current/total time.
- Volume + mute (remembered).
- **Quality menu**: Auto (shows current e.g. "Auto (720p)") + manual levels (1080p, 720p, 480p, 360p, 240p); persisted per device.
- **Audio language** menu (HLS audio tracks or `audioTracks` JSON).
- **Subtitles** menu: Off + tracks (WebVTT via `<track>`); size/background options (small/medium/large).
- **Playback speed**: 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×.
- Fullscreen (and orientation lock to landscape on mobile when supported), **Picture-in-Picture**, cast icon (optional later).
- Auto-hide controls after 3 s inactivity; always visible when paused.
- Buffering spinner; "Network is slow, lowering quality" toast when ABR drops.
- Series extras: **Skip Intro**, **Next Episode** overlay, episode list panel, previous/next buttons.
- **Support Creator** icon opens funding modal (pauses video).
- Keyboard: `Space/K` play, `←/→` ±5 s, `J/L` ±10 s, `↑/↓` volume, `M` mute, `F` fullscreen, `C` captions, `>` `<` speed, `0–9` jump to %.
- Touch: tap show controls, double-tap sides ±10 s, drag seek bar.
- Media Session API (lock-screen title/artwork, play/pause).
- Accessibility: ARIA labels, focusable controls, visible focus ring.

### 16.3 Vertical player controls
- Immersive, minimal: tap play/pause, thin seek bar, mute, action rail (Like, Watchlist, Share, Support, Episodes), quality in "More" sheet.
- Uses `object-fit: cover` for 9:16, `contain` if the source isn't vertical.
- Safe-area insets respected on mobile (notch/home bar).

### 16.4 Analytics events (lightweight, own API)
`play_start`, `play_30s`, `play_complete`, `quality_change`, `buffer_event` (count + duration), `error`. Sent in batches to `POST /api/events` (optional; powers Trending and admin stats).

### 16.5 Player acceptance tests
- Same HLS URL plays on Chrome, Edge, Firefox, Android Chrome, Safari macOS, Safari iOS.
- Throttle network in DevTools (Slow 4G → Fast 4G → Wi-Fi): quality steps down/up automatically without stalling > 2 s.
- Manual quality switch changes level within ~2 segments without restarting the video.
- Seeking anywhere works; resume position restores correctly.
- Navigating away stops audio and network requests immediately.
- MP4 fallback works with Range requests.

---

## 17. Non-Functional Requirements

- **Performance**: Home LCP < 2.5 s on 4G; route-level code splitting (admin and player lazy-loaded); images lazy-loaded with fixed aspect-ratio boxes (no layout shift); `GET /home` served in one request.
- **Resilience**: top-level `ErrorBoundary`, per-route error elements, TanStack Query retry/empty/error states on every list; no white screens.
- **No mock-data fallback in production.** Seed script provides demo data for development only.
- **Security**: httpOnly cookie auth, CSRF-safe (SameSite + custom header check on mutations), input validation, rate limits, secrets only in server env, HTTPS only.
- **SEO/Share**: per-title `<title>` and Open Graph tags (client-side via `react-helmet-async`; optional prerender later).
- **Accessibility**: WCAG AA contrast, keyboard navigation, reduced-motion respect.
- **Browser support**: last 2 versions of Chrome, Edge, Firefox, Safari; iOS 15+; Android 9+.
- **Quality gates**: ESLint, TypeScript strict, Prettier; Vitest unit tests (validators, progress logic, next-episode logic); Playwright smoke tests (login mock, browse, play, admin create).

---

## 18. Environment Variables

**apps/api/.env**
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"            # prod: postgresql://...
JWT_SECRET=<long-random-string>
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>.apps.googleusercontent.com
ADMIN_EMAILS=you@example.com,partner@example.com
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
REQUIRE_LOGIN_TO_WATCH=false
```

**apps/web/.env**
```bash
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=<same-google-client-id>
```

Google Cloud setup: create OAuth **Web client**, add authorised JavaScript origins (`http://localhost:5173`, production domain).

---

## 19. Build Plan (Phases for Antigravity)

Each phase must end with: `npm run lint && npm run typecheck && npm run build` passing.

### Phase 1 — Foundation
- Monorepo, Vite web app, Express API, Prisma schema + migration, seed script (categories + ≥ 6 demo titles covering all six kind/orientation combos, using public test streams below).
- Layout shell, router, dark theme tokens, header + bottom nav, ErrorBoundary, API client, TanStack Query setup.
- **Accept:** app boots, `/api/home` returns seeded data, no console errors.

### Phase 2 — Catalog UI
- Home (hero, orientation toggle, category chips, rows), Browse by kind, Category page, Search, Title detail page (movie/short/series with seasons list).
- **Accept:** all six combos display correctly; filters work; empty/error/loading states exist.

### Phase 3 — Player (most important)
- `useVideoEngine`, landscape player, quality/audio/subtitle/speed/PiP/fullscreen, keyboard + touch, resume, error recovery.
- **Accept:** Section 16.5 checklist passes with the seeded HLS streams.

### Phase 4 — Series continuity + Vertical
- Episode page, next-episode overlay, skip intro, continue watching, progress API; vertical feed + vertical player + episode drawer.
- **Accept:** finishing an episode auto-plays the next; reload resumes; reels snap, autoplay, and unload correctly.

### Phase 5 — Auth + Library
- Google sign-in button + server verification + JWT cookie, login modal flow, watchlist, likes, library page.
- **Accept:** login/logout persists across refresh; protected actions prompt login.

### Phase 6 — Funding
- Razorpay order/verify/webhook, support modal, supported list, funding progress bar.
- **Accept:** test-mode payment succeeds; replaying verify doesn't double count; tampered signature is rejected.

### Phase 7 — Admin
- Route guard + API guard, titles list, create/edit form (all sections), detailed view, Test URL tool, categories, funding report, stats.
- **Accept:** admin can create each of the six combinations end-to-end and see it live on the public site; non-admin gets 403.

### Phase 8 — Hardening & Deploy
- Rate limits, helmet, Playwright smoke tests, Vercel/Render deployment configs, `vercel.json` SPA rewrite + immutable asset caching, README with setup steps.
- **Accept:** production build deployed, CORS correct, Lighthouse performance ≥ 85 mobile on Home.

---

## 20. `AGENTS.md` (copy this into the repo root)

```md
# Agent Rules — Rasigan OTT v2
- SPEC.md is the single source of truth. Do not add features not in the spec.
- Build one phase at a time. Stop after the phase and report against its acceptance checklist.
- TypeScript strict. No `any` unless commented why. No unused code.
- Never use Supabase, Firebase, or any BaaS. Auth = Google Identity Services + own JWT cookie.
- Never hardcode secrets. Read from env. Razorpay secret and webhook secret are server-only.
- Every list/page must have loading, empty, and error states.
- Video playback must go through useVideoEngine; destroy hls.js on unmount.
- No video upload UI anywhere. Video/image fields are URL inputs only.
- Cast and crew are plain text only; no profile pages or routes.
- Before finishing a task run: npm run lint, npm run typecheck, npm run build, and fix all errors.
- Write small, focused commits/changes; do not refactor unrelated files.
```

---

## 21. Seed / Test Streams (for development)

Use public test HLS streams so the player can be verified before real content exists:

| Name | URL | Notes |
| :--- | :--- | :--- |
| Mux test stream | `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` | multi-bitrate ABR ladder |
| Big Buck Bunny MP4 | `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4` | MP4 fallback test |
| Sintel MP4 | `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4` | second MP4 for episodes |

Replace with real CDN URLs through the admin dashboard once the content is hosted. Seed placeholder images using any HTTPS image URLs (e.g. `https://picsum.photos/seed/rasigan1/400/600`).

---

## 22. Definition of Done (whole project)

- [ ] All six kind × orientation combinations can be created in admin and played publicly.
- [ ] Web series: seasons, episode page, continue watching, auto-next, skip intro all work.
- [ ] Player passes Section 16.5 on desktop and mobile; adaptive switching verified under throttling.
- [ ] Google sign-in works; admin gating works on UI and API.
- [ ] Funding works in Razorpay test mode with signature verification and webhook.
- [ ] No Supabase code or dependency anywhere; no cast/crew profile routes; no upload pages.
- [ ] Lint, typecheck, build, and smoke tests pass; deployed with correct CORS and caching.
