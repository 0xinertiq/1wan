# KUMO — UNATTENDED AESTHETIC OVERHAUL HANDOFF

You are Claude Code working inside the existing Kumo High Court repository. The owner is temporarily offline and authorizes **local, reversible aesthetic work only** under the conditions below. Do not wait for approval between safe phases; proceed autonomously as long as gates pass. This instruction supersedes any older kit instruction to wait after every visual phase, **but never overrides the safety restrictions**.

## Inputs
Read `CLAUDE.md`, current code and status, `docs/kumo-redesign/README_START_HERE.md`, `CLAUDE_VISUAL_HANDOFF.md`, `UNLOCKS_AND_PROGRESS.md`, `design_implementation_kit_v1/01_DESIGN_BIBLE.md`, `02_SCREEN_AND_INTERACTION_SPECS.md`, `03_ASSET_BIBLE.md`, `04_TECHNICAL_GUARDRAILS.md`, `05_CLAUDE_CODE_MASTER_PROMPT.md`, all `moodboards/*.png`, and `existing_asset_pack_v1/asset-manifest.json`. If the bundle was extracted with an extra directory level, locate it and report actual paths. Inspect images visually, not just filenames. Current repo takes precedence for implementation facts; references determine design intent. Include newly built **Luna Daily Astro Weather** in Court and Observatory if present; do not remove it if incomplete.

## Preflight: do first
1. Record branch, commit, `git status`, active scripts, build/test commands, routes, feature inventory, user-state contracts, and integration endpoints. Inspect current implementation, not only the October audit.
2. Verify a recoverable baseline exists: committed checkpoint, clean or safely separated working tree, and evidence of a user-data backup. **Never create or claim a production Supabase backup by exporting source files.** If backup cannot be verified, do only isolated design-token/component work without data writes; report the gap.
3. If another Claude process or person is currently editing the same checkout, or the scheduled-task repointing has uncommitted work, **do not modify that checkout**. Create an isolated `git worktree` and `kumo/aesthetic-overhaul` branch from a safe committed baseline, or stop and report the exact blocker. Do not stash, reset, overwrite, cherry-pick, merge, or delete their work.
4. Confirm the visual reference folder exists. If absent, do not guess the approved visuals: report missing paths and stop before visual changes.
5. Run baseline typecheck, tests, lint/build where supported; record existing failures. Never modify production configuration to make tests pass.

## Non-negotiable protections
- Do not deploy, push, merge, run database migrations, edit production Supabase, alter RLS, auth, `OWNED_KEYS`, `normalize()`, secret handling, ingestion/export contracts, calendar fetching, scheduled-task URLs, scheduled-task configuration, or Vercel environment variables.
- Do not alter the task/quest/XP/star/streak/nine-tail economy, existing unlock ownership, Garden activity/rest-day semantics, or user data. Cosmetic unlocks may be **designed and previewed with fixture data**, but no purchase/award writes or schema changes without a later approval.
- Keep all existing modules and controls functional: Court, Calendar/Clock Tower, Garden, Diary, Observatory/Luna and Astro Weather, Life Hub, news/Telegram/research, technicals, feedback, login, settings, mobile navigation.
- Preserve current SVG fox sprites unless an approved new asset demonstrably matches better. Moodboards are conceptual, not transparent sprites. Only use the asset pack's independently placeable transparent artwork for layered scenes; label prototype art as such.
- Never print secrets, private calendar links or private records. No new OAuth, paid APIs, major dependencies or external services.
- Do not claim visual or browser verification unless screenshots/browser checks actually happened.

## Autonomous implementation, in order
A. Create `docs/kumo-redesign/IMPLEMENTATION_BASELINE.md` with current feature map, integration freeze list, risks, and evidence of baseline checks. Create a short checklist with status per phase.
B. Implement **scoped design tokens** (approved cream/sakura/lavender/plum palette, Playfair Display headings, Nunito body, accessible contrast, 8pt spacing, light/dark mode, reduced motion) without a global rewrite. Keep CJK fallbacks.
C. Refine shared presentational primitives and desktop/mobile navigation without changing event handlers, state contracts or API calls. Split legacy CSS incrementally; avoid sweeping selectors.
D. Restyle the Court homepage against `01_Home_Court.png`, including compact kingdom banner, usable Now/Next/Later hierarchy, existing Quick Capture, and **Luna Daily Astro Weather** if implemented. Keep all existing widgets discoverable. Do not duplicate task/calendar stores.
E. Restyle existing pages in this order, each with separate commits and checks: Clock Tower/Calendar, Sakura Garden, Fox Diary, Observatory/Luna/Astro Weather, Life Hub, notifications and settings. Use corresponding moodboards; preserve functionality.
F. Implement an **isolated, visual-only Kingdom Mode preview** with layered backgrounds, existing fox sprites, safe decorative animations, starter scenery and level-locked cosmetic previews. Use existing level read-only for locked/unlocked display where available; do not grant, charge, or persist items. Make locked states show requirements, not inaccessible core features. Do not promise fully operational inventory until approved schema and server validation exist.
G. Improve mobile layout and accessibility, then run all available tests, typecheck, lint, build, and browser screenshots at desktop and mobile widths if tooling is available. Fix regressions caused by this branch. Compare against moodboards and document deviations.

## Continuous gates
After each stage: inspect diff; ensure no protected files/contracts changed; run relevant checks; commit on isolated branch with descriptive message; update progress log. If tests fail because of this work, fix or revert the offending stage. If a task requires credentials, database changes, an external deployment, or an ambiguous product decision, skip it, document it as **NEEDS OWNER APPROVAL**, and continue only independent safe work. Stop entirely if there is risk of data loss or competing writes.

## Final handoff
Write `docs/kumo-redesign/UNATTENDED_RESULT.md` with branch/worktree path, commit hashes, exact screens changed, before/after screenshots if taken, tests and failures, protected integrations confirmed unchanged, remaining visual gaps, production artwork still missing, cosmetic unlocks that are preview-only, and precise next commands for owner review. **Do not deploy.** Do not mark friend onboarding, purchases, or per-user calendars as complete unless they truly work.

Start immediately with the preflight and proceed through safe stages without requesting routine approvals. If the preflight cannot pass, produce a useful audit/report instead of risking the current work.
