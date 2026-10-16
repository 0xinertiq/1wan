# 1(WAN): project brief for Claude Code

Owner: "the Queen". Singapore, crypto swing trader in training. Building this for her own use first; friends try it after.
Ignore her VC researcher job (on pause). Windows desktop.

## How to work with her
- Start immediately with a one-line plan. Keep updates short and calm. Clean formatting, no clutter.
- Small slices. Confirm before anything irreversible. She watches usage: no wasteful long loops.
- Do not verify designs by screenshot unless she asks.
- Never ask her to paste passwords or keys into chat. Tell her which file to put them in (`apps/web/.env.local`).
- She is a beginner with dev tooling: give exact click-by-click steps, one at a time.

## Name
Keep 1(WAN). 完 whole (red seal), 玩 play (gold stamp), 碗 bowl (jade stamp). Display name lives in ONE place: `apps/web/src/lib/brand.ts`.
Still to check: handle, domain, trademark.

## Build order (do not skip ahead)
1. Export data (done: `data-import/`, git-ignored)
2. Repo + Supabase + Vercel
3. Import export data into Supabase
4. Pixel-for-pixel port of the dashboard (single-file ES5 HTML, v52) WITH the new pixel characters from the start
5. Side-by-side cutover
6. Point the cloud scheduled tasks at the new host; test with a throwaway write first
7. Then build the court as the new home screen, rooms one at a time behind a toggle

Do NOT fold the court into the live dashboard. Chat features (Ask the crew, chart reading) stay on a slim claude.ai artifact; no paid API yet.

## Tech plan
Web app (PWA), SVG/canvas sprites, Vercel hosting, Supabase Postgres + auth + storage, nightly backup, working "Export my data" from day one, usage table for tokens, cache briefs. PDPA and MAS caveats later.

## Multi-user from day one
user_id + row-level security on every table, invite-only login, private by default, shared briefs written once.
Journal entries are private, never shown to friends, and exportable.

## Crew (locked, identical for every user; one versioned spec file per character in `crew/`)
v1: Chief Kumo, Dundun (risk), Olli (macro), Pip (news), Fenn (trading analyst), Tilly (research), Luna (sky), Momo (dailies), Coco (habits, life admin), Poppy (content). Sisi (journal) joins when journalling ships.
Rules-only: Dundun, Luna, Momo, Coco, Jin, Nini, villains. AI: Olli/Pip shared; Fenn catalysts, Tilly, Poppy, Sisi weekly, Kumo weekly capped per user.
Pixel style is final: code-drawn SVG rects, 32x32 grid, plum outline #4a2538, blush cheeks, dot eyes, one gold accent.

## AI cost rules
Phase 1 just her. Friend beta on a capped API key, cheap model, caching. Never run friends through her personal subscription; never ask friends for API keys; no free-form AI chat for friends. Log tokens per user and per feature from day one (`usage` table).

## Scope rules
The app tracks, it never advises (no financial advice). No bank auto-link; Coco uses manual entry/CSV, no account numbers.
Market realm is a configurable lens: trading (default), local news, any topic, or off.
Google Calendar: read-only first.

## Scheduled tasks (prompts go in `prompts/`)
Daily Crypto Watchlist Scan 03:50 SGT, Midday Crypto Movers 14:30, Daily Intelligence Brief 07:52, Pulse Morning Brief 07:27 weekdays, Pulse Weekend 07:27, Chief Kumo weekly review Sun 08:50. They currently write to the old dashboard's artifact database.

## Data
`data-import/` holds her personal export and database copies. It is git-ignored: never commit or print its contents.
Old collections: briefs, agentmem, feedback, data/users/<id>/state. See `docs/data-model.md`.
