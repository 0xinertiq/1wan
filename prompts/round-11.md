# Round 11

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 11: SMALL FIXES (preview only; do not ship)

One-line plan: four small changes, tests, then a quick review. Calm updates, no screenshots to verify unless I ask. Branch kumo/aesthetic-overhaul, PREVIEW only.

PROTECTED (do not touch): auth logic, RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, scheduled-task config, XP, stars, streak and tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts, existing migrations.

1) DUNGEON: rename "Count your wins" to "Gratitude" everywhere (button, sheet title, helper text, Dungeon labels). Make it a saved log: each evening entry stores the date and up to three lines (what went well, what I'm grateful for). Show a "Gratitude log" list in the Dungeon (newest first, tap to read or edit, private like the journal, never shown to friends). Keep it linked to the existing daily-quest and XP behaviour exactly as "Count your wins" works today, with no change to XP logic. Store in journal_entries (kind: gratitude) or the existing journal key, whichever the code already uses, and include it in Export my data.

2) TRADES: remove the word "FENN" beside the Trade log title (and any similar agent tag on that card header).

3) NEWS: when I click a category chip (All, Macro, Markets, Crypto, World, Local, Telegram), the headline list expands automatically to show every headline in that category; remove the need to press "More headlines" (keep a Collapse link).

4) SETTINGS: add a "Sign out" button beside "Replay the tour" in the page header. It calls the existing sign-out function (no changes to auth), then returns to the login screen. Same transparent-pink button style.

TESTS: gratitude entry saves, lists, edits and exports; rename leaves no "Count your wins" text; chip click expands; sign out button calls the existing handler; existing tests pass.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks protected files untouched and each item done. Fix what it finds.

REPORT (short): one line per item.
