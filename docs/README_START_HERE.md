# Kumo High Court — Complete Visual Reference & Progression Pack V2

**Use after the functional build is finished and safely checkpointed.** This bundle adds a per-page visual reference board and unlock/progression contract to the previous design kit and the actual V1 SVG/PNG asset pack. It does **not** certify the earlier generated concept images as production UI or animation-ready sprites.

## What is included
- `moodboards/`: 13 labelled reference boards, one for each approved page/experience and the visual language.
- `original_concept_references/`: 38 source-resolution concept images (including intermediate exploration, **not all individually approved**). The curated boards and written specs take precedence over exploratory images.
- `design_implementation_kit_v1/`: the earlier Design Bible, screen specs, tokens, guardrails and master prompt.
- `existing_asset_pack_v1/`: existing editable SVGs, transparent PNGs, scene layers, petal frames and previews. These are simpler than the painterly references; do not silently substitute them as final artwork.
- `UNLOCKS_AND_PROGRESS.md`: detailed unlocks, XP, stars, inventory, placement, data integrity and gameplay requirements.
- `CLAUDE_VISUAL_HANDOFF.md`: exact instructions for Claude on which references to consult and how to implement without guessing.

## Where to put this in your repo
Copy this folder to `docs/kumo-redesign/` after you finish your current components and create a backup + redesign Git branch. Claude should read `README_START_HERE.md`, `CLAUDE_VISUAL_HANDOFF.md`, `UNLOCKS_AND_PROGRESS.md`, the original master prompt and each board corresponding to the screen being implemented. Put **only assets actually used by the site** in `apps/web/public/kumo/`; don't copy 38 moodboards into public assets.

## Source-of-truth hierarchy
1. Approved user decisions and written screen requirements.
2. Curated per-page moodboards in this bundle.
3. Design Bible and technical guardrails.
4. Original exploratory images (supporting inspiration only).
5. V1 vector asset pack (functional prototypes, not a mandatory visual replacement).

All unlock thresholds below are **proposed defaults** pending validation with the existing `quests.ts`, `actions.ts`, `needFor(lvl)` and tails system. Do not reset existing progression.
