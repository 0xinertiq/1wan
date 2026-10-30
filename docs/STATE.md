# 1(WAN): current state

This file is written from the code on branch `kumo/aesthetic-overhaul` after Round 14 (commit 1e07f4b). It covers the preview only; live (production) has not been changed by the redesign rounds. Paths are under `apps/web/src/` unless shown otherwise.

## Pages

**Tabs** (`components/court/AppTabs.tsx`):
- Main tabs: Court, Calendar, Garden, Dungeon (`#diary`), Life.
- The New look adds Trades, News, Settings and Kingdom Mode. On desktop they sit in the left rail. On a phone, the bottom bar holds Court, Calendar, Life and Dungeon, and everything else (Garden included) is under More.
- The Welcome tour is not in the menu. It opens from `#welcome` or "Replay the tour" in Settings.
- Classic look: the five main tabs only, as in the old v52 dashboard.

| Page | What it shows (New look) |
|---|---|
| Court | The Living World (the kingdom scene) with the crew roster, Today, Needs you now, briefs and the scan, Luna's sky, week strip and week ahead, economic releases, headlines and status. |
| Calendar | Calendar card (Day, Week, Month, Agenda) and the economic releases. |
| Garden | Sakura bonsai centrepiece; Daily anchors, My habits, Branches, Quests (with Kumo's pick), Wins ladder; Edit garden panel. |
| Dungeon | Your pages (journal), Today's gratitude, Gratitude log, Mood and tags, Trade reflection, Weekly look-back. Private; fits one screen on desktop. |
| Life | The Grid & Wins chart, Life admin and money (spending and budgets views, with the Money Wins Q4 ladder in its overview), My tasks, Routine. |
| Trades | Trade log, Scan, Position size calculator, Performance stats, Macro desk (Olli), Long-term watchlist (Tilly). |
| News | Today's briefing and the headlines, following the lenses chosen in Settings. |
| Settings | Replay the tour and Sign out in the page header; then Account, Look, Market lens, Rooms, News and Telegram, Connections, Quotes, Luna's birth details, Kumo's weekly review, Usage and tokens, Your data. |
| Kingdom Mode | Kingdom stage and level, the Living World, and a preview catalogue (cosmetic only). |
| Welcome tour | Five onboarding steps. |

## Agents and banners

**Agent per tab**, as wired in the code:
- **Calendar: Momo.** The clock-tower room and Momo's alert "!" are there.
- **Dungeon: Sisi.** She is in the room banner.
- **Life: Coco.** Coco's alert opens the Life Hub (`lib/court/alerts.ts`), and Coco appears in its empty states.
- **Trades: Fenn**, the trading analyst (`lib/crew.ts`). Fenn's sprite is used on the page; the Macro desk card is labelled Olli and the Long-term watchlist is Tilly's.
- **News: Pip** (`lib/crew.ts`: "News").
- **Garden:** Momo's evening habits alert opens the Garden.
- **Court:** Kumo's Needs you now alert opens on the Court. Kumo's weekly-review alert opens the review card in Settings.

**Room banners** (`components/kumo/decor/`):
- **They are all one size.** Every room banner uses the same frame (`RoomFrame.tsx`, CSS class `.kroom`) on a 400 x 60 pixel grid.
- **Height cap:** on screens at least 1200px wide, every banner shares one height cap: `max(120px, 100vh - 504px)` (`kumo-new.css`). In practice it only bites on screens under about 800px tall, so the banners still match.

| Tab | Banner | File |
|---|---|---|
| Calendar | Momo's clock tower | `ClockRoom.tsx` |
| Dungeon | Sisi's stone study | `DungeonRoom.tsx`, `dungeonArt.ts` |
| Life | Coco's planner room | `MoreRooms.tsx`, `moreRoomsArt.ts` |
| Trades | Fenn's trading desk | `MoreRooms.tsx`, `moreRoomsArt.ts` |
| News | Pip's newsroom | `MoreRooms.tsx`, `moreRoomsArt.ts` |

**Pages without a room banner:**
- **Welcome tour:** still uses the old small scene (`castle`, from `scenes.ts`).
- **Settings and Kingdom Mode:** no banner (since Round 14). The scene code and files are kept.
- **Garden:** no banner; the bonsai is the centrepiece.
- **Court:** no banner; the Living World is the page.

## Garden

**Bonsai** (`GardenTree.tsx`, `treeArt.ts`):
- Five stages from real ticks this week: 0, 1, 5, 12 and 20 ticks (`lib/court/habits.ts`).
- It wilts after missed days and recovers with a sparkle.
- The pond, bridge and left lantern were removed in Round 13.
- What remains: the right lantern, grass tufts, and a small wooden tray (the planter) with rocks and moss. A moon shows behind the tree at full bloom.
- There is no sun in the code. The Round 13 prompt mentioned one, but none was drawn.

**Edit garden** (`components/court/live/EditGarden.tsx`):
- One button opens one panel with four tabs: Habits, Quests, Anchors, Wins ladder.
- You can rename, reorder, hide and unhide in every tab. Anchors also take a time and days (daily, weekdays or custom).
- New habits are added only in My habits.
- Hiding folds an item away and deletes nothing.

**Daily anchors quest:**
- Its target is the imported anchors scheduled and shown that day: 8, unless some are hidden or rescheduled.
- It still finishes through `logQuest`.
- Anchors you add yourself award nothing.

**Branch colours** (`branchProgress` in `lib/court/branchChart.ts`). Branches read the effective 9x9 chart for 2026 or 2027.

| Colour | Meaning |
|---|---|
| Grey | never started |
| Faint pastel tint | cells done, quiet this week |
| Pastel green | activity this week |
| Soft gold edge | all eight cells done |

## Saved state: OWNED_KEYS

- **Where it lives:** your state is one JSON document in `user_state.data`, typed in `lib/court/state.ts`.
- **Saving:** saves send only `OWNED_KEYS`, and `/api/state` refuses any other key.
- **Reading:** `normalize()` reads each key safely, so a missing or odd value falls back to its default.

```
v day week streak stars lvl xp q days wins dump life gd cad restDay restWeek mny tails lines packet news tg
birth grid swins money samsara spr last prev prefs hab gridDefs lenses gridDefs2027 grid2027done questsOff
quotes gedit
```

Optional keys added during the redesign, as marked in the code comments:

| Key | Round | What it holds |
|---|---|---|
| `prefs` | 6 | lens, rooms, notifications, onboarding, name, time zone, companion |
| `hab` | 6 | your own habits |
| `gridDefs` | addendum 1 (round not stated in the code) | your edited Grid & Wins chart |
| `lenses` | 7 | news lenses |
| `gridDefs2027`, `grid2027done` | 10 | the 2027 chart and its ticks |
| `questsOff` | 12 | built-in quests switched off |
| `quotes` | 12 | your quote library |
| `gedit` | 13 | Edit garden |

Smaller optional fields:
- `autoPaid` and `important` on life items (Round 5b);
- `s` (one small win) on gratitude entries (Round 12).

You approved `lenses`, `gridDefs2027`, `questsOff`, `quotes` and `gedit` in Round 14.

## Supabase tables

| Migration | Tables | Used now |
|---|---|---|
| 0001 | profiles, user_state, agent_memory, feedback, briefs, usage | yes (profiles only in Export my data) |
| 0002 | briefs readable by signed-in users only | yes |
| 0003 | briefs.meta column | yes |
| 0004 | trades, plans, gamble, ledger_settings, spending, watering_events | yes |
| 0005 | plans.stop, plans.target columns | yes |
| 0006 | journal_entries, goals, finance_entries, research_notes, longterm_watchlist, tasks, routines | **no** |

- **About 0006:**
  - It is additive only: seven new tables, each owner-only with row-level security.
  - It is not applied, according to the owner's notes. The code can't confirm this, but the default device storage fits it.
  - The app uses those tables only when `NEXT_PUBLIC_1WAN_TABLES=on` (`lib/vault.ts`). Until then, those records stay on the device ("Preview storage, this device only").
- **Export:** Export my data (`/api/export`) lists all 19 tables. It skips the 13 optional tables from 0004 and 0006 if they don't exist yet; a missing 0001 table would make the export fail.

## Scheduled routines

There are four cloud routines (`prompts/README.md`). Each posts one brief to `/api/ingest/brief`, which writes a row to the `briefs` table:

| Routine | Runs (SGT) | Sends `kind` |
|---|---|---|
| daily-crypto-watchlist-scan | 03:50 daily | `scan` |
| midday-crypto-movers | 14:30 | `movers` |
| daily-intel-brief | 07:42 daily | `intel` |
| chief-kumo-weekly-review | Sun 08:50 | `review` |

- **Old triggers:** the six old triggers are disabled.
- **Accepted kinds:** the ingest route accepts `pulse`, `intel`, `scan`, `movers` and `review`.
- **Other names:** older names and aliases also work, such as `weekday`, `weekend`, `daily`, `morning`, `watchlist` and `weekly` (full list in `lib/briefKinds.ts`).
- **Where the prompt text lives:** in the cloud tasks, not in this repo. Kumo's rules are in `crew/kumo.md`.

## Protected

Never touch:
- auth, existing RLS, middleware;
- `OWNED_KEYS` and `normalize()` (new optional keys only, with tests and a shown diff);
- `/api/ingest` and `/api/export` logic (new tables may only be added to export);
- calendar fetching code and scheduled-task config;
- XP, stars, streak and tails logic, and the decay and recovery rules;
- user data and env vars;
- `components/PixelSprite.tsx` and `spriteDefs.ts` (new art goes in new files);
- existing migrations (create only, never apply).

Standing rules:
- Delete nothing; hiding never deletes.
- The app tracks; it never advises.
- The display name lives only in `lib/brand.ts`.
- `data-import/` is git-ignored: never print or commit it.
- Preview only until you say "ship it".

## Open items
- **Migration 0006:** apply it once you've confirmed which Supabase project Preview and Production use (Vercel, then Settings, then Environment Variables, then `NEXT_PUBLIC_SUPABASE_URL`). Then set `NEXT_PUBLIC_1WAN_TABLES=on`.
- **Kumo's weekly review:** paste the 1 ATR stop rule from `crew/kumo.md` into the cloud routine `chief-kumo-weekly-review`.
- **Scan prompt:** optionally copy each cloud routine's prompt into `prompts/`.
- **Room banners:** decide on banners for the remaining pages. The Welcome tour still uses the old castle scene.
- **Lint:** the project has no lint setup (`next lint` only offers to create one).
- **Shipping:** ship the branch to live when you say so.
