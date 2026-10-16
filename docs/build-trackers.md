# Build brief: life trackers into 1(WAN), wired to the Sakura Garden

Read CLAUDE.md first and obey it. Work in order, commit and push after each step (`npm run build` first), no screenshots, no questions between steps unless something is irreversible. Collect everything she must do by hand into ONE click-by-click checklist at the end (`docs/manual-steps.md`).

## Source files (private, git-ignored, never commit, never print contents)
`data-import/trackers/` holds her four existing claude.ai artifacts, as page source plus saved data:
- `money-wins/index.html` (Money Wins Ladder; state is the JSON in `<script id="state">`)
- `small-wins/index.html` (Small Wins Ladder; daily log and ticks in `<script id="state">`)
- `swing-trade-ledger/` (page + `db/` JSON for trades, gamble, settings, wallets; plans is empty)
- `64-actionables/` (page + `db/data/users/me/mandala.json`, the ticks)
The artifact JavaScript is the source of truth for logic and formulas (position sizing, expectancy, freeze rate, fund status, net worth, cash-flow, weekly sleep target). Port the logic exactly; restyle with the 1(WAN) theme and pixel crew. Keep every item id (d1..d8, a3.., b.., m1.., o1.., r1, r2, c1..c9, grid ids like 1.1 to 8.8) so her history maps over.

## Principle: no fake ticks
Every tick is either AUTO (derived from a real record) or SELF-REPORT (labelled as such). Only AUTO and confirmed self-reports feed levels, streaks and the garden. Show the source label on each quest.

## Duplicates to merge (one source of truth each)
1. Dashboard quest "Keep your daily anchors" = the 8 Small Wins daily anchors (d1..d8). Replace it with the 8 anchors themselves; the quest shows n/8 for today.
2. Dashboard quests "Log today's spending, habit level" and "Weekly money review" = Money Wins routines r1 and r2. One item each. r1 is AUTO when a spending line exists for today; r2 AUTO when the Sunday reset is ticked and the money figures were updated that day.
3. Dashboard quests "Run the pre-entry checklist" and "Write your weekly bias" = ledger "Before you enter" checklist (c1..c9) and a plan with a thesis. Checklist quest AUTO when a trade or plan was saved today with checklist 9/9; weekly bias AUTO when a plan with a thesis was written this week.
4. Small Wins a3 "three-line trading rules" = ledger "My three rules" = grid 1.2 (risk rule). One record; ticks all three when the three rule fields are filled.
5. Small Wins b3 (no late-night trades, 14 days) = ledger check c6 = daily d1. Derive b3 from trade timestamps (add an `at` timestamp to trades); derive streaks for b4 and b6 from d5 and d6 logs instead of separate manual ticks.
6. Money Wins "Coming up" (bills, renewals, money in) = dashboard "Coming up" (nails, bills). One list, fed by the money page, merged with the 5 Google calendars.
7. The old dashboard list "Build tomorrow in Claude Code" is superseded by grid pillars 2 and 3; remove it.
8. Grid items already true: calendar connected, going live for her own use. Leave them for her to tick; do not auto-tick project items.

## Data model (migration 0004, additive, RLS own rows on every table)
- `trades`, `plans`, `gamble` tables (user_id, id text, fields as in the ledger, `at` timestamptz), plus `ledger_settings` (account, risk %, rules[3], wallets).
- `user_state.data` keys `wins` (done map + daily log by date), `money` (state blob: done, t, f, nw), `grid` (done map by cell id).
- `watering_events` (user_id, at, source, ref, weight): written whenever a quest is completed, a grid cell ticked, a trade or plan saved, a spending line logged. The garden reads only this table plus `grid`.
- Spending log (Coco, manual entry or CSV, no account numbers): `spending` (user_id, at, amount, category, note). Minimal quick-add.
- Import script `scripts/import_trackers.py` (same style as import_export.py, dry run first, idempotent) reading `data-import/trackers/`. Add all new tables to "Export my data".

## Screens
Add a "Life" area with tabs: Daily (anchors + routines + today's quests), Money (ladder, cash flow, coming up, funds, net worth, goals), Trade (ledger: sizer, plans, log, review, gamble log), Grid (64 mandala), Wins (Small Wins phases). Mobile first. Gamble results never count in trading stats (keep the separation).

## Sakura Garden wiring
- Trunk water level and health: daily anchors and routines. Thirsty when untouched 2 days, rotting at 5, as now.
- Eight branches = the eight grid pillars. Each ticked actionable opens one permanent blossom on its pillar's branch (64 buds in total).
- Golden petals and XP for ladder milestones (Small Wins, Money Wins) and for disciplined trades (checklist 9/9, zero freeze, stop kept).
- The tree redraws immediately when a tick happens anywhere; "Tonight, count your wins" counts the same events.
- Every completion writes a watering event; undoing a tick removes it.

## Privacy
All of this is private to her: finances, trades, health habits, astrology timing. Never in shared briefs, never visible to other users, never in logs or commit messages. Other users start with empty templates. No personal content goes into git.

## Finish
Print: what works on her real data, what is sample only, what was skipped and why, plus the manual checklist (place the zip contents into data-import/trackers, run the import dry run, then the real import, redeploy).
