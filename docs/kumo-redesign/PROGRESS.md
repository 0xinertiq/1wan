# Kumo aesthetic overhaul: progress

Branch: `kumo/aesthetic-overhaul`. Design package lives in `docs/` (not `docs/kumo-redesign/`): `docs/design_implementation_kit_v1/`, `docs/moodboards/`, `docs/existing_asset_pack_v1/`, `docs/KUMO_*.md`.

| Slice | Status | Commit | Notes |
|---|---|---|---|
| Preflight | done | 01a4622 baseline | tsc OK, 29/29 tests, build OK. Backup: newest export is 2026-10-16 (old dashboard). Needs a fresh Export my data before deploy. |
| A. Foundation | done, live | fc0d74b | Playfair Display + Nunito, kit tokens, day palette, cards/buttons/chips/inputs/tabs. New is default; Classic switch in Settings. Night keeps the v52 palette for now. |
| B. Primitives + nav | done, live | 40e3127 | Nav bar and rail restyled (still 5 tabs), empty states, 44px touch targets. Docs task (prompts) shipped with this deploy. |
| C. Court home | done, live | 98b4557 | New look only: kingdom banner (asset-pack layers 01-07, Kumo sprite), Today Now/Next/Later from the calendar, Luna's astro weather card (existing feed + Luna's calculation, quoted, no invented guidance), Quick capture (same list as Park a thought). All older windows remain below. |
| C2. Court cleanup | done, live | 17cafae | One Today card (Now/Next/Later, glance row, rest under More), one Luna forecast card (Do/Don't only when the calendar text has them) with Full sky on a new Observatory page (#observatory, not in the nav), Court scene softened and compacted under Kingdom progress (it shows level-ups), banner reframed with fox and Prototype art label, 12-column row with 24px gaps and equal heights, everything else under More on your court, 14px type floor. Classic keeps the v52 layout exactly. |
| C2b. Painted banners | done, live | 079dc78 | Court and Observatory banners now use prototype crops from concept images 33 and 24 (WebP, desktop + phone, 207 KB total). Painted mock UI is covered by real overlays (greeting, room chips, live level, date, Luna's moon line). Petals and cloud drift on top, off under reduced motion. Pixel fox hidden on the Court banner (painted fox there). |
| C2c. Living Kingdom card | done, live (to be replaced by the pixel Living World in R2, per COURT_SPEC.md) | d268b36 | New look: Cloud Court replaced by the Living Kingdom card (concept 26 Starter/Growing crops). Places link to Calendar, Garden, Observatory, Diary, Life; crew at work as sprites at their places (same duty rules); BTC and SOL in the bubble; level-up banner moved with it. Stage from level, read-only. Night after 19:00 SGT. Classic keeps the Cloud Court. Kingdom Mode page is slice F. |
| R1. Briefs and scans on the Court | done | (this commit) | COURT_SPEC.md is now the single source for the Court. Row 1: Today + Needs you now (left) and Briefs and scans (right: Intel, Scan, Movers, Kumo review cards with first lines, Open, sources and the same feedback). Row 2: Luna, Kingdom progress, Quick capture. Luna headline shown once (moon and sign). |
| R2. Living World (pixel) | next, preview only | | Code-drawn world replaces the painted banner and painted Kingdom card; prices strip; crew roster row. Goes to a Vercel preview link, ships only on "ship it". |
| D. Luna Astro Weather | done, live | e307f85 | Already existed (astro feed + Luna's calculation): restyled only. New look: moonlit banner (pack layers recoloured, code-drawn moon and stars, labelled prototype), 7 day folds in SGT with quoted text, source line, and Luna's calculated events kept apart. Decoration system started (decor/, one file per item). |
| E1. Calendar | done, live | 5999543 | CSS only: segmented view switch, soft day cells, pink today, gold picked day, event pills, rounded rows. |
| E2. Sakura Garden | done, live (shipped before the stop arrived) | ad7c663 | New look: garden scene (pack backdrop + pixel lantern, flowers, mushroom), eight branch trees at stage 0-4 from the same blossom count as the bonsai (read-only). Garden logic untouched. |
| E. Pages (rest) | todo | | Diary, Life Hub, Notifications, Settings, Onboarding |
| F. Kingdom preview | todo | | |
| G. Mobile + a11y | todo | | |

## NEEDS OWNER APPROVAL
- Kingdom stage thresholds (placeholders from UNLOCKS_AND_PROGRESS.md): Starter level 1, Growing from level 2, Expanding 5, Thriving 7, Your Own 10. Cosmetic only, read-only from her level. Change in `apps/web/src/components/kumo/kingdom.ts` (STAGES).
- Art folder path: DECISIONS.md section 5 says `kumo-art-source\original_concept_references`; the real path has one more level, `kumo-art-source\Kumo_Complete_Visual_Reference_V2\original_concept_references`.

## Classic widgets on the New-look Court (reachability check, R1)
Weather line, Today (all of it, under its More), Needs you now, Kingdom progress (status), Luna (forecast on Court, full sky on the Observatory page), Briefs (cards; the old brief tabs also under More on your court), Watchlist scan with prices (cards; full window under More), Technicals, This week, Week ahead, Economic calendar, News (all under More on your court), Status line (under the banner), Cloud Court (replaced by the Living Kingdom card; the pixel world in R2). Nothing unreachable.
