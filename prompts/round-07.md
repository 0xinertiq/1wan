# Round 7

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 7: LAYOUT CLEANUP, ROOMS PILOT, ALERT POP-UPS (preview only; do not ship)

One-line plan: fix layouts tab by tab, add the pop-up alerts and one pilot room, then run the final review. Calm updates, no screenshots to verify unless I ask. Work on branch kumo/aesthetic-overhaul and deploy to the PREVIEW only.

PROTECTED (do not touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, calendar fetching code, scheduled-task config, XP, stars, streak and tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts (new art goes in new files), existing migrations. Delete no user data: hiding a card never deletes its records. Display name only in apps/web/src/lib/brand.ts.

GLOBAL
G1. Buttons: no solid pink fills anywhere (day and night). Primary buttons become a transparent pink style: soft translucent pink fill, 1.5px pink border, plum text. Hover slightly deeper. One shared button class, so it changes in one place.
G2. Banners: the pixel art is cropped and sits outside the page margin. Give every banner a fixed aspect ratio inside the page margins with the whole scene visible (image-rendering: pixelated, no cropping). Allow a little more height if needed.
G3. Pilot room: build the Calendar banner as a wider "room": the interior of a clock tower with Momo inside. It scrolls or drags horizontally (pointer drag and touch, with a hint arrow), and is a little taller than the other banners. New art goes in new files (code-drawn rects, 32x32 style, plum #4a2538 outline, one gold accent). Pilot this one only; the other rooms keep the fixed banner from G2 until I approve the pilot.
G4. Remove the "More" tab if it opens nothing. If it opens something, keep it and tell me what.
G5. Tab layouts: every page uses an aligned grid, so card edges, widths and heights line up per row.

1) CALENDAR
- Remove the "Economic calendar" link bubble at the top right.
- Left column: Calendar, then Upcoming. Right column: Economic calendar, then My tasks, then Month at a glance. Align widths and row heights so the two columns finish evenly.
- Remove the Momo, your day card from this tab. Merge it into the Today tab on the Court dashboard, and Momo there shows ONLY "Ideas for your free time" (nothing else from that card).
- No astro, moon or astrology item, layer chip or note anywhere on the Calendar tab (keep the isAstro filter and its test).

2) SAKURA GARDEN
- Bug: two huge mascots render in the "gentle nudge" area. Replace with a small mascot beside the nudge text (normal sprite size).
- Hero: the pixel sakura tree and garden scene is the main visual (reuse the existing garden scene art). It grows through the week from real activity (more blossoms and petals as the week fills). Under it, one line: this week's progress.
- Below, two columns. Left: Daily anchors, My habits. Right: Branches, Quests, Wins ladder. Each is its own card, no tab strip.
- "My habits" is the single place to add or edit habits. Anything added appears automatically in Quests and as an item in the Wins ladder. One source of truth, no double entry. Existing ids and ticks are unchanged.

3) DUNGEON
- Weekly look-back moves into the right column.
- Fix the Your pages month heading alignment (arrows and title centred over the grid).
- The calendar's selected/today marker becomes a pixel heart in transparent pink (outline and light fill), not a solid pink block.
- Today's page becomes a larger card: its height matches the other cards in the row after the move, with the writing area filling it. Keep autosave, Count your wins, and privacy text.

4) LIFE HUB
- Remove the Goals card (progress already lives in Grid & Wins) and the small "Grid & Wins" link bubble at the top right.
- Rename "Pets and self-care" to "Routine" everywhere it appears (Life Hub, Settings > Rooms).
- Merge Life admin and the Finance overview into ONE card, full width, same width as Grid & Wins.
- Fix the duplicated Chart rows in the Grid & Wins header so Chart | Weekly targets is one aligned control and the chart view switch is separate.

5) TRADES (order, top to bottom)
- Remove the top-right "Trade log" bubble.
- Remove the Watchlist card (prices are already in Technicals rows and on the Court). Keep the data feed intact.
- Row: Midday movers | Scan details (two columns).
- Macro desk.
- Technicals, one full-width column. Remove the Chart button (I use TradingView directly). Keep the plain-words state and EMA lines.
- Trade log.
- Position size calculator: add a visible Calculate button and a result box (size, risk amount, R). If the stop is on the wrong side or negative, show a plain message like "Enter a stop below your entry for a long". Still a calculator, not advice.
- Performance stats.
- Long-term watchlist, last.
- Hide the "Ledger review, plans, rules and gamble log" card. Do not delete its records or the late-night flag logic.
- Add a small label under the Watchlist-style range columns anywhere they remain: "30-day low to high".

6) NEWS (one column only)
- Headlines first. Then one Briefs card with two tabs: Intel | Pulse. Remove the Watchlist scan and Midday movers tabs from News (they live in Trades).
- Remove the Saved and research link, the top-right bubble and any strip for it.
- Kumo's weekly review and the weekly packet merge into ONE card in Settings (keep the READ_SECRET endpoint, review spec and sensitive-section toggles untouched). Remove them from News.

7) ALERTS (replaces the Notifications tab)
- Remove the Notifications card in Settings (keep stored preferences; delete nothing).
- New rule-based alerts: a pixel "!" appears on the relevant agent on the Court AND on that agent in their room banner. Clicking opens a small speech bubble saying what needs doing, with a link to the place and Dismiss/Later. No push notifications, no AI.
- Sources and agents: new briefs (Pip), big releases within 48h (Olli), routines and tasks due (Coco), habit reminders (Momo), Needs you now (Kumo). Kumo's weekly review: on Sunday Kumo shows the "!" and the bubble opens the review card in Settings.
- Keep "one calm morning summary" as a single Momo bubble each morning.

8) SETTINGS
- Fix alignment of Export my data (and remove its solid pink block), Account (kingdom mode and progress), and Enter the kingdom.
- Market lens: allow multiple selections and more news categories (e.g. Crypto, Macro, Markets, World, Local, Tech, plus Any topic and Off). Store as a new optional user_state key with tests and a shown diff; headlines and briefs follow the chosen lenses.
- Rename "The fox" to "9-Tails".

TESTS: calendar astro filter; habit added in My habits appears in Quests and Wins ladder with no duplicates; Ladder and tick ids unchanged; alert rules and Sunday review alert; market lens multi-select persists; calculator validation; no data deleted when cards are hidden; existing tests still pass.

FINAL REVIEW STEP: before reporting, run a separate review pass (a fresh subagent that has not seen the build) over the changes: protected files untouched, no solid pink buttons remain, every moved feature has exactly one home, no astro on Calendar, nothing deleted. Fix what it finds.

REPORT (short): one line per section; where each moved feature now lives; what the "More" tab was; what is left for my approval (the other rooms).
