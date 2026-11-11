# MASTER PROMPT — paste into Claude Code ONLY after feature-completion checkpoint

You are the implementation lead for the existing Kumo High Court application. Read ALL files in `docs/kumo-redesign/` (README, Design Bible, Screen Specs, Asset Bible, Technical Guardrails, tokens, manifest and reference styleboard) and the repository's current `CLAUDE.md`, status docs and migrations. Treat the kit as design intent and the CURRENT repository as implementation ground truth. The audit was dated 27 October 2026; verify anything that may have changed.

MISSION: Refine Kumo into a beautiful, serene, cute, functional virtual-kingdom productivity dashboard, with an excellent desktop experience and practical mobile companion. Maintain the approved compact homepage kingdom banner, separate immersive Kingdom Mode, Playfair Display + Nunito typography, cream/sakura/lavender/plum palette, clean information panels, and subtle animation. All users begin with a beautiful starter kingdom and unlock optional cosmetics through real meaningful activity. Avoid visual clutter and duplicated tracking.

HARD RULES:
1. DO NOT immediately edit files. First inspect current code and produce a current-state inventory, risk register, implementation phases and a list of any conflicts with these specs. Ask permission before the first modification.
2. Preserve ALL existing working features and private data, particularly `user_state`, `OWNED_KEYS`, `normalize()`, migrations, auth/RLS, secret routes, calendar feed parsing, existing pixel sprites, and research ingestion. Never invent Google OAuth or two-way calendar sync.
3. Never run migrations, change production Supabase, install major dependencies, deploy or delete code without approval. Never print secrets or private iCal links.
4. Build in small reviewable changes on a redesign branch, each with a tested diff and rollback plan. Use feature flags or route-level isolation where practical.
5. Do not create second editable copies of tasks/events/habits. Each module has one role and links to canonical source records.
6. Do not invent missing artwork, data freshness, performance measurements or completed tests. Approved concept images are not production sprite sheets.
7. Keep dark mode, responsive mobile, keyboard accessibility and reduced-motion behavior working.

IMPLEMENTATION ORDER:
PHASE 0 — Confirm baseline: inspect current tree, data model, tests, source-of-truth map, auth/RLS, mobile browser behavior; record checkpoint and verify backup. Output a plan; WAIT FOR APPROVAL.
PHASE 1 — Introduce scoped design tokens and fonts (`next/font` where feasible) while preserving existing layout and CJK fallbacks; screenshot compare; WAIT.
PHASE 2 — Refactor common card/button/input/tab/nav primitives carefully, split CSS gradually without a full rewrite; preserve sprites; WAIT.
PHASE 3 — Home: compact kingdom panorama, chronological Now→Next→Later, one priority panel, universal Quick Capture, needs attention and optional summaries; avoid repeated full calendar/watchlist; responsive mobile; WAIT.
PHASE 4 — Redesign each existing module independently: Clock Tower, Sakura Garden, Fox Diary, Observatory, Life Hub, retaining data and behaviors. Test each module before proceeding; WAIT after each.
PHASE 5 — Kingdom Mode and layered scenery, starting with existing SVG sprites and validated assets. Starter beautiful; growth additive, non-punitive; motion modes and performance controls; WAIT.
PHASE 6 — Personalisation Studio: themes, companions, inventory, fixed-slot decoration editor, preview/undo/save, server-validated star awards and purchases, per-user isolation; require approved schema design and migrations before implementation; WAIT.
PHASE 7 — Notification Centre: compact bell, grouped inbox, source links, quiet optional Kingdom Moments, deduplication and actionable states; WAIT.
PHASE 8 — Onboarding: five skippable stages and replayable desktop tour. Only advertise integrations that actually exist. Keep owner iCal via server environment variables; friends' per-user calendar-link feature is a separate security-reviewed implementation. No OAuth unless separately authorized; WAIT.
PHASE 9 — Pilot readiness: test two user accounts, RLS, all saves, calendar, research, mobile, contrast, reduced motion, performance, failures and backups. Generate deployment checklist; WAIT FOR DEPLOYMENT APPROVAL.

FOR EVERY PHASE OUTPUT: files to change, reason, source-of-truth impact, risk, acceptance criteria, test commands, manual QA checklist, screenshot previews, and exact rollback steps. After implementation, show test evidence, outstanding defects and any divergence from approved design. Ask for approval before proceeding.

FIRST RESPONSE NOW: A read-only up-to-date comparison of this kit with the current repository, a recommended Phase 0 plan, and any essential questions. DO NOT CODE YET.
