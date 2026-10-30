# Round 9

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 9: FIXES, EDITABLE FINANCE, RESEARCH NOTES INPUT (preview only; do not ship)

One-line plan: fix the alignment and spacing issues, make the finance tracker editable, add a research note input, remove repeated news, then run the final review. Calm updates, no screenshots to verify unless I ask. Branch kumo/aesthetic-overhaul, PREVIEW only.

PROTECTED (do not touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, calendar fetching code, scheduled-task config, XP, stars, streak and tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts, existing migrations (migrations may be created, never applied). Delete nothing. The tracker tracks, it never advises. No account numbers.

1) CALENDAR
- The columns are misaligned: make the Calendar card and the Economic calendar card the same width and left/right edges, same page margins, aligned headers. Footer buffer stays.

2) DUNGEON
- Align the Research notes card (same width, edges and header style as Your pages above it).
- Add the missing input: a "New note" form inside the Research notes card (title, text, optional link, optional tag). Notes save to research_notes (kind: note), appear in a list under the form, and can be attached to a journal page as today. Update the empty state text (remove "Save them in News"). Included in Export my data.

3) LIFE HUB
- Money Wins moves into the FIRST tab of the Finance overview card, on top (order: Money Wins, then the overview figures, cashflow, loans). Same ids and formulas.
- Net worth: show "hidden" in the card; hovering it reveals the figure (on touch, tap to reveal and tap again to hide). Remove the Show net worth button.
- Fold finished items away: in Weekly targets, milestone groups that are fully ticked collapse under a "Show done (n)" link, individual ticked milestones sort to the bottom of an open group; in Life admin, paid or auto-paid items fold into "Show paid (n)". Nothing is deleted; ticks and ids unchanged.
- Editable finance tracker (replaces the read-only imported figures; imported figures stay as the starting values):
  a) Every figure (emergency fund, sinking funds, net worth parts, etc.) can be edited inline with undo and a small history.
  b) Loans owed to me: an entry with amount lent, a repayments list (date, amount), and a "Written off" amount. Show lent, repaid, written off and still expected. Net worth counts only the still-expected part. Example to support: a S$9,000 loan, part repaid, the rest marked written off.
  c) Monthly cashflow card, streamlined: Income in (typed once per month) minus Fixed bills (pulled automatically from the Life admin recurring items, never typed twice) minus Sinking funds (the monthly set-asides) minus Logged spending (from Log a spend, totalled by category) = Left over, plus a simple month picker. Keep "left over with the coming changes" as one muted line.
  d) Storage: finance_entries table (user_id, RLS, created as a migration, not applied) behind the existing storage flag, or Preview storage per device. Add it to Export my data. Never store account numbers.

4) TRADES
- Merge card renamed "Scan". Compress the Midday movers and Scan details text (short lines, tight spacing, show first 3 to 5 lines with "Show more"), and remove the empty space beneath so Macro desk is visible without scrolling far.
- Position size calculator: label every field with its meaning and a hint, no bare "1" values. Fields: Account equity (e.g. 1000), Risk per trade % (e.g. 1), Entry price, Stop price, Target price (optional). Add a one-line explainer at the top: "Works out how many coins to buy so a stopped-out trade loses only the % you choose." Keep the Calculate button, result box (position size, amount at risk, risk:reward) and plain validation messages. Calculator only, not advice.

5) NEWS
- Today's briefing must not repeat stories: dedupe by meaning, not exact text. Cluster headlines that share the same subject (normalise case and punctuation, compare key entities and numbers, plus word-overlap similarity), keep only the best-scored headline per cluster, and show its other sources as "also reported by". Add tests with near-duplicates such as two "Bitcoin rebounds" headlines.

TESTS: calendar alignment classes; research note create/list/attach/export; net worth hover and touch reveal; done items fold without data loss; loan maths (lent, repaid, written off, expected); cashflow pulls Life admin bills once; finance edits persist and export; calculator validation and labels; briefing dedupe; existing tests pass.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks protected files untouched, each item above done, no data deleted, no duplicate cards or repeated stories. Fix what it finds.

REPORT (short): one line per section, and anything you could not do.
