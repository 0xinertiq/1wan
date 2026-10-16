# Build order (the one file to start from)

Start every session with: read CLAUDE.md, docs/BUILD-ORDER.md and docs/progress.md, then continue from the first unfinished step. Do not re-read the other briefs in full: open only the section for the current step (docs/build-trackers.md, docs/build-dashboard-v2.md).

## Rules for saving credits and keeping things safe
- One step at a time: build, `npm run build`, commit, push, tick it in docs/progress.md with one line (date, step, what works, what is sample), then go straight to the next step. Do not ask between steps unless something is irreversible.
- Do not read data-import files in full; search with grep or load only the keys you need. Never print their contents.
- Never run broad process-kill commands (no taskkill by image name, no killall). Stop only the dev server you started.
- No screenshots, no long retry loops. If something fails twice, note it in docs/progress.md under "Blocked" and move on.
- Stop after the last step and print: what works, what is sample only, what is blocked, and one click-by-click checklist for the user (docs/manual-steps.md). She is a beginner.
- Her data is private: finances, trades, habits, birth details. Nothing personal in git, logs or commit messages.

## Steps in order
1. Tabs and navigation: bottom bar (Court, Calendar, Garden, Diary, Life), Life sub-tabs shell, remove Ask windows and routing box, one real-events status line. (v2 section 1)
2. Data layer for trackers: migration 0004 (trades, plans, gamble, ledger settings, spending, watering_events), import script with dry run, add to "Export my data". (trackers: Data model)
3. Life > Money. 4. Life > Trade. 5. Life > Grid & Wins. 6. Life > Samsara. (trackers: Screens, with the merges in "Duplicates to merge")
7. Garden: new quest list from the merged items, Sakura wiring, decay rules, remove typed weeds and habits, archive. (v2 section 4, trackers: Sakura Garden wiring)
8. Diary tab and the guided "count your wins" sheet. (v2 section 5)
9. Court home: needs-you-now, today card with weather, brief cards, watchlist, this-week strip. (v2 section 2)
10. Calendar tab: agenda, week, month, layers. (v2 section 3)
11. Luna's astrological weather and the sky on the Court. (v2 section 6)
12. Final wrap-up: docs/status.md, manual checklist.

If she has already done a step, docs/progress.md says so. Never redo finished steps.
