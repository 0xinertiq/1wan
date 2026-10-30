# Round 13

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 13 (preview only, branch kumo/aesthetic-overhaul). Do NOT ship to live. Calm, short updates. No screenshots to verify. No long loops. No repeated information in the UI. No blue links. No solid pink buttons (transparent pink only).

PROTECTED (never touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic (only add new tables to export), calendar fetching code, scheduled-task config, XP/stars/streak/tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts (new art goes in new files), existing migrations (create only, never apply). Delete nothing: hiding an item never deletes records. The app tracks, never advises. Display name only in apps/web/src/lib/brand.ts. data-import/ is git-ignored: never print or commit it.

1. GARDEN SCENE CLEANUP
Remove the bridge, pond and LEFT lantern from the Garden scene (bottom-left of the sakura bonsai scene). Keep the right lantern, the grass tufts, the bonsai, the sun and the planter. Do not touch bonsai growth, wilting or petal logic.

2. EDIT GARDEN PANEL
Add one "Edit garden" button on the Garden page that opens a single panel with 4 tabs: Habits, Quests, Anchors, Wins ladder.
- Habits: rename, add, hide/unhide, reorder. My habits stays the only place to add habits.
- Quests: rename custom quests, hide/unhide, reorder. Keep the existing built-in quest toggles from Edit quests (move them into this tab, remove the separate Edit quests button only if nothing is lost).
- Anchors: rename, add, hide/unhide, reorder, set time of day and frequency (daily, weekdays, custom days).
- Wins ladder: rename milestones, change milestone targets and labels, add, hide/unhide, reorder. Changing targets must NOT change XP, stars, streak or tails logic; ladder only reads those values.
- Hiding folds an item away; records and history are kept and still export. Finished items fold away.
- Storage: new optional keys only. Show me the diff of any OWNED_KEYS / normalize() change before applying, with tests.
- Panel style: pastel, plum outline #4a2538, one gold accent, Playfair headings, Nunito body, Silkscreen tiny labels, transparent pink buttons.

3. DUNGEON ROOM BANNER (second room after Momo's Calendar clock tower)
The Dungeon page border/banner size does not match the other tabs. Create a banner of the SAME dimensions as Momo's Calendar banner, in the same pixel style (code-drawn SVG rects, 32x32 sprites, plum outline #4a2538, one gold accent): a cosy stone study interior with candles, bookshelf, desk and journal, and Sisi at her journal. New art goes in NEW files (do not edit PixelSprite.tsx or spriteDefs.ts). Keep the Dungeon fitting one screen after adding the banner. Only the Dungeon gets a new banner; other rooms wait for my approval.

4. BRANCH GRADIENT BACKGROUNDS (Garden, Branches card)
Give each branch a progress background so I can see at a glance what is progressing:
- Not started: plain soft grey.
- In progress (any activity this week): pastel green fill that grows left to right; gradient strength follows the share of that branch's cells done in the effective 9x9 chart.
- Completed: full pastel green with a soft gold edge.
Branches keep reading the effective 9x9 chart. No new data, no advice text, no blue links.

TESTS: add or update unit tests for the Edit garden storage (new optional keys, hide not delete, export includes them) and the branch progress state function (not started / in progress / completed). Run the full existing test suite, typecheck and lint; all must pass.

FINAL REVIEW STEP: spawn a fresh subagent that has not seen the build. Have it check (a) nothing in the PROTECTED list changed, (b) hidden items are kept, not deleted, (c) Dungeon banner dimensions equal the Calendar banner and the page still fits one screen, (d) no blue links or solid pink buttons, (e) tests, typecheck and lint pass. Fix anything it finds.

REPORT (short): what changed per item (1 to 4), files added and changed, the OWNED_KEYS/normalize diff, test results, anything you could not do or want me to decide. Also confirm the preview URL deployed from branch kumo/aesthetic-overhaul.
