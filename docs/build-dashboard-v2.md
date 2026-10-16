# Build brief: dashboard v2 (tabs, decay garden, calendar views, Luna's sky)

Read CLAUDE.md and docs/build-trackers.md first. Same rules: push after each step with `npm run build` passing, no screenshots, no questions between steps unless irreversible, one manual checklist at the end (`docs/manual-steps.md`). Never commit or print personal data. Do not delete any existing saved data; migrate it.

## 1. Navigation: tabs, bottom bar
Bottom navigation (pixel icons, 5 items, thumb-reachable on phone; left rail on desktop):
1. Court (home)  2. Calendar  3. Garden  4. Diary  5. Life (sub-tabs: Money, Trade, Grid, Wins, Samsara)
Crew roster is reached by tapping a character on the Court, not a tab. Settings in the header menu.
Remove the Ask Kumo and Ask the crew windows (no paid AI chat; chat stays on the slim claude.ai artifact). In the crew detail show a single "Ask on claude.ai" button that opens a URL set in Settings (empty until she adds it).
Remove the routing box. Replace with ONE small status line under the stage, driven by real events only, never fake: e.g. "Olli filed the 07:52 brief", "Pip next: 14:30", or "Fenn is checking prices" only while a real fetch is running. No "thinking" animation without a real task behind it.

## 2. Court (home)
Castle, sky and crew animations on top. Sky is driven by (a) Singapore clock, (b) Luna's real astrological weather (section 6). Crew stand where their real work is (e.g. Olli at the desk after his brief is filed; idle crew walk into the palace as now).
Below, compact cards in this order, each collapsible, remembered per user:
- Needs you now (max 3, ranked): bills due today, a plan whose price reached entry with no order, a wilting branch, a calendar event in the next 2 hours, an unread brief.
- Today: weather (Singapore, from Open-Meteo, no key), to-do and today's quests, next 3 calendar events.
- Daily brief (summary first: 3 things that matter, expand for full) with Useful / Not useful.
- Watchlist scan (compact, prices live).
- This week strip: 7 days with event dots; tap to open Calendar.

## 3. Calendar tab (week and month, not just today)
- Views: Agenda (next 14 days), Week, Month. Day detail on tap. Default Week.
- Fetch a window of 90 days from all 5 iCal feeds (GCAL_ICAL_URL_1..5), expand recurring events, correct Asia/Singapore handling, all-day events, de-duplicate. Cache 15 minutes. One failing calendar must not break the others.
- Colour per calendar with filter chips. Layer toggles (off by default except Calendar): money (bills, renewals, salary), grid dates, Luna's sky events (stations, ingresses, eclipses, moon phases), trading plan timeframe ends, Friday thesis slot.
- Show free gaps of 45+ minutes, as in the old "Ideas for your free time".
- Note in the UI that Google's secret feeds can lag by a few hours.

## 4. Garden tab: decay replaces typed weeds
Delete the "Other habits", "Plant another habit" and "Weeds to pull" sections. Do not delete her saved items: move them into a read-only "Archive" inside the Diary.
Decay rules (computed from watering_events, per branch; trunk uses daily anchors):
- Blooming: activity in the last 1 day. Thirsty: 2 days. Wilting: 3 to 4 days (leaves droop, petals fall, the matching crew character gives one concrete nudge, e.g. a 10-minute walk). Withered: 5 to 7 days (bare, grey). Dead: 8+ days with no activity.
- A dead branch shows a "Weed it out" button. Weeding removes it and regrows a sprout; lifetime blossoms, XP and diary history are never lost.
- Any real activity revives one stage at once. Rest days, rest weeks and sick days (existing keys restDay, restWeek, skip, calm) pause decay.
- Map anchors and events to branches in one config file (`apps/web/src/lib/gardenMap.ts`): for example exercise, meals and sleep to the Home and body branch; trades, plans and the checklist to Trading craft; focus sprints and study hours to Learning; posts to X brand; grid ticks to their own pillar. Make the mapping editable later.
- Wilting and dead branches appear in "Needs you now". Tone: gentle, never shaming. The tree reflects habits, not her worth. No penalty text about her.

## 5. Diary tab
Existing Fox Diary and weekly recap, private, editable, exportable. Add the Archive (old weeds and habits). A "Tonight, count your wins" guided sheet opens at 21:30 or on demand, instead of a permanent block.

## 6. Luna's astrological weather (rules only, no AI, no paid API)
- Compute positions with a free ephemeris library (for example astronomy-engine or Swiss Ephemeris compiled to WASM). Tropical zodiac, Placidus houses. Verify against the Sun and Moon to within a degree for a few dates.
- Natal chart: Settings form for birth date, time, place (private, stored per user in user_state, never in git, never logged, never in a shared table). Compute the natal chart from it. If empty, Luna shows the general sky only.
- Today's sky: Moon phase and sign, retrograde planets, planet signs, transits within 1.5 degrees to natal points (with the house), next 14 days of stations, ingresses and eclipses.
- Wording is generated from fixed rule templates that only restate the chart and transits (for example "Mercury retrograde in Scorpio, 24 Oct to 14 Nov"). No predictions about trades or outcomes and no tailoring to her interests.
- Visual: sky colour and moon from real data; retrograde glyph chips on the sky strip; tap Luna for the full reading.
- Feed her Calendar layer with the same events.

## 7. Finish
Update docs/status.md (real vs sample). Print what works, what is sample only, what was skipped, then the manual checklist. Do steps in order: 1, 4, 2, 3, 6, 5.
