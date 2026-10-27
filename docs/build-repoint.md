# Repoint the 6 scheduled tasks to 1(WAN)

Tasks: Daily Crypto Watchlist Scan, Midday Crypto Movers, Daily Intelligence Brief, Pulse Morning Brief, Pulse Weekend, Chief Kumo weekly review. They run in her claude.ai cloud account and today write to the old artifact database (ArtifactData: collections briefs, agentmem, feedback). Do NOT disable or remove those writes until the cutover is verified for a week.

## The secret (no secret ever goes in a prompt)
Cloud environment network secret (Anthropic's agent proxy attaches it; the task never sees it): allowed website = her Vercel host, header Authorization, prefix Bearer, value = INGEST_SECRET. She adds it once in the environment dialog. The tasks then POST WITHOUT an Authorization header; the proxy adds it. One secret per host only, so phase 2 reuses the same bearer.

## Phase 1: add a non-blocking second write (after the throwaway test passes)
1. Throwaway test first: a one-off task POSTs to /api/ingest/brief?dryRun=1 with no Authorization header and reports the HTTP status and ok flag. Then one real throwaway brief (kind scan, title "Throwaway test"), which she deletes or ignores.
2. Add after each task's existing dashboard_sync block a block named new_dashboard_sync: POST the same finished brief to https://<host>/api/ingest/brief (JSON: kind, title, body, meta.sources, at), kinds per prompts/INGEST.md. If the answer is not ok:true, skip silently; never block or change the delivery; never print any secret. Exempt from token budgets, at most one extra call, no research.
3. Export each task prompt into prompts/<name>.md (trigger id on line 1) BEFORE editing, so any change can be reverted.
4. Change one task first (Midday Movers), verify the brief appears in the app, then the other five.

## Phase 2: learning loop moves to the app
Today each desk reads feedback and agent memory from the old artifact. New ratings (Useful / Not useful) are saved in the app's own database and the desks never see them.
- Add `GET /api/ingest/learning?desk=<key>` (same Bearer as ingest, constant-time check, rate limited) returning that desk's last 60 feedback items and its agent_memory document as plain JSON (no other users' data, no diary, no personal fields).
- Add `POST /api/ingest/memory` to save a desk's agent_memory (fields: lessons, sourceNotes, selfCheck, stats; size limit; service role; shared row per desk).
- Update each task's learning block to read and write these instead of ArtifactData, only after the app version has run for a week with the old write still in place. Keep the old write as fallback until she says to remove it.
- Chief Kumo's weekly review reads the same endpoints, plus the weekly packet only if she includes it.
Tests for both endpoints (auth, limits, no leakage), then docs in prompts/INGEST.md.

## Verification
Compare each brief in the app with the one delivered in her message that day (same title and length). Log in docs/progress.md.
