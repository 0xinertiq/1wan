# Round 13 decisions + Round 14

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUNDS 13 DECISIONS + ROUND 14 (preview only, branch kumo/aesthetic-overhaul). Do NOT ship to live. Calm, short updates. No screenshots to verify. No long loops. No repeated information in the UI. No blue links. No solid pink buttons (transparent pink only).

PROTECTED (never touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic (only add new tables to export), calendar fetching code, scheduled-task config, XP/stars/streak/tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts (new art goes in NEW files), existing migrations (create only, never apply). Delete nothing. The app tracks, never advises. Display name only in apps/web/src/lib/brand.ts. data-import/ is git-ignored: never print or commit it.

PART A: ROUND 13 DECISIONS
1. Banner height: KEEP your cap. On desktop screens under about 800px tall, the Calendar and Dungeon banners shrink together so they still match. Taller screens unchanged.
2. Daily anchors quest: count only anchors that are scheduled AND visible that day, so hiding an anchor or giving it fewer days makes the target 7/7 (or fewer) on those days. Hidden anchors keep their history. Do not touch XP, stars, streak or tails logic; only the quest's target count.
3. Branches: faint pastel tint for branches with cells done but no activity this week. Grey = never started, faint tint = progress but quiet this week, full pastel green fill = active this week, soft gold edge = complete.
4. Storage keys: I approve all five new optional keys (lenses, gridDefs2027, questsOff, quotes, gedit).

PART B: ROUND 14
5. THREE NEW ROOM BANNERS (Life Hub, Trades, News). Same dimensions and same banner component as the Calendar and Dungeon banners (including the short-screen cap from item 1). Pixel style: code-drawn SVG rects, 32x32 sprites, plum outline #4a2538, one gold accent, pastel palette. Each is a cosy interior with the agent ALREADY tied to that tab in the app (read it from the code; do not change which agent owns which tab):
 - Life Hub: homey planner room (desk, planner, small plant, window).
 - Trades: desk with chart screens and a small gold-accent ticker.
 - News: newsroom with a pinboard of clippings and a wire printer.
New art goes in NEW files only. Other rooms are unchanged.
6. REMOVE BANNERS IN SETTINGS AND KINGDOM MODE. Stop rendering the banner on the Settings page and in Kingdom mode. Page content moves up. Keep the banner code and files; do not delete them. Do not remove the page title or any other content.

TESTS: update or add tests for items 2, 3, 5 and 6 (each of the three new banners matches the Calendar banner dimensions; Settings and Kingdom mode render no banner). Run the full suite and typecheck; all must pass.

FINAL REVIEW STEP: spawn a fresh subagent that has not seen the build. Check (a) nothing in the PROTECTED list changed, (b) new banners match the Calendar banner dimensions and use the correct existing agent per tab, (c) Settings and Kingdom mode show no banner and lost no other content, (d) no blue links or solid pink buttons, (e) tests and typecheck pass. Fix anything it finds.

PLAIN-WORDS QUESTIONS (answer in the REPORT, do NOT apply or change anything):
- Migration 0006: in plain words, what does it create or change, is it additive only, do preview and live use the SAME Supabase database, and is it safe to apply before I ship to live? Do NOT apply it.
- Kumo weekly-review prompt: which file holds the new prompt, what exactly changed compared with the old one (for example the 0.5 ATR stop), and where do I paste it?

REPORT (short): per item what changed, files added and changed, which agent was used for each new banner, test results, the two plain-words answers above, and anything you want me to decide. Confirm the preview URL deployed from branch kumo/aesthetic-overhaul.
