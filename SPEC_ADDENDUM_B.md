# Rasigan OTT v2 — Addendum B: Creator Earnings Visibility, Cast & Crew Page, Content Form

> **Save as:** `SPEC_ADDENDUM_B.md` next to `SPEC.md` and `SPEC_ADDENDUM_A.md`.
> **Precedence:** Addendum B > Addendum A > SPEC. Where B conflicts with earlier files, B wins.
> It replaces: SPEC §3 (category/genre naming), the cast/crew fields of `Title`, SPEC §11.3 and Addendum A §A7.2 (content create/edit form), and the creator-facing money rules in Addendum A (§A1.1, §A6, §A9, §A10).

---

## B1. Creator Earnings Visibility (the 60% is never shown to creators)

The creator share percentage is an internal business rule. Creators see **their earnings amount only**.

### B1.1 What a Creator sees
- A single figure labelled **"Earnings"** (and "Pending payout", "Paid so far"). No percentage, no "share", no "60%".
- Per title: views, watch time, supporters **count**, and Earnings.
- Per payout statement: cycle, period, **Earnings**, adjustments, net payable, status, reference (UTR).

### B1.2 What a Creator must never receive (UI **and** API)
- `creatorShareBps` / any percentage or ratio
- `grossPaise` / gross contribution totals
- `platformSharePaise` / platform amounts
- Per-supporter contribution **amounts** (a supporter list may show display name, message and date only; amounts hidden). Showing both per-contribution amounts and earnings would let a creator work out the percentage.
- Other creators' data

### B1.3 Implementation rules
- Creator endpoints use dedicated response DTOs (`CreatorEarningsDto`) that **do not contain** the forbidden fields; do not filter at the UI level only.
- Rename in all creator-facing UI, PDF/CSV exports and notifications: "Creator share" → **"Earnings"**.
- Statement PDF/CSV for creators lists **per-title earnings for the cycle**, not per-contribution rows.
- Add an automated test: every `/api/creator/*` response JSON is scanned and fails the build if it contains keys `creatorShareBps`, `grossPaise`, `platformSharePaise`, `gross`, `platform`.
- The Super Admin panel keeps the full breakdown (gross, creator share, platform share) and the `creatorShareBps` setting.

---

## B2. Naming: Category, Genre, Tags

To match how you describe the content form, use these terms everywhere (UI, API, database, analytics filters):

| Term in UI | Meaning | Values | Stored as |
| :--- | :--- | :--- | :--- |
| **Category** | The content type | Movie · Short Film · Web Series | `Title.kind` (`MOVIE`, `SHORT_FILM`, `WEB_SERIES`) |
| **Genre** | Admin-managed list of genres | Action, Drama, Comedy, Thriller, … | `Genre` table (many per title) |
| **Tags** | Free-form keywords typed by the admin | action, comedy, village, family … | `Tag` table (many per title) |
| **Orientation** | Landscape or Vertical | | `Title.orientation` |

Changes to earlier files:
- The old content-grouping `Category` model/`TitleCategory` and routes `/category/:slug`, `/admin/categories` are **renamed to Genre** (`Genre`, `TitleGenre`, `/genre/:slug`, `/admin/genres`).
- Analytics filters (Addendum A §A8.2): **Category** (type) · **Genre** · **Orientation** · **Creator** · date range.
- Home page "category chips" become **genre chips**; the Movies / Short Films / Web Series navigation continues to use Category (kind).

---

## B3. Cast & Crew

### B3.1 Data model (Prisma delta)

```prisma
enum CrewRole { DIRECTOR PRODUCER WRITER CINEMATOGRAPHER EDITOR MUSIC_DIRECTOR LYRICIST CHOREOGRAPHER OTHER }

model Person {                         // one record per cast/crew member
  id        String   @id @default(cuid())
  name      String
  nameKey   String                     // lowercase, trimmed, single-spaced, for matching
  photoUrl  String?                    // https image URL (no upload)
  bio       String?                    // short bio, max 300 chars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cast      TitleCast[]
  crew      TitleCrew[]
  @@index([nameKey])
}

model TitleCast {
  titleId       String
  personId      String
  order         Int      @default(0)   // billing order (drag to reorder)
  characterName String?                // optional "plays X"
  title  Title  @relation(fields: [titleId], references: [id], onDelete: Cascade)
  person Person @relation(fields: [personId], references: [id], onDelete: Restrict)
  @@id([titleId, personId])
}

model TitleCrew {
  id         String   @id @default(cuid())
  titleId    String
  personId   String
  role       CrewRole
  customRole String?                   // used when role = OTHER
  title  Title  @relation(fields: [titleId], references: [id], onDelete: Cascade)
  person Person @relation(fields: [personId], references: [id], onDelete: Restrict)
  @@unique([titleId, personId, role])
}

model Genre {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  titles    TitleGenre[]
}
model TitleGenre {
  titleId String
  genreId String
  title Title @relation(fields: [titleId], references: [id], onDelete: Cascade)
  genre Genre @relation(fields: [genreId], references: [id], onDelete: Cascade)
  @@id([titleId, genreId])
}

model Tag {
  id     String @id @default(cuid())
  name   String @unique                // stored lowercase
  titles TitleTag[]
}
model TitleTag {
  titleId String
  tagId   String
  title Title @relation(fields: [titleId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([titleId, tagId])
}
```

`Title` changes: **remove** `castNames`, `crewCredits`; add relations `cast TitleCast[]`, `crew TitleCrew[]`, `genres TitleGenre[]`, `tags TitleTag[]`; remove the old `categories` relation.

### B3.2 Admin page: Cast & Crew (`/people`)

A new page in the admin panel (sidebar item **Cast & Crew**).

**List view**
- Grid/table: profile photo (initials avatar if none), **Name**, short bio (truncated), number of titles, roles used (Actor, Director …).
- Search by name; filter: *All · Missing photo · Missing bio · Not used in any title*.
- Sort: name A–Z, recently added, most titles.
- Pagination (24 per page).
- **＋ Add person** button.

**Add / Edit (modal or side drawer)**
| Field | Rules |
| :--- | :--- |
| **Name** | required, 2–80 chars |
| **Profile picture** | **image URL** (https) with live preview and square crop preview; no file upload in v1 |
| **Short bio** | optional, max 300 chars with counter |
- Shows **"Appears in"**: list of titles (links to the content detail view) with role.
- **Delete**: if the person is linked to titles, show "Used in N titles — remove from all titles and delete?" with confirmation (the API requires `?force=true`; otherwise 409).
- **Merge duplicates**: choose a second person → all links move to the kept person, the other is deleted (audited).
- Duplicate warning when saving a name that matches an existing `nameKey`.

All create/edit/delete/merge actions are written to the audit log.

### B3.3 Public site use
- Title detail page shows cast as **avatar + name chips** (and crew as "Role — Name"). Clicking/tapping a chip opens a small popover with the **short bio** and photo. **No portfolio/filmography page** (still out of scope).

---

## B4. Content Add / Edit Form (Admin)

One form for create and edit, used for all six combinations (3 categories × 2 orientations). Layout: single scrolling page with a **sticky bottom bar** (`Save draft` · `Publish` · `Cancel`), a right-hand **live preview card** on desktop, and an unsaved-changes warning. Fields appear in this order:

### B4.1 Fields in order

| # | Field | Type / behaviour | Required to publish |
| :-: | :--- | :--- | :---: |
| 1 | **Title** | text, 2–120 chars; slug auto-generated (editable, unique) | ✅ |
| 2 | **About / Description** | multi-line, 20–2000 chars, character counter | ✅ |
| 3 | **Category** | segmented control: **Movie · Short Film · Web Series** | ✅ |
| 4 | **Episodes** | **only shown when Category = Web Series** (see B4.2) | ✅ (≥ 1) |
| 5 | **Genres** | multi-select chips from the Genre table; "＋ Create genre" inline | ✅ (≥ 1) |
| 6 | **Tags** | free-form chip input: type and press **Enter** or **comma** to add (e.g. `action`, `comedy`); suggestions from existing tags; stored lowercase; max 20 tags, each ≤ 30 chars; Backspace removes last | optional |
| 7 | **Cast** | typeahead from the database with auto-save (see B4.3) | optional |
| 8 | **Movie link** | video URL — **Movie / Short Film only** (see B4.4) | ✅ (Movie/Short) |
| 9 | **Trailer link** | video URL (see B4.4) | optional, recommended |

### B4.2 Additional fields (needed for the platform to work)
Placed in grouped sections after the nine fields above:
- **Orientation**: Landscape / Vertical (required).
- **Artwork**: Poster URL (required), Banner URL (required for Landscape); live image preview.
- **Details**: Year, Language, Age rating (U / U/A / A), Duration (Movie/Short; auto-filled by "Test URL" when detectable), Editor rating (0–10), Tagline.
- **Crew**: rows of **Role** (select) + **Person** (same typeahead as Cast); roles: Director, Producer, Writer, Cinematographer, Editor, Music Director, Lyricist, Choreographer, Other (free text).
- **Subtitles & audio tracks** (collapsed "Advanced"): rows of label + language + URL.
- **Assigned creator**: searchable select of users with the Creator role, or Unassigned (Addendum A §A7.2).
- **Funding**: enable toggle, creator display name, optional goal (₹).
- **Featured on home** toggle.
- **Status**: Draft / Published / Archived (set by the bottom-bar buttons).

### B4.3 Episodes (Web Series only)

When Category is **Web Series**, the "Movie link" field is hidden and the **Episodes** section appears.

- Default: **Season 1** with one empty episode row.
- Large **＋ Add Episode** button below the list. **No upper limit in the UI** (server safety cap: 500 episodes per series). Each click appends a new row; numbering is automatic (E1, E2, E3 …) and renumbers after drag-reorder or delete.
- Secondary **＋ Add Season** button; seasons are collapsible accordions. Rows are collapsed by default except the newest, so very long series stay fast.
- Each episode row fields:
  | Field | Notes |
  | :--- | :--- |
  | Episode name | required |
  | Description | optional |
  | Thumbnail URL | optional (falls back to poster) |
  | **Episode video link** | required to publish; **Test URL** button; auto-fills duration |
  | Duration (min) | auto or manual |
  | Advanced (collapsed) | intro start/end seconds, credits start second, subtitles, audio tracks |
- Row actions: **drag handle** (reorder), **duplicate**, **delete** (confirm if it has a link), **preview play**.
- **Bulk add**: "Paste multiple links" opens a textarea; one URL per line creates one episode per line (named "Episode N", editable later).
- Draft saving allows incomplete episodes; publishing requires at least one episode with a valid, tested video link. Unfinished episodes can be saved with `status = DRAFT` and are hidden from the public site until published.
- Editing a published series: adding a new episode later is supported, and the public site shows it as soon as that episode is published.

### B4.4 Cast typeahead with automatic save

Behaviour of the **Cast** field (and the Crew person field):

1. Admin types in the box (minimum 1 character, 250 ms debounce).
2. The app calls `GET /api/admin/people/suggest?q=...&limit=8` and shows matching people from the database (photo, name, short bio snippet, "in N titles"), matching on `nameKey` (case-insensitive, prefix and contains).
3. **Select a match** → the person is added as a chip.
4. **No match / press Enter on a new name** → the dropdown shows **"＋ Add 'Name' as new person"**. Confirming immediately calls `POST /api/admin/people` which **saves the person to the database right away** (name only) and returns the new record; a chip is added. The person then appears in the Cast & Crew page (flagged "Missing photo / Missing bio") where details can be completed later.
5. If an exact `nameKey` match already exists, the API returns the existing person (no duplicate is created). If the admin truly means a different person with the same name, the dropdown offers **"Create another 'Name'"** (`allowDuplicate=true`).
6. Chips are **drag-reorderable** (billing order), with an optional "plays …" character name, and removable (removing the chip only detaches the person from this title; it never deletes the person).
7. Chips show a small warning dot when the person has no photo/bio; click opens the same edit drawer as the Cast & Crew page, so details can be fixed without leaving the form.
8. The chip list is saved with the title; people already exist in the database from step 4, so a half-finished form never loses them.

### B4.5 Movie link and Trailer link (the key fields)

Both are prominent inputs with a **Test URL** button and a mini preview player.

- **Movie link** (Movie / Short Film): `https://` URL to an **HLS master playlist (`.m3u8`, preferred)**, or `.mp4`. Stream type auto-detected (override allowed).
- **Trailer link**: same formats, **plus** YouTube / Vimeo links (rendered through a privacy-friendly embed). Optional, but the form shows "Add a trailer to improve the details page" when empty.
- **Test URL** result panel: ✓ reachable · detected type · available qualities (e.g. 240p–1080p) · duration · audio/subtitle tracks · or a plain-language failure ("Blocked by CORS", "Not a valid HLS playlist", "Link is http, not https", "File not found (404)").
- The server also performs a reachability check (`POST /api/admin/validate-video-url`).
- Publishing is blocked with an inline message if the Movie link (Movie/Short) or all episode links (Series) fail validation. Draft saving is always allowed.

### B4.6 Validation and behaviour
- Zod schemas in `packages/shared`, shared by form and API; inline error messages under fields; first error scrolls into view.
- Autosave of the form to browser storage every 10 s (restored after a crash or refresh) — in addition to explicit **Save draft**.
- Changing Category from Web Series to Movie/Short with episodes present shows a confirmation ("Episodes will be kept as drafts but hidden").
- Changing Orientation shows a reminder to check artwork ratios (poster 2:3 and banner 16:9 for Landscape).
- Every save is audited (before/after).

### B4.7 Detailed view (read-only) additions
The admin content detailed view (Addendum A §A7.2) additionally shows: genres, tags, cast with photos in billing order, crew with roles, the movie/trailer links with working preview players, the episode tree (seasons, episodes, links, status), and "Edit" shortcuts to each section.

---

## B5. API Additions / Changes

**People (admin)**
- `GET /admin/people?q=&filter=missing-photo|missing-bio|unused&sort=&page=`
- `GET /admin/people/suggest?q=&limit=8`
- `POST /admin/people` `{ name, photoUrl?, bio?, allowDuplicate? }` → returns existing person on `nameKey` match unless `allowDuplicate`
- `GET /admin/people/:id` (includes titles and roles)
- `PUT /admin/people/:id` `{ name, photoUrl?, bio? }`
- `DELETE /admin/people/:id?force=true`
- `POST /admin/people/:id/merge` `{ intoId }`

**Genres & tags (admin)**
- `GET/POST/PUT/DELETE /admin/genres`
- `GET /admin/tags/suggest?q=`
- Tags are created on the fly when a title is saved (find-or-create by lowercase name).

**Titles (admin)** — `POST/PUT /admin/titles` payload now contains:
```json
{
  "title": "", "description": "", "kind": "MOVIE|SHORT_FILM|WEB_SERIES",
  "orientation": "LANDSCAPE|VERTICAL",
  "genreIds": [], "tags": ["action","comedy"],
  "cast": [{ "personId": "", "order": 0, "characterName": "" }],
  "crew": [{ "personId": "", "role": "DIRECTOR", "customRole": null }],
  "videoUrl": "", "trailerUrl": "",
  "seasons": [{ "number": 1, "episodes": [{ "number": 1, "name": "", "videoUrl": "", "...": "" }] }],
  "posterUrl": "", "bannerUrl": "", "creatorId": null, "status": "DRAFT|PUBLISHED"
}
```
(The remaining fields from SPEC §4 and Addendum A apply.) Episodes are saved atomically with the title in one transaction.

**Public**
- `GET /titles/:slug` returns cast (name, photoUrl, bio, characterName), crew (name, role), genres, tags.
- `GET /genres`, `GET /titles?genre=slug&tag=...&q=` (search also matches cast names, tags and genres).

---

## B6. Changes to Earlier Spec Sections (quick list for the agent)

1. Remove `castNames` / `crewCredits` JSON fields; use `TitleCast` / `TitleCrew`.
2. SPEC "no cast profile pages" stays: there is **no public person route**, but an admin **Cast & Crew** page with name, photo and short bio exists, and bios appear in popovers.
3. Rename grouping `Category` → `Genre` everywhere; "Category" now means Movie / Short Film / Web Series.
4. Seed script: ≥ 12 people (some with photo and bio, some without), 8 genres, 20 tags.
5. Creator-facing money copy: remove all mentions of "60%" / "share" (B1).
6. Admin sidebar order: Dashboard · Content · **Cast & Crew** · Genres · Creators · Users · Analytics · Funding · Payouts · Audit log · Settings.

---

## B7. Phase Adjustments

- **Phase 7A (Admin content)** is split into:
  - **7A-1:** Genres, Tags, **Cast & Crew page**, people suggest/create API.
  - **7A-2:** Content form (fields 1–9 in order), Test URL tool, episodes builder (add/reorder/bulk), detailed view.
- **Phase 7D (Creator portal)** must include the B1 DTO + automated forbidden-field test.

### Acceptance checks
- [ ] Typing "Vij" in Cast shows matching people from the database; typing a new name and confirming saves it immediately and it appears on the Cast & Crew page.
- [ ] Re-entering an existing name never creates a duplicate unless "Create another" is chosen.
- [ ] Cast & Crew page: add, edit (name, photo URL, bio), search, delete with confirmation, merge.
- [ ] Selecting Web Series shows Episodes; clicking ＋ Add Episode 50 times works smoothly; reorder renumbers; bulk paste of 10 links creates 10 episodes.
- [ ] Movie link and Trailer link both have Test URL with clear results; invalid links block publishing but not saving a draft.
- [ ] Tags: Enter adds a chip, duplicates are ignored, stored lowercase, suggestions appear.
- [ ] A scripted scan of all `/api/creator/*` responses finds no `creatorShareBps`, `grossPaise`, `platformSharePaise`, percentage or per-contribution amounts.
