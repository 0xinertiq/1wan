# Instructions to Claude Code — visual handoff and no-guessing contract

**Read this before editing any UI.** The user is finishing functional components first. Until they explicitly say 'start the redesign', this bundle is **reference only**. Do not modify source files, migrate data, install dependencies or deploy.

## Mandatory per-screen process
1. Audit the *current* implementation of that screen and its source-of-truth data after the functional work is finished.
2. Open the corresponding labelled image in `moodboards/` and review the relevant written specification in `design_implementation_kit_v1/02_SCREEN_AND_INTERACTION_SPECS.md`.
3. List what to **retain**, **restyle**, **add**, and **not duplicate**; preserve all existing data, API routes, research and calendar integration.
4. Create a small implementation plan including assets, states, interactions, desktop/mobile and acceptance tests; obtain approval.
5. Implement only that screen behind a safe feature toggle if appropriate. Compare actual browser screenshots to the moodboard at desktop and mobile sizes. The images are conceptual; exact tiny labels/data in generated mockups are not product requirements.
6. Show side-by-side before/after and identify any differences requiring a visual decision; don't silently improvise major scenery or change the locked approved style.

## Moodboard map
- Visual tokens, cards, controls: `00_Visual_Language.png`, `12_States_and_Components.png`
- Home: `01_Home_Court.png`
- Kingdom Mode: `02_Kingdom_Progression.png`
- Clock Tower / Calendar: `03_Clock_Tower.png`
- Sakura Garden: `04_Sakura_Garden.png`
- Fox Diary: `05_Fox_Diary.png`
- Observatory / research: `06_Observatory.png`
- Life Hub: `07_Life_Hub.png`
- Personalisation / inventory / shop: `08_Personalisation_Studio.png`
- Notifications: `09_Notifications.png`
- Onboarding: `10_Onboarding.png`
- Mobile: `11_Mobile.png`

## Non-negotiable functionality
- Home has compact scenery and global Quick Capture; no duplicate complete task/calendar/watchlist components.
- Clock Tower currently uses **read-only** server-side iCal feeds; don't pretend OAuth or write sync exists. Friends' per-user links need a separate secure implementation.
- Diary autosaves reliably; archive is **text-only**, no decorative thumbnails.
- Observatory has ONE ticker watchlist; research, news, Telegram, technicals and feedback retain their functionality and freshness/source indicators.
- Garden and kingdom growth derive from existing activity and preserve rest days.
- Life Hub links to canonical tasks/goals, not duplicated administrative records.
- Mobile bottom navigation max five; More for secondary modules.
- Notifications dedupe and deep-link to canonical records; no fabricated push support.
- Onboarding five skippable stages; show only connections that work.
- Studio has visible **locked items** and clearly distinguishes earned, purchasable, owned and placed items. See `UNLOCKS_AND_PROGRESS.md` for data, security and test contract.

## Asset usage
`existing_asset_pack_v1/` contains actual vector SVG and transparent PNG assets, but the artwork is simpler than the approved rich painterly concept. **Do not swap existing sprites or ship flat vector scenes as final without visual sign-off.** Existing `PixelSprite` / `spriteDefs` remain a protected source. Only move production-ready assets into `apps/web/public/kumo/`.

## Final preflight
Export user data, verify backup, record commit, create redesign branch, run current build/tests, test browser desktop/mobile, verify live Supabase RLS and env behavior, and inspect `OWNED_KEYS`/`normalize()` before any data changes. New catalog/inventory/rewards/placement schema must be approved separately. No destructive migration or production deployment without user approval.

## Read these in order
`README_START_HERE.md` -> `CLAUDE_VISUAL_HANDOFF.md` -> `UNLOCKS_AND_PROGRESS.md` -> `design_implementation_kit_v1/04_TECHNICAL_GUARDRAILS.md` -> `design_implementation_kit_v1/05_CLAUDE_CODE_MASTER_PROMPT.md` -> specific page board.
