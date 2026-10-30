# Round 10

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 10: FIXES AND ADDITIONS (preview only; do not ship)

One-line plan: fix the listed bugs, diagnose four "why" items first, add the 2027 grid, leverage and the Today to-do, then run the final review. Calm updates, no screenshots to verify unless I ask. Branch kumo/aesthetic-overhaul, PREVIEW only.

PROTECTED (do not touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, calendar fetching code, scheduled-task config (read it, do not change it; ask me first), XP, stars, streak and tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts, existing migrations (create only, never apply). The app tracks, never advises.

DIAGNOSE FIRST (report the cause in 2 to 3 lines each BEFORE fixing; fix only if the fix is inside the allowed files, otherwise ask me)
D1. Sakura garden never sprouts: find what drives the tree's growth stage, show the rule and the current inputs, and fix it so real activity this week visibly grows it (sprout, then leaves, then blossoms). Keep decay and recovery rules as they are.
D2. Catalysts (Fenn, Trades) have not updated for ages: trace where they are written and read, and say whether the scan task is not writing them, the ingest rejects them, or the page reads a stale key. Fix the reading side; for the writing side, tell me exactly what to change and ask before touching any scheduled-task prompt or config.
D3. Kumo's weekly review still judges the old 0.5 ATR stop: check crew/kumo.md and the review prompt in prompts/ for the stop rule and the 1 ATR change. Update the spec/prompt FILES to the current 1 ATR rule, and tell me whether the scheduled task needs a re-run or a prompt re-paste (ask first; do not edit the task).
D4. News briefing ranking: explain exactly how stories are ranked and clustered. Add a short "why this story" line on each briefing item (score, number of sources).

1) CALENDAR: align the Back / month label / Next row. Same pattern as Your pages in Dungeon: arrows left and right, month label centred, one row, equal heights.

3) DUNGEON
- Calendar glitch: today's cell shows two numbers stacked (28 over 30). Each cell shows one number; the pixel heart marker sits behind the number, never replaces or duplicates it. Add a test for the last week of a month.
- Trade reflection: remove the "Not a trade" option and its helper text; if there are no trades, hide the selector.

5) LIFE HUB
- 2027 grid: add a tab beside the current chart: Chart 2026 | Chart 2027 | Weekly targets. The 2027 chart is a separate 9x9 Harada chart that starts blank with the guided wizard, with an option "Copy from 2026" and its own ticks, version history, undo and reset. Store in a new optional user_state key (for example gridDefs2027 and grid2027done) with tests and a shown diff. The 2026 chart is unchanged.
- Loans (finance tracker): delete the USD 9,000 loan entry (keep it in the edit history so undo works) and amend loans in SGD to S$40,000 total. If the S$40,000 is meant as one loan or the sum of several, ask me once with a one-line question, otherwise store it as one SGD entry.

6) TRADES
- Remove the "Read the alert" button from Midday movers.
- Keep the style map expanded by default (no collapse needed to see it).
- Position size calculator: add Leverage (x). Output: position size (coins), notional, margin required (notional / leverage), amount at risk, risk:reward, and an estimated liquidation price with a warning if it would be hit before the stop. Label clearly "approximate; fees and maintenance margin not included". Keep validation messages. Calculator only, never advice.

7) NEWS / BRIEFING: do not repeat stories. Dedupe by meaning across ALL briefing items (not just within a section): shared entities and numbers, similar wording, same asset and direction (for example two "Bitcoin rebounds" headlines are one story). Keep the best-scored one and list the others as "also reported by". Tests with near-duplicates and a hard check that no two items share a cluster.

8) COURT
- Briefs on the Court

<!-- second message, the rest of Round 10 -->

8) COURT
- Briefs on the Court tab are expanded by default.
- Today tab: add an editable to-do list under Park a thought. Add, edit, tick, delete. Unfinished items carry over to the next day automatically (shown with "from yesterday"); done items clear after the day (kept in history, not deleted). Store in the tasks table or Preview storage per the existing flag; include in Export my data.
- Luna tab: reduce the size of the "Mercury retrograde..." line (smaller text, one line where possible).
- Quote bubbles: rotate periodically from the quotes library (new quote each page load and every few minutes while open, no repeat until the library is used up). The bubble comes out of KUMO with its tail pointing at Kumo, not fixed at the top right. Tests for no immediate repeats.

TESTS: calendar nav alignment; calendar last-week cell; reflection selector; 2027 grid isolation from 2026; loan edit with undo; leverage maths and liquidation warning; briefing cluster uniqueness; to-do carry-over across a day boundary; quote rotation; existing tests pass.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks protected files untouched, each item done, no data deleted, no repeated stories. Fix what it finds.

REPORT (short): the four diagnosis answers first (cause and fix or what you need from me), then one line per other item.




8) COURT
- Briefs on the Court tab are expanded by default.
- Today tab: add an editable to-do list under Park a thought. Add, edit, tick, delete. Unfinished items carry over to the next day automatically (shown with "from yesterday"); done items clear after the day (kept in history, not deleted). Store in the tasks table or Preview storage per the existing flag; include in Export my data.
- Luna tab: reduce the size of the "Mercury retrograde..." line (smaller text, one line where possible).
- Quote bubbles: rotate periodically from the quotes library (new quote each page load and every few minutes while open, no repeat until the library is used up). The bubble comes out of KUMO with its tail pointing at Kumo, not fixed at the top right. Tests for no immediate repeats.

TESTS: calendar nav alignment; calendar last-week cell; reflection selector; 2027 grid isolation from 2026; loan edit with undo; leverage maths and liquidation warning; briefing cluster uniqueness; to-do carry-over across a day boundary; quote rotation; existing tests pass.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks protected files untouched, each item done, no data deleted, no repeated stories. Fix what it finds.

REPORT (short): the four diagnosis answers first (cause and fix or what you need from me), then one line per other item.
