# KUMO_AUDIT.md

Audit of the 1(WAN) / Kumo High Court app, read-only, as of the latest pushed commit on `main` (27 Oct 2026). No secrets, calendar addresses or personal data appear in this report. **Verified** means seen directly in the code or migrations. **Assumed** means inferred and not confirmed. Nothing was run, deployed or tested against the live site, Supabase or Vercel.

## 1. Framework and structure
- **Stack (verified):** Next.js 15.5.28 (App Router), React 19.1, TypeScript 5.8, Supabase (`@supabase/ssr`, `supabase-js` 2.50), `astronomy-engine` 2.1.19 (Luna), `lightweight-charts` 4.2.3 (technicals). No UI framework and no state library.
- **Layout (verified):** `apps/web` is the app. `supabase/migrations` holds 0001 to 0005. `scripts/` holds the Python and JS import tools. `crew/kumo.md` is the Kumo review prompt. `prompts/INGEST.md` documents the ingest format. `reference/` holds the old v52 dashboard and the style canvas. `docs/` holds the briefs, the progress log and `milestones.json`.
- **Routes (verified):** `/login`, `/` (landing), `/dashboard` (the court), `/crew`, `/progress`. There are 20 API routes: atr, calendar, derivs, econ, export (plus `export/weekly`), feedback, geocode, health, ingest/brief, ledger, news, prices, spending, state, ta, telegram, water and weather.
- **Two root layouts:** the dashboard has its own, so its CSS never mixes with the rest of the app.
- **Size:** 97 source files. Tests: 2 files (technical-analysis maths and clustering). `package.json` has a `test` script, but no UI, API or RLS tests exist.

## 2. Pages and modules, with status
| Module | Status | Evidence |
|---|---|---|
| Login, invite-only, session refresh | Working (code) | `middleware.ts` |
| Court home: stage, crew, needs-you-now, weather, week strip, week ahead | Built | `CourtHome`, `Stage` |
| Today, quests, XP, levels, stars, streak | Built, ported from v52 | `quests.ts`, `actions.ts` |
| Garden: 8 branches, decay from activity, weed out | Built | `GrowLive`, `garden.ts`, `gardenMap.ts` |
| Diary, weekly recap, "count your wins", archive | Built | `GrowLive` |
| Calendar: week, agenda, month, layers, free gaps | Built | `CalendarTab`, `lib/calendar.ts` |
| Life: Money, Trade, Grid & Wins, Samsara | Built, on imported data | `MoneyLive`, `TradeLive`, `GridWins`, `SamsaraLive` |
| Luna: computed sky, astro-calendar cross-check, natal transits | Built | `LunaSky`, `sky.ts` |
| Technicals, trendlines, levels | Built | `TechLive`, `ta.ts`, `candles.ts` |
| News, Telegram (public), economic calendar, clustering, funding and open interest, in-app alerts | Built | `news.ts`, `telegram.ts`, `econ.ts`, `cluster.ts`, `derivs.ts` |
| Kumo weekly packet, Copy for Claude, protected read endpoint | Built | `packet.ts`, `PacketLive`, `export/weekly` |
| Progress page | Built, reads `docs/milestones.json` | `progress/page.tsx` |
| Live chat (step 13) | Not built (needs an API key, skipped) | milestones |

**Not verified anywhere:** that any screen renders correctly in a browser. Claude Code only ran builds, and no browser check was made for this audit.

## 3. Design system
- **Fonts:** one Google Fonts `<link>` loads Baloo 2, Atkinson Hyperlegible, Silkscreen (pixel), Ma Shan Zheng, Noto Serif SC and Quicksand. They are exposed as `--font-display`, `--font-pixel` and `--font-body`. The live site depends on Google Fonts at runtime.
- **CSS:** one global `dashboard.css` of about 75 KB (18 media queries), plus `globals.css` and `pixel.css`. Colours are CSS variables, with day and night driven by `prefers-color-scheme` plus a saved `data-theme` override. Plain CSS only, with no Tailwind or CSS modules.
- **Sprites:** code-drawn SVG rects in `spriteDefs.ts` (about 30 KB) and `PixelSprite.tsx`. The style spec (32x32 grid, plum outline, blush cheeks, one gold accent) lives in `CLAUDE.md` and `reference/style-canvas`. This is the main asset to protect in a redesign.
- **Icons and animation:** no icon or animation library was found. Animation is CSS and hand-written (the crew walks and hops, idle crew enter the palace).
- **Not present:** no `public/` folder, so no app icons, favicon set or images.

## 4. Database, auth and row-level security
- **Tables in migrations (verified):** `profiles`, `user_state`, `briefs`, `agent_memory`, `feedback`, `usage`, `trades`, `plans`, `gamble`, `ledger_settings`, `spending`, `watering_events`. Migrations 0004 and 0005 are confirmed applied by the owner. 0001 to 0003 are assumed applied.
- **RLS (verified in SQL):** every per-user table has an "own rows" policy (`user_id = auth.uid()`). `briefs` is readable when `user_id` is null (shared) or the user's own. `usage` is read-only for the owner. **Not confirmed:** whether `agent_memory`, `profiles` and `usage` have write protections beyond those policies, and whether RLS is actually enabled on the live database.
- **Auth (verified):** Supabase login. Middleware redirects signed-out users and returns 401 JSON for API calls. Two routes bypass login and use their own secrets (`/api/ingest/brief` with `INGEST_SECRET`, `/api/export/weekly` with `READ_SECRET`). The service-role key is used only server-side.
- **Tables the app code never touches (verified by search):** `usage`, `agent_memory` and `profiles` have no reads or writes in the app, apart from "Export my data". The planned token log is therefore not recording anything. Nothing writes to `usage`.
- **The main data store is one JSON row:** `user_state` (key `data`, with a `version` column). The save API merges only keys listed in `OWNED_KEYS` and refuses anything else.

## 5. Google Calendar
- **Storage:** secret iCal addresses live only in server environment variables (`GCAL_ICAL_URL_1..5`, names in `GCAL_NAME_1..5`, plus one legacy single address). They are not in the database or the repo, and the code states they are never logged.
- **Fetching:** server-side, one fetch per feed, results cached for 15 minutes in memory. A failing feed does not break the others.
- **Parsing:** done in-house: RRULE (daily to yearly with interval, count, until, by-day, by-month-day, by-month), exceptions and moved or cancelled occurrences, all-day events, and Asia/Singapore time zone maths.
- **Rendering:** the Calendar tab, the Court strip and Week ahead, the free-gap finder, and Luna's astro cross-check.
- **Limits:** strictly read-only. There is no sign-in with Google, no write access, no event creation and no two-way sync. Google's secret feeds can lag by hours. The in-memory cache resets on serverless cold starts. Friends cannot connect their own calendars yet, because addresses are server variables for one owner.
- **Worth checking:** the "astro" and new "work" feed names are matched by label. Whether the environment variables have been updated is unknown.

## 6. Sources of truth and duplication risks
- **Calendar events:** the iCal feeds (read-only, external).
- **Tasks and quests:** `user_state` keys (`q`, `days`, `uq`, `dump`), with quests defined in `quests.ts`. Some quests read the calendar by pattern match.
- **Life admin, bills and care:** `user_state.life`, entered in Settings.
- **Money:** `user_state.mny` (typed lines), the imported Money Wins blob (`money` and `defs.money`), and the `spending` table.
- **Trades, plans and gamble:** real tables, and the safest data.
- **Grid, Small Wins and Samsara:** ticks live in `user_state`. Each tick also writes a row to `watering_events`.
- **Duplication risks (verified or likely):**
  1. Bills and "coming up" exist in `life` (Settings) and in the imported Money `up` list. The brief intended one list, and this was not verified as merged.
  2. Garden state exists in the legacy `gd` and in `watering_events` plus `grid`. Both are live.
  3. Money has typed `mny` and the imported `money` blob.
  4. Study hours and X post counters exist in `cad` and `samsara.t`. The brief says they are shared. Not verified.
  5. A tick's state and its watering event can disagree if one write fails. The two writes are not one transaction.

## 7. Research briefs: ingest, storage, rating, display
- **Ingest (verified):** `POST /api/ingest/brief` with a Bearer secret (constant-time check), a 200 KB limit, a dry-run option and a light in-memory rate limit of 20 requests per 10 minutes. It writes shared briefs (`user_id` NULL) with the service-role key and maps `kind` through `briefKinds.ts`.
- **Display:** `BriefTabs` and the Court brief cards render brief text with a small Markdown renderer (`mdLite`). Some components use `dangerouslySetInnerHTML`, so the sanitising in `mdLite` needs a review.
- **Rating:** Useful / Not useful saves to `feedback.items` per user and brief kind (last 60 kept).
- **Not done:** the six scheduled tasks still write to the old artifact. They are not yet pointed at this app (assumed from the docs, not verified). A brief has no "3 things" summary yet.
- **News:** 13 original feeds plus 13 more tested sources, a Telegram public-channel reader, an economic calendar, and clustering, scoring and in-app alerts. News caches and source health are **in memory only**. There is no news table in migrations, so they reset on cold starts and history is not kept.

## 8. Progression and personalisation
- **XP, levels, stars and streak (verified):** a quest completion adds XP, stars and, for the morning-brief quest, the streak. Level-up uses `needFor(lvl)`.
- **Tails (nine):** unlock rules ported from v52 and re-pointed at the new data.
- **Garden decay:** blooming, thirsty, wilting, withered and dead, computed from real activity. Rest days and rest weeks pause it.
- **Personalisation:** region lens, move threshold and quiet hours for news, weekly-packet section toggles, birth details (private), and chart levels and lines.

## 9. Mobile and responsive
- **Verified:** the viewport meta tag, bottom tab bar on phone and left rail on desktop, a two-column layout above 980 px, stage aspect-ratio change under 600 px, and horizontally scrollable tabs.
- **Not present:** no PWA (no manifest, no service worker, no icons), no push or browser notifications, no offline support. Alerts are in-app only.
- **Unknown:** actual phone rendering was never checked.

## 10. What works, what is incomplete, what is broken
- **Likely working, unverified in a browser:** everything in section 2 except the live chat.
- **Incomplete (per `docs/status.md`):** sky colour follows the clock only; crew do not yet stand where their work is; focus sprints carry no study tag; grid dates are not a Calendar layer; the Sunday task cannot fetch the packet until `READ_SECRET` is set in Vercel; private Telegram channels need API setup.
- **Reported broken and fixed, not confirmed live:** the `/progress` page looking empty in night mode (a contrast fix was pushed), and the birth-details form being hard to find.
- **Stale:** `docs/status.md` still says steps 13 to 15 are not started. `docs/progress.md` is more current.
- **Possible small issue:** `scripts/__pycache__` is in the repo tree.

## 11. Risks to existing data and integrations during a redesign
1. **One JSON row holds almost everything:** diary, ticks, wording, money, lines and settings. A change to the shape, a bad merge or a key rename can lose data. Back up first, and keep `normalize()` tolerant.
2. **Imported private wording** (`defs`) exists only in the database. It cannot be recreated from git.
3. **The CSS is one global file.** Re-skinning can break layouts anywhere. Sprites and class names are tightly coupled to it.
4. **The ingest and weekly-export endpoints bypass login.** Keep their secret checks intact in any route or middleware change.
5. **Google Fonts and the Supabase and Vercel environment variables are external dependencies.** A change to fonts or env names can silently disable features.
6. **The in-memory caches and rate limits** behave differently across serverless instances.
7. **No automated UI, API or RLS tests.** A redesign cannot be checked by tests.
8. **A redesign must not touch** `OWNED_KEYS`, migrations, table names or the ingest contract.

## 12. Recommended incremental order
1. Back up first: use "Export my data", and note the commit to roll back to.
2. Run the current dashboard for about a week. Note what is ignored.
3. Add a few safety tests: `normalize()`, the save API, RLS own-row checks.
4. Replace remote fonts with `next/font` and add a design-token layer (colours, spacing) with no visual change.
5. Redesign one tab at a time behind a toggle, starting with the Court, then Garden, Diary, Calendar, then Life.
6. Split `dashboard.css` per component as each tab is redone.
7. Add PWA basics: manifest, icons, installable on phone.
8. Review `mdLite` for safe rendering.
9. Update the stale docs and record the new design decisions.

## Not checked in this audit
Live Supabase (RLS status, actual rows), the live site, Vercel settings and environment variables, the scheduled tasks, and browser or phone rendering.
