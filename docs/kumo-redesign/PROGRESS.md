# Kumo aesthetic overhaul: progress

Branch: `kumo/aesthetic-overhaul`. Design package lives in `docs/` (not `docs/kumo-redesign/`): `docs/design_implementation_kit_v1/`, `docs/moodboards/`, `docs/existing_asset_pack_v1/`, `docs/KUMO_*.md`.

| Slice | Status | Commit | Notes |
|---|---|---|---|
| Preflight | done | 01a4622 baseline | tsc OK, 29/29 tests, build OK. Backup: newest export is 2026-10-16 (old dashboard). Needs a fresh Export my data before deploy. |
| A. Foundation | done, live | fc0d74b | Playfair Display + Nunito, kit tokens, day palette, cards/buttons/chips/inputs/tabs. New is default; Classic switch in Settings. Night keeps the v52 palette for now. |
| B. Primitives + nav | done, live | 40e3127 | Nav bar and rail restyled (still 5 tabs), empty states, 44px touch targets. Docs task (prompts) shipped with this deploy. |
| C. Court home | done, live | 98b4557 | New look only: kingdom banner (asset-pack layers 01-07, Kumo sprite), Today Now/Next/Later from the calendar, Luna's astro weather card (existing feed + Luna's calculation, quoted, no invented guidance), Quick capture (same list as Park a thought). All older windows remain below. |
| C2. Court cleanup | done, live | 17cafae | One Today card (Now/Next/Later, glance row, rest under More), one Luna forecast card (Do/Don't only when the calendar text has them) with Full sky on a new Observatory page (#observatory, not in the nav), Court scene softened and compacted under Kingdom progress (it shows level-ups), banner reframed with fox and Prototype art label, 12-column row with 24px gaps and equal heights, everything else under More on your court, 14px type floor. Classic keeps the v52 layout exactly. |
| C2b. Painted banners | done | (this commit) | Court and Observatory banners now use prototype crops from concept images 33 and 24 (WebP, desktop + phone, 207 KB total). Painted mock UI is covered by real overlays (greeting, room chips, live level, date, Luna's moon line). Petals and cloud drift on top, off under reduced motion. Pixel fox hidden on the Court banner (painted fox there). |
| D. Luna Astro Weather | done, live | e307f85 | Already existed (astro feed + Luna's calculation): restyled only. New look: moonlit banner (pack layers recoloured, code-drawn moon and stars, labelled prototype), 7 day folds in SGT with quoted text, source line, and Luna's calculated events kept apart. Decoration system started (decor/, one file per item). |
| E1. Calendar | done, live | 5999543 | CSS only: segmented view switch, soft day cells, pink today, gold picked day, event pills, rounded rows. |
| E2. Sakura Garden | done, live (shipped before the stop arrived) | ad7c663 | New look: garden scene (pack backdrop + pixel lantern, flowers, mushroom), eight branch trees at stage 0-4 from the same blossom count as the bonsai (read-only). Garden logic untouched. |
| E. Pages (rest) | todo | | Diary, Life Hub, Notifications, Settings, Onboarding |
| F. Kingdom preview | todo | | |
| G. Mobile + a11y | todo | | |
