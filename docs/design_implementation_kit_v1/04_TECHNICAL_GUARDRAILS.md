# Implementation guardrails — grounded in KUMO_AUDIT.md

## Before applying aesthetics
1. Finish existing components and update status docs; do not use stale audit as proof of today's state.
2. Export personal data; verify file exists and can be read. Back up database with appropriate owner/admin process; avoid exposing secrets in chat.
3. Record current Git SHA, clean working tree, create `feature/kumo-visual-redesign` branch.
4. Verify current build/tests and manually smoke-test Court, Garden, Diary, Calendar, Observatory, Life, mobile and night mode. Document failures before changes.
5. Verify actual Supabase RLS on live database using safe test accounts, not just migration SQL; never expose service role to client.
6. If possible, use isolated staging Supabase with sanitized test data; a Vercel preview pointing at production Supabase is NOT isolated.

## Protect current architecture
- Next.js App Router + React 19 + TypeScript + plain CSS; do not force Tailwind or wholesale rewrites.
- Keep `PixelSprite.tsx`, `spriteDefs.ts`, established 32x32 art rules, animations and source contracts.
- Keep `/api/ingest/brief` and `/api/export/weekly` secret checks, rate controls and request shapes.
- Preserve `OWNED_KEYS`, `user_state` normalization/merge semantics and existing database data. Do not rename or migrate without a separately reviewed migration and rollback.
- Preserve existing iCal server env feed implementation (`GCAL_ICAL_URL_1..5`), read-only behavior and recurring-event parsing. Calendar links are secrets; do not expose in browser, logs, screenshots or public assets.
- Friend-specific calendar links are NOT built. If implementing them later, use private per-user server storage, authorization, SSRF-resistant URL validation, no raw URLs in client responses, fetch limits and clear subscription limitations. Do not claim Google OAuth or write access.
- Preserve research ingestion and per-user feedback; sanitize Markdown HTML before render; inspect `dangerouslySetInnerHTML` paths.
- Resolve or explicitly map duplicate sources: bills `life` vs `money.up`, garden `gd` vs `watering_events`, typed `mny` vs imported `money`, `cad` vs `samsara.t`, and nontransactional tick+watering writes. Never silently merge or delete.
- News caches and rate limits are in memory and may differ across serverless instances; do not label them durable.

## Progressive delivery
A. Snapshot, baseline and tests. B. Scoped design tokens/font migration with zero layout change. C. Reusable components and navigation behind toggle. D. Home and responsive layout. E. Calendar/Garden/Diary/Observatory/Life one by one. F. Kingdom layered art. G. Personalisation and server-validated rewards. H. Notifications/onboarding. I. Pilot hardening.

## Verification gates for each phase
Run typecheck/build/tests; desktop and mobile screenshots; keyboard/focus and reduced motion; dark mode; no regressions in calendar recurrence, saving, research, data export, auth and source freshness. Record diff and rollback instructions. Do not deploy or run SQL without explicit user approval.

## Privacy
Each friend's account must be isolated via verified RLS. Shared briefs (`user_id IS NULL`) are intentionally shared, while private diary, tasks, state, preferences and calendar links must not be. Verify with two test users and unauthorized API requests.
