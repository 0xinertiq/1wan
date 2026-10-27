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
| R1. Briefs and scans on the Court | done, live | d3cf4b6 | COURT_SPEC.md is now the single source for the Court. Row 1: Today + Needs you now (left) and Briefs and scans (right: Intel, Scan, Movers, Kumo review cards with first lines, Open, sources and the same feedback). Row 2: Luna, Kingdom progress, Quick capture. Luna headline shown once (moon and sign). |
| Fonts (Part 6 as amended) | done, on preview | 82c559b | Nunito for inputs and selects (Quicksand override replaced, New look only), tabular numbers, Inter only for diary writing and entries. |
| R2. Living World (pixel) | on PREVIEW, waiting for "ship it" | b02784e, then R2b | Code-drawn world (sky per SGT time, mountains, cloud bank, distant islets, island with castle, clock tower showing real SGT time, observatory, sakura tree, two cottages, pond, stream, bridge, waterfall, walls, bushes, flowers, lanterns, villagers, cat, balloon, birds, petals, fireflies, rain), growth by level, crew walk to their place when their desk ran today. Prices strip, row 1 / row 2 / quiet row 3 (crew roster, Kumo's pick, quote), phone order and Quick capture button. Painted Court crops removed. |
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

## Not done yet in R2 (honest list)
- Phone bottom bar of 5 (Home, Calendar, Hub, Diary, More): left for the mobile pass; the current five tabs stay.
- Rare delighters (rainbow after rain, lantern festival on a streak milestone), seasonal touches, fog: not built.
- Crew walk in straight lines (no path graph yet); Kumo stays at the gate.
- Night mode colour pass with contrast check: not done (night keeps the v52 colours).
- Screenshots: taken of the world on its own (desktop 620x240 at 2x, phone strip) in headless Chrome; the full Court page could not be screenshot because the preview needs your Vercel and app login.

## R2b (owner's preview feedback, on preview)
Crew sprites 8.5% of the world height (15% on the phone strip), off-duty crew stay inside the castle; glass place labels (60%, blur, solid on hover/focus, 44px hit area); quote of the day as Kumo's speech bubble (tap to expand), below him over the clouds; prices strip is one line that scrolls sideways; desktop under the strip: Briefs and scans 2/3 left, rail 1/3 right (Today, Needs you now, Luna, Quick capture), old row 2 and the progress card removed; crew roster as one line; level, EXP bar, habits this week and save state in the header after the clock (New look only; Classic keeps its status card); Luna card shows the transit lines small, then DOs and DON'Ts exactly as the astro calendar writes them ("✅ DO:" / "🚫 DON'T:" lines; UTC times shown in SGT), a small "astro calendar" tag and Read more; the "Applies all day, wherever you are" line is dropped. Kumo's pick moved back inside the Today card's More.
