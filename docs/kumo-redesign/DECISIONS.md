# Kumo redesign: decisions and working agreement

Single source of truth for the redesign. If an earlier message conflicts with this file, this file wins. Re-read it at the start of every slice. Keep `PROGRESS.md` and `MISSING_ART.md` up to date next to it. The owner should never have to repeat anything written here.

## 1. How to work with the owner
- She is "the Queen", a beginner with dev tooling. Start with a one-line plan. Short, calm updates, clean formatting.
- Small slices. She watches usage: no wasteful loops, no re-reading the whole package every turn (use this file and the page notes in section 8).
- No screenshots or visual self-checks unless she asks. She reviews the live site herself and sends screenshots.
- Never ask her to paste secrets into chat. If a manual step is needed, give click-by-click steps, one at a time.
- Do not ask questions already answered here. If a real decision is missing, ask once, with a recommended default.

## 2. Deploy policy (authorised by the owner)
- Every slice that passes ALL gates is deployed: typecheck, tests, build, and `git diff --stat` shows zero changes to the protected paths (section 3).
- Tag the last good commit (`pre-slice-X`), merge to main (no force-push, no history rewrite), push, wait for Vercel Ready.
- After deploy check: site loads and login works, and `POST /api/ingest/brief?dryRun=1` returns 200 using the env secret (never print it). The owner confirms login herself.
- Any failed check: roll back (revert or promote the previous deployment), tell her, stop.
- Backup: the owner exported her data on 27 Oct 2026 (before slice A). Ask for a fresh export only before something touching data.
- Classic / New look switch in Settings stays until she says "remove the Classic switch". New look is the default.

## 3. Protected, never touch
Auth, RLS, `OWNED_KEYS`, `normalize()`, middleware, `/api/ingest` and `/api/export` routes, calendar fetching and env vars, scheduled-task URLs and config, XP / stars / streak / nine-tail logic, user data, Vercel env vars, migrations. `PixelSprite.tsx` and `spriteDefs.ts` stay the production sprites. Display name only in `apps/web/src/lib/brand.ts`. The app tracks, never advises.

## 4. Look (approved)
Cream canvas, sakura pink actions, lavender and sky accents, plum text, Playfair Display headings, Nunito body, Silkscreen only for tiny labels, CJK fallbacks kept. Cards 16px radius, soft shadows, 8pt spacing, min 14px interactive text, 44px tap targets, visible focus ring, reduced motion respected, night mode keeps its colours until a contrast check is done. Pixel foxes and crew are the characters; painterly art is backdrop only. Art lives in banners, welcome and empty states and reward moments, not in every card.

## 5. Art plan (decided)
- Now: code-drawn pixel decor (SVG, plum outline, one gold accent) plus recoloured asset pack for night / Moonlit.
- Painted look comes from the original concept images, kept OUTSIDE the repo at `C:\Users\tmin0\Documents\kumo-art-source\original_concept_references`. Crop only what is used, compress to WebP into `apps/web/public/kumo/`, never copy the 72 MB folder. The asset pack in `existing_asset_pack_v1` is flat vector and is only a fallback.
- Concept images have mock UI baked in. Never show it: crop around it, or cover it with the real overlay (real chips, title card, speech bubble), or patch with sampled sky. If it cannot be made clean, keep the previous banner and report.
- Every stand-in goes in `MISSING_ART.md` (file, size, anchor, slot) and is a swappable asset so commissioned art replaces it later without code changes. Label prototype art.
- Commissioned or regenerated art comes LAST. Cheapest next improvement: ask GPT to redraw the scenes with no text on them, wide 3:1 for banners.

## 6. Court and Kingdom (decided)
- The Court is a summary. ONE Today card (Now / Next / Later), ONE compact Luna forecast card, Needs-you-now, kingdom progress, Quick capture, then a collapsed "More on your court". No duplicated calendar, ticker or habit panels.
- Cloud Court becomes the Living Kingdom: a painted floating island with tappable places (The Castle, Clock Tower, Sakura Garden, Observatory, Fox Diary, Life Hub) that navigate to tabs. It keeps the live data (BTC/SOL, who is at work) as small badges. Stages Starter, Growing (then code-drawn growth for later levels), cosmetic only, never locks a feature, missed days remove nothing. Source: concept image 26, top row (Starter 0-762px, Growing 764-1536px).
- Kingdom Mode page: large scene with the same hotspots and a read-only preview of Structures / Nature / Furniture / Companions / Themes with states LOCKED / UNLOCKED_UNOWNED / OWNED_UNPLACED / PLACED. Preview only: no purchases, star deductions, ownership writes, migrations without her later approval.
- Luna's Daily Astro Weather already exists (calendar-sourced, plus separate "Calculated by Luna" row): restyle only, keep logic. Never invent DO / DON'T or interpretations; show only what the astro calendar text says, with source line and Singapore time.

## 7. Order of work
A foundation (done) · B shared primitives (done) · C Court home (done) · C2 Court cleanup + painted banner + Living Kingdom card · D Observatory (done) · E pages one at a time: Calendar, Garden, Diary, Life Hub, Notifications, Settings, Onboarding, Personalisation Studio · F Kingdom Mode page · G mobile and accessibility. After each deploy report in five lines: what changed, deployed commit, what to look at, anything needing approval. Then continue to the next slice unless a gate fails or approval is needed.

## 8. Page notes (from the 13 moodboards; concept image numbers are files in `original_concept_references`)
- Calendar / Clock Tower (board 03; refs 07, 23, 28): painted clock-tower side panel and short banner; Today's timeline, month mini-calendar, My tasks, Focus mode (25/50/90 timer), Upcoming events, Habits today; day / week / month; source label and last-fetched time; read-only iCal, no write sync promised. Kumo quick tasks are separate from calendar events.
- Sakura Garden (04; refs 22, 27, 5): banner of the tree, bridge and stream; today's habit quests, garden progress and season, recent activity, "Your garden" scene, companions; tree growth stages 0-4 with one anchor; keep decay and rest-day logic, no punitive wording.
- Fox Diary (05; refs 8, 9, 35): cozy library banner with fox; month calendar plus text-only entry list on the left, editor in the middle with a small toolbar, "Today's reflection" mood row on the right; autosave with honest status; privacy first; no thumbnails or decorative charts in the archive (ignore the pictures in the concept).
- Observatory (06; refs 10, 11, 24): night library and telescope banner; market overview, today's briefing, ONE watchlist, research desks, key ideas, macro calendar, focus and notes, recent research table; timestamps and sources; Luna 7-day forecast (done).
- Life Hub (07; ref 32 for the look, 12 and 16 are Observatory): goals and milestones, active projects, life management (finance, health, pets, home as optional), personal progress; links to canonical tasks, no copy of Today.
- Personalisation Studio (08; refs 25, 37, 26): themes, colour palette, atmosphere, companions, live preview (Dashboard vs Kingdom), decoration shop with locked items and requirements; preview only.
- Notifications (09; refs 1, 3, 14): bell dropdown plus full inbox grouped High priority / Today / Earlier, filters, detail view, quiet Kingdom Moments, empty state with the fox, deduplicated, deep links; no fake push.
- Onboarding (10; refs 4, 14, 15): five skippable stages (Welcome, Interests, Connections that really work, Theme and companion, Enter kingdom) plus an optional replayable tour.
- Mobile (11; refs 15, 1, 4): short banner, short Now/Next, global Quick Capture, bottom nav of 5 (Home, Calendar, Hub, Diary, More), text-first diary, reduced art in dense screens.
- States and components (12; refs 18, 19, 29): buttons, chips, inputs, cards, loading / empty / error / stale / offline, contrast, reduced motion.

## 9. Not part of the redesign (do not start)
Scheduled tasks and prompts, the learning loop (phase 2, after she has used the dashboard for a few days), friend onboarding and per-user calendars, purchases and star spending, migrations. Pending docs task: update `prompts/README.md` task table and mark milestones done (see her queued message).

## 10. If you are unsure
Prefer the smaller, reversible choice, keep behaviour identical, list it under NEEDS OWNER APPROVAL in `PROGRESS.md`, and carry on with independent safe work.
