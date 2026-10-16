# Status: what is real and what is sample

Updated as each build step lands. "Real" means it reads or saves her actual data or a live source.

## Changelog

### Step 1: theme and idle crew
- Real: Day or night button in the header menu (menu now opens). Saves to this browser (`kumo.theme`); with no saved choice it follows the system setting. Applied before first paint, so no flash.
- Real: Export my data button in the header menu (downloads `/api/export`).
- Real: the crew walks and hops between platforms like v52. After 2 minutes with no tap, key or scroll they walk into the palace (zz shows over it); the next interaction brings them back out one by one. Reduced motion: no wandering, moves are instant.
- Change from v52: v52 sent each agent to rest on a random timer; now rest follows her being away, as the brief asks.
- Sample: quiet queue, usage, showcase and calm buttons still do nothing.

### Step 2: her state loads and saves
- Real: the page reads her `user_state` document on the server. Missing keys fall back to v52 defaults. Day rollover, the morning-brief quest and garden watering run before first paint.
- Real: changes save in the background to `/api/state` (only the keys the dashboard owns, merged by key, with the version). Keys the page does not own (kb, nb, courses, ideas, rules and so on) are never touched. RLS stays on: saves use her session.
- Real: header streak and stars; Today (since yesterday, due soon, streak, habits this week, quote of the day, recap after a rollover, up next and Kumo's pick, rest day); Momo's day with "Ideas for your free time" (45+ minute gaps, 08:00 to 22:00); Coming up (Done today / Paid / Decided, Booked for date, 7-day bills total); Park a thought (park and mark done).
- Real: Habit Quests (top 3, Show all with crew filter, Evening check-in), EXP, levels and level-up banner, stars and streak.
- Real: Sakura Garden drawn like v52 (blooming / thirsty / rotting from habit watering), plant, water, let go, weeds to pull.
- Real: "Tonight, count your wins" table (today, yesterday, this week, posts, streak) and the three text boxes, which save.
- Real: Fox Diary with the weekly recap, 28-day strip, moods, and diary pages that are editable and downloadable (Download my diary, Markdown). Diary text lives only in her private `user_state` row and is in Export my data.
- "You" tab: v52 has no tab with that name. The nearest thing is the status card "You · The Queen"; it is ported (level, EXP, habits this week, save status). A Settings panel holds Export my data and the life admin list (add, remove, booked date).
- Changes from v52: wins are no longer trimmed to 60 days (that deleted diary pages); the "went well" box shows the suggestion as a hint instead of pre-filling it, so only her own words are saved.
- Not ported yet: Luna's sky reading (Sky tab shows saved moods only), focus sprint, Discipline and Spirit bars, Poppy's content desk, drop zone, quotes library editing.

### Step 3: Watchlist Scan and brief feedback
- Real: one kind mapping in `apps/web/src/lib/briefKinds.ts` (database weekday/daily/scan/movers and old pulse/intel/scan/movers both work).
- Real: Watchlist scan window shows the newest `scan` brief: date, title, body, sources line, feedback.
- Real: every brief shows a sources line and Useful / Not useful (plus an optional one-line note), saved to `feedback` under her user id.
- Note: none of the current briefs record their sources, so the line reads "not recorded by this task" until the scheduled tasks send `meta.sources` (see `prompts/INGEST.md`).
- Change from v52: v52's scan read TradingView live from claude.ai; that connector is not available to a website, so the scan now comes from her scheduled task.

### Step 4: Google Calendar, read-only
- Real once connected: up to 5 calendars from `GCAL_ICAL_URL_1` to `_5` (labels `GCAL_NAME_1` to `_5`) in `apps/web/.env.local` and Vercel. Fetched and parsed on the server only, cached 15 minutes; the addresses never reach the browser or the logs.
- Handles recurring events (daily, weekly, monthly incl. "2nd Tuesday", yearly), exceptions and moved occurrences, all-day events and other time zones, shown in Singapore time. Tested on a synthetic calendar.
- Events from all calendars are merged, tagged with label and colour, and de-duplicated; chips in "Momo, your day" filter by calendar. One calendar failing does not hide the others (it shows "not reachable").
- Events feed Up next, Momo's day, free-time gaps, "Booked" detection in Coming up, and the calendar quests (study block, weekly review).
- Until the addresses are added: "Calendar not connected yet", ideas assume a free day, nothing breaks.

### Step 5: live prices
- Real: `/api/prices`, cached 60 seconds on the server. CoinGecko first (no key), Crypto.com Exchange public tickers for anything missing, and if both fail the last good values with a "stale" label.
- Real: symbols come from the coins named in her newest scan brief (up to 12, known coins only, so words like EMA50 or RSI are ignored); BTC, ETH, SOL when there is no scan.
- Shown as a chip on the stage (BTC, ETH, SOL) and as a list in the Watchlist scan window. Read-only, no trading, no advice.

### Step 6: news that does not depend on Bigdata
- Real: 13 free RSS feeds in `apps/web/src/lib/newsFeeds.ts`, each checked live on 16 Oct 2026: CoinDesk, Cointelegraph, Decrypt, The Block, Bitcoin Magazine, Federal Reserve, ECB, SEC, CNBC Markets, CNA Business, BBC Business, CNA Singapore, The Business Times. None were dead.
- Real: `/api/news` caches each feed 15 minutes, keeps the last good copy if a feed fails, returns headline, source, topic, time and link only (newest 12 per source, last 14 days).
- Real: Headlines window with topic tabs (All, Macro, Markets, Crypto, World, Local) and More headlines. Links open the original site.
- Ready, needs one manual step: migration `supabase/migrations/0003_briefs_meta.sql` adds a nullable `meta` column to `briefs`. Until it runs, the sources line still works from a "Sources:" line in the brief body.

### Step 7: ingest endpoint for her scheduled tasks
- Ready: `POST /api/ingest/brief`, protected by `INGEST_SECRET` (Bearer header, compared in constant time; refuses to run if the secret is missing or under 32 characters). Strict validation (kind from the mapping, title, body, optional meta and at; unknown fields refused), 200 KB cap, light rate limit (20 per 10 minutes per address).
- Ready: `?dryRun=1` validates and answers without writing. Tested locally: no secret 401, wrong secret 401, bad kind 400, unknown field 400, valid dry run 200.
- Writes shared briefs (user_id NULL) with the service role key on the server only. Checked: the key and the secret names do not appear in the browser bundle.
- If migration 0003 has not run, `meta.sources` is kept by appending a "Sources:" line to the body.
- Documented in `prompts/INGEST.md`. No scheduled task has been pointed at it yet (build order step 6).
