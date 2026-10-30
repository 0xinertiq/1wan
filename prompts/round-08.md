# Round 8

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 8: TIGHTEN LAYOUTS (preview only; do not ship)

One-line plan: fix each page's layout, restyle Weekly targets and the grid, replace the News briefs with a headline briefing, then run the final review. Calm updates, no screenshots to verify unless I ask. Branch kumo/aesthetic-overhaul, PREVIEW only.

PROTECTED (do not touch): auth, existing RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, calendar fetching code, scheduled-task config, XP, stars, streak and tails logic, user data, env vars, PixelSprite.tsx, spriteDefs.ts, existing migrations. Hiding a card never deletes records.

GLOBAL
- Footer buffer: every page ends with clear bottom padding (about 48px plus safe-area) so no card or table touches the footer or screen edge.
- Calm, seamless styling: where I say "no pink borders and white backgrounds", use the dashboard's existing soft translucent cards, hairline plum-tinted borders and the shared card header. Buttons stay transparent pink.

1) CALENDAR
- The Calendar card is full width, one column.
- Below it, only the Economic calendar (full width).
- Remove My tasks, Month at a glance and Upcoming from this tab. Keep the data and the Today tab's Coming up untouched.
- Keep the Momo clock-tower banner as is. No astro on this tab.

2) SAKURA GARDEN
- Remove the top banner. Use that space for the pixel sakura garden scene as the hero, with NO background box, border or white fill: the tree, pond, lanterns, petals and ground sit directly on the page background and blend in before the tabs start. It still grows with the week's progress. Keep the one-line weekly progress under it (no white card).
- No white filler anywhere on this page. Align the Daily anchors, My habits, Branches and Quests cards in two columns with equal widths and aligned tops and bottoms (stretch cards in a row to equal height; shorten empty areas rather than padding them).
- Fix the tab/card header alignment (titles and right-hand labels on one baseline).

3) DUNGEON
- Your pages card: natural height only, not stretched to the row.
- Research notes moves into the left column, under Your pages.

4) LIFE HUB (Grid & Wins)
- Weekly targets: redesign. The "This week" boxes (Study, Thesis log, X this week) fill the column width evenly in one aligned row with equal gaps, no pink borders or white backgrounds. Use the dashboard's soft cards, plain text, slim progress bars, and compact +/- buttons that are not clipped. Milestone groups and Weekly rhythm use the same soft style, with the checklist rows tidy and aligned. Same data and ids.
- Grid cells: DOUBLE-CLICK (double-tap on touch) a cell to mark it done; it turns a soft pastel green (lighter, lower-saturation than now; same in day and night). Single tap/click still opens the editor. Done-state still calls water() and uses the same stored key as today (${pillar}.${act}). Keep the Done checkbox in the editor too.
- Grid layout: every cell the same size, with a visible gap between cells and between the nine blocks, so boxes never touch. Cell text clamps to the cell (consistent length, ellipsis if long); full text shows in the editor.

5) TRADES
- Merge Midday movers and Scan details into ONE full-width card (Midday movers first, Scan details under it, shared header).
- Macro desk: compact. Tight line spacing, no empty gaps between lines, natural height.
- Order otherwise unchanged from Round 7.

6) NEWS
- Remove the Briefs card (Intel, Pulse) from News; those briefs stay on the Court dashboard.
- Above Headlines, add a "Today's briefing" card built by RULES from the scored headlines (no AI, no tokens): group near-duplicate headlines, pick the 5 highest-scored stories across the chosen market lenses, one line each with its sources and age, plus a small count line ("5 stories from 326 headlines"). Tests for grouping, ranking and the lens filter.
- Keep Headlines below it, one column.

7) SETTINGS
- Kumo's weekly review card: fix the bug showing the "Briefs and scans" header and tabs inside it. It shows only Kumo's review, then the weekly packet.
- Move Account (kingdom mode, progress) into the left column.
- Look card: align the labels and the New/Classic and Day/Night buttons on a shared grid (label left, buttons in a row, equal spacing).

TESTS: no solid pink buttons; footer buffer on every page; double-click marks a grid cell done and persists with the same key; single click still opens the editor; Weekly targets values and ids unchanged; headline briefing ranking; Calendar has no astro; no data deleted; existing tests pass.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks the changes: protected files untouched, each item above done, nothing deleted, no duplicate cards. Fix what it finds.

REPORT (short): one line per section, and anything you could not do.
