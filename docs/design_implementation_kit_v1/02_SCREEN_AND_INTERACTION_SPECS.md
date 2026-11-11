# Screens and interactions

## Home / Court
Compact living kingdom banner at top; then chronological Now / Next / Later from existing calendar and tasks, a single priorities panel, Quick Capture, important Needs Attention, optional brief/market summary, quiet progress. User can reorder/hide optional widgets. No second complete calendar, full watchlist or diary archive. Progress in scenery rather than a forest of badges.

## Kingdom Mode
Full-screen/large scenic view. Beautiful starter kingdom; meaningful habits, projects, diary and goals unlock scenery/companions/decoration. Growth is not punishment: missed days do not destroy purchased cosmetics. Starter vs Growing is additive, with density limits. Click on scenery areas to navigate modules; no duplicated forms in world view.

## Clock Tower
Google Calendar is authoritative for external events and remains read-only via iCal for now. Day/week/month, chronological agenda, source labels and last fetched time. Kumo Quick Tasks are separate internal records, not Google Calendar events. Do not promise Google write access. Focus timer can reference a task without creating another task. Link-based feeds can be stale.

## Sakura Garden
Simplified starter garden; tree grows from habits; concise habit quest list, expandable evening check-in, clear plant/remove interactions. Retain existing decay logic and rest days, but avoid punitive language and overcrowded plant objects. No redundant tracking; reuse quest events and watering events.

## Fox Diary
Text-first journal editor and text-only archive, no thumbnails, no decorative parabolic charts under entries. Daily wins, gratitude, free writing optional; weekly recap based on existing diary. Privacy-first. Autosave or explicit save with clear status; never pretend save succeeded.

## Observatory
Premium research workspace. Market Pulse = market-wide conditions and narrative, NOT repeated ticker prices. One Watchlist = tracked assets, prices, % moves, sparklines, freshness. Briefs by desk, prioritized actionable findings, saved research ideas, macro calendar, source confidence and feedback. Keep existing technicals, news, Telegram, funding/OI and ingestion contract. Avoid fabricated freshness.

## Life Hub
Goals & Milestones, Projects, Life Management, Personal Progress. Optional finance/health/pets/home sections based on user preferences. Do not repeat Today/Calendar, full habit list or diary archive. Link projects to canonical tasks; no new duplicate task records.

## Personalisation Studio
Theme preview, companion selection, decoration inventory/shop, separate Dashboard and Kingdom previews, fixed predefined decoration slots, undo and Save/Cancel. Theme/companion selection accessible immediately; unlockable cosmetics later. Shop is its own tab. Server-validated stars and purchases; idempotent award events; owner-specific inventory and placement. All users start with an attractive default kingdom.

## Notifications
Bell dropdown + full grouped inbox: Needs Attention, For Your Information, optional quiet Kingdom Moments. Priority/source filters, source links, actionable detail, read/resolve, mobile swipe if accessible alternative exists. Link to source records; do not duplicate tasks. Alerts grouped and deduplicated. Push notifications deferred.

## Onboarding
Five stages: Welcome → Interests → Optional Connections → Theme/Companion/Dashboard preference → Enter Kingdom. Optional skippable first-login guided tour, replay from Settings. Show ONLY integrations actually implemented. Owner iCal links in env do not make per-user calendar links available; build secured user-specific link storage and fetch before showing this as an option for friends. No Google OAuth required for owner pilot. Sign-up and invitation behavior must follow actual auth implementation.

## Mobile
Not a shrunk desktop. Compact scenery, short Now/Next, Quick Capture globally, <=5 nav destinations, text-first diary, reduced art in information screens. PWA is optional progressive enhancement, not a native iOS app claim.

## Empty and failure states
Friendly text with a single relevant illustration only where useful; distinguish no data, disconnected, loading, stale, permission denied and failed sync. Provide retries where safe, never silently drop user edits.
