# Progress (Claude Code updates this after every step)
Done before this file existed: login, briefs, Export my data, crew page, dashboard shell, state load/save, calendar (5 feeds), prices, RSS news, ingest endpoint (dry run passed), theme toggle, Sakura Garden v1, Tonight count your wins, Coming up, diary v1.
Next: step 3 in docs/BUILD-ORDER.md.

## Log
- 2026-10-23 Step 1: five tabs (Court, Calendar, Garden, Diary, Life) as bottom bar on phone, left rail on desktop; Life sub-tab shell; crew detail opens by tapping a character (role, latest output, last updated, next run); Settings in header menu; Ask windows, routing box, sample usage panel and sample sprint bar removed; status line from real events. Sample/placeholder: Calendar tab and the four Life screens, Needs you window.
- 2026-10-23 Step 2: migration 0004 (trades, plans with Samsara thesis fields, gamble, ledger_settings, spending, watering_events; RLS own rows), scripts/import_trackers.py (dry run default, idempotent; offline test: 5 trades, 1 gamble, settings, 4 state keys, 17 watering events), new tables in Export my data (skipped until 0004 runs). Not yet applied: she runs 0004 and the import (manual-steps G).
- 2026-10-27 Step 3: Life > Money: spending quick-add and month by category (spending table, writes and removes a watering event; calm "needs setup" until 0004 runs), r1 shown AUTO when a line exists today, cash flow (money in, fixed costs, logged spend), Coming up read from the one Life admin list, sinking funds, net worth (hidden by default), goals, open items; typed figures saved under user_state key mny. Importer now writes Small Wins to key swins (wins already holds diary wins). Sample/empty until she types figures or runs 0004.

## Blocked
- Step 3: porting the Money Wins artifact's own formulas and figures (key money: done, t, f, nw). Reading data-import/trackers/trackers-pack/money-wins/index.html was refused by the privacy guard. Money uses plain sums meanwhile and leaves the imported money key untouched. To unblock: she allows Claude to read that file's code in a session, then map money into mny.
