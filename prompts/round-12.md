# Round 12

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 12: SAKURA BONSAI CENTREPIECE, DUNGEON FIT, BRANCHES LINK, QUESTS, QUOTES (preview only; do not ship)

One-line plan: draw the pixel cherry-blossom bonsai with five growth stages and wilting states, fit the Dungeon on one screen, link Branches to the grid, make quests manageable, add a quote library upload, then run the final review. Calm updates, no screenshots to verify unless I ask. Branch kumo/aesthetic-overhaul, PREVIEW only. Build on Round 10's growth fix (D1); do not undo it.

PROTECTED (do not touch): auth, RLS, OWNED_KEYS and normalize() (new optional keys only, with tests and a shown diff), middleware, /api/ingest and /api/export logic, scheduled-task config, XP, stars, streak, tails and decay/recovery rules (read them, do not change them), user data, env vars, PixelSprite.tsx, spriteDefs.ts, existing migrations (create only, never apply). New art goes in NEW files (for example gardenTree.ts and GardenTree.tsx). The app tracks, never advises.

1) SAKURA BONSAI CENTREPIECE
LOOK (original art, not a copy of any reference): draw by code as SVG rects on a pixel grid in the existing style: plum outline #4a2538, soft pastel palette, one gold accent. A bonsai with a curved S-shaped brown trunk growing from a small wooden tray with a few grey rocks and a bit of moss, branches reaching out in a gentle arc, clusters of pink blossoms (light pink with a deeper pink centre) with a few green leaves, and a few petals drifting. Optional soft pale moon circle behind the canopy at higher stages. No background box, border or white fill: it sits directly on the page background as the centrepiece, with the pond and lanterns around it. Large, crisp (image-rendering: pixelated), centred, within the page margins.
FIVE GROWTH STAGES (driven by this week's real activity from the existing growth inputs: habits, quests, anchor ticks; use the existing weekly progress rule, shown in one muted line under the tree):
 1 Bare: trunk and bare branches, tray, no leaves.
 2 Sprout: a few green buds and leaves.
 3 Leafy: fuller green leaves, first blossom buds.
 4 Blossoming: many pink blossom clusters with leaves.
 5 Full bloom: lush canopy of blossoms, extra drifting petals, soft moon behind.
The stage rises as the share of the week's habits hit rises; add a tiny plain-words hint: "next stage at N more ticks".
WILTING (from the existing missed-day counts; do not change the decay rules, only draw them):
 1 missed day: leaves slightly paler, a few petals on the ground, one drooping twig.
 3 missed days: branches droop, leaves yellow-brown, blossoms thin out, more fallen petals.
 7 missed days: mostly bare drooping branches, a few brown leaves, petals scattered around the tray.
 Recovery: any real activity restores the stage the week's progress earns, with a small happy sparkle. Nothing is ever lost; history and blossom counts stay. One gentle caption line (for example "A little thirsty. Any activity helps."), never guilt.
EXTRAS: gentle sway and a few falling petals, paused with prefers-reduced-motion or a hidden tab; a few gold petals around the tree or on the tray for ladder milestones (the existing golden-petal count, up to a visible cap); palette CSS variables so it works in day and night.
ALIGNMENT: the tree, its caption and the two-column cards below share the page margins; no white filler.

2) DUNGEON FITS ONE SCREEN
At normal desktop widths the Dungeon shows Your pages, Today's page, Mood and tags, Trade reflection, Research notes and Weekly look-back without scrolling the page. Compact the cards (tighter spacing, smaller calendar rows, Today's page fills the remaining height) and let long lists (research notes, gratitude log, version history) scroll INSIDE their own card. On small screens it may scroll normally. Keep the footer buffer.

3) BRANCHES FOLLOW THE 9x9 GRID
DIAGNOSE FIRST and report in 2 lines: does the Garden's Branches card read its pillar names, order and blossom counts from the same chart the editor saves (the gridDefs override and the 2027 key), or from the old imported defs? Then make it so. Branches read the effective chart: editing a pillar name or an action, or ticking a cell in the grid, updates the matching branch name and its blossom count immediately, for the selected year (2026 by default, 2027 when that tab is chosen). If a pillar is renamed, keep history and ticks (ticks are keyed by pillar.act index, not name).

4) HABIT QUESTS
- My habits stays the one place to add, edit, pause or delete my own habits; they appear in Quests and the Wins ladder.
- Make the built-in quests manageable: in Quests add a small "Edit quests" control listing each built-in quest with an on/off toggle. Store toggles in a new optional user_state key with tests and a shown diff. Do not change XP rules or what quests award.
- Caption under Habit Quests: "Add your own in My habits. Built-in quests can be switched off in Edit quests."

5) QUOTE LIBRARY UPLOAD
- Settings gets a "Quotes" card: shows how many quotes are in the library (built-in plus mine), a box to add one quote (optional author), a paste box (one quote per line, "quote | author"), and an upload button accepting .txt or .csv (one quote per line, optional author after a | or in a second column). Show a preview and count before saving; skip blank lines and duplicates; cap each quote at 160 characters and the library at 500.
- A switch: built-in only, mine only, or both (default both). Rotation from Round 10 draws from the chosen set with no immediate repeats.
- Mine are private to my account (new optional user_state key, or a quotes table with user_id and RLS created as a migration, not applied; follow the storage flag). Include in Export my data. A "Remove all my quotes" button with confirmation. Never fetch quotes from the internet.

TESTS: each of the five stages renders from sample inputs; wilting for 1, 3 and 7 missed days and recovery on activity; reduced-motion disables animation; decay, XP, stars and streak untouched (existing tests pass); Dungeon fits at 1280x720 and 1440x900 without page scroll; Branches update from grid renames, edits, ticks, resets and the 2027 tab with no ticks lost; quest toggles persist and do not change XP; quote paste and upload parse (blank lines, duplicates, long lines, author formats), source switch works, export includes quotes; no new network requests.

FINAL REVIEW STEP: a fresh subagent that has not seen the build checks protected files untouched, art is original and in new files, stages and wilting match the rules, Branches read exactly one source of truth, no quote or quest data lost, nothing deleted. Fix what it finds.

REPORT (short): the Branches diagnosis first, then the stages and wilting states built with the exact input thresholds for each stage, then one line each for items 2, 4 and 5, and anything you could not do.
