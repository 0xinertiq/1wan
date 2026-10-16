# Build brief: make the dashboard work (run in one go)

Owner: the Queen (beginner). Read CLAUDE.md first and obey it. Source of truth for look and behaviour: `reference/dashboard-v52.html` and `reference/style-canvas/`. Her data: Supabase tables `user_state` (key blob from the old dashboard), `briefs`, `agent_memory`, `feedback`. Never print or commit anything from `data-import/`.

## Ground rules for this run
- Work through the steps below in order, without asking between steps. Commit and push after each step (`npm run build` must pass first). Short one-line status after each push.
- Stop and ask only for something irreversible (deleting data, changing the schema destructively, dropping tables).
- Never ask her to paste keys in chat. Collect every manual step she must do into ONE numbered click-by-click checklist and print it at the very end (and save it to `docs/manual-steps.md`). Never block on a missing key: build the feature so it degrades gracefully and shows a calm "not connected yet" state.
- No screenshots. No long retry loops. If something fails twice, skip it, note it, continue.
- The app tracks, it never advises. No financial advice wording anywhere.
- Private by default. Diary and journal text is private to her, never in shared tables, included in "Export my data".
- Keep a changelog of what is real versus sample in `docs/status.md`.

## Step 1: theme and idle crew
- Light and dark theme toggle (old `themeBtn`). Use both palettes from the old file. Remember the choice in localStorage; default to the system setting.
- Idle behaviour: when she has not interacted for a while, crew characters walk into the palace on the stage, and come back out on interaction. Follow the old file's behaviour; respect `prefers-reduced-motion`.

## Step 2: load and save her state
- Read her document from `user_state`; tolerate missing keys. Writes go back with the version field, merge by key, never overwrite keys the UI does not own. Row-level security stays on.
- Make these work with her real data and save changes: Today window, Habit Quests (incl. "Evening check-in" group and "Show all quests"), streak and XP, Sakura Garden (blooming / thirsty / rotting from habit watering, drawing like the old one), "Tonight, count your wins" (counts for today, yesterday, this week, posts, streak; the three text boxes save), "Coming up" (recurring items with Done today / Paid / Booked for date, 7-day bills total), "Ideas for your free time" (free gaps of 45+ minutes between 08:00 and 22:00), Park a thought for later, the "You" tab (find it in the old file; if it cannot be found, build a simple profile and settings page and say so), diary and weekly recap (`recapBox`).
- Diary entries: private, editable, exportable.

## Step 3: Watchlist Scan
- Scan window (`scanBox`) from the newest brief of kind scan. Brief kinds in the DB and the old data differ (weekday/daily/movers/scan vs pulse/intel/scan/movers): accept both names via one mapping file, `apps/web/src/lib/briefKinds.ts`.
- Each brief window shows date, title, body, and a source-status line (see Step 6). Add useful / not useful buttons saving to `feedback`.

## Step 4: Google Calendar, read-only
- She has 5 Google calendars. Env vars `GCAL_ICAL_URL_1` to `GCAL_ICAL_URL_5` (each a secret iCal address; any may be empty), plus optional `GCAL_NAME_1` to `GCAL_NAME_5` (short labels such as Personal, Dogs). Put them in `apps/web/.env.local` and later in Vercel. Merge all events, tag each with its calendar label and a colour, de-duplicate identical events, and let her filter by calendar in the UI. One failing calendar must not break the others. Fetch and parse it on the server only, cache 15 minutes, never expose the URL to the browser, never log it.
- Show events in Today and Coming up, and use them to find free gaps. Handle recurring events, all-day events, and the Singapore timezone (Asia/Singapore).
- If no URL is set, show "Calendar not connected yet" and nothing breaks.

## Step 5: live prices
- Server route with 60-second cache. Primary source: CoinGecko public API (no key). Fallback: Crypto.com Exchange public tickers. If both fail, show last cached values with a stale label.
- Symbols come from her watchlist in her scan brief or state; default BTC, ETH, SOL.
- Show prices on the stage and in the Scan window. Read-only, no trading, no advice.

## Step 6: news that does not depend on Bigdata
- A config file `apps/web/src/lib/newsFeeds.ts` listing free RSS feeds: CoinDesk, Cointelegraph, Federal Reserve press releases, Channel NewsAsia (business), and a few others you can verify respond. Verify each feed returns valid XML now and drop dead ones.
- Server route fetches the feeds, caches 15 minutes, returns headline, source, time and link only (no article text, no paywalled scraping).
- News window (`newsWin`) shows these headlines with source and time. This is the baseline that always works even when Bigdata credits run out.
- Brief windows show a "sources" line read from an optional `sources` field in the brief body or a new nullable `meta` jsonb column on `briefs` (add it with a safe, additive migration). Example: "Bigdata unavailable, used web search and RSS".

## Step 7: ingest endpoint for her scheduled tasks
- `POST /api/ingest/brief`, protected by a long random secret in env var `INGEST_SECRET` (header `Authorization: Bearer ...`), using the Supabase service role key on the server only. Validate input strictly (kind from the mapping, title, body, optional meta). Rate-limit lightly. Write a shared brief (user_id NULL).
- Also `?dryRun=1` that validates and returns ok without writing, for her throwaway test.
- Document the exact JSON in `prompts/INGEST.md` so the scheduled tasks can be pointed at it later.
- Service role key must not appear in any client bundle. State in the manual checklist exactly which env vars Vercel needs, click by click.

## Step 8: wrap-up
- Run `npm run build`, push, then print: (a) what works with her real data, (b) what is sample only, (c) what failed or was skipped and why, (d) ONE numbered click-by-click checklist of what she must do by hand: get the 5 Google Calendar secret iCal addresses and put them in `.env.local` as GCAL_ICAL_URL_1 to _5 with optional GCAL_NAME_1 to _5, generate `INGEST_SECRET` (give a safe command to generate one), add the env vars in Vercel and redeploy, anything else.
