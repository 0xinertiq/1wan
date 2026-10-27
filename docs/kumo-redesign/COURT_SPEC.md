# Court redesign and shared spec (final brief, agreed with the owner)

Single source for the Court and for the shared design system and all tabs. Replaces RESET_LIVING_WORLD_MESSAGE and every earlier Court, banner and Living Kingdom instruction. Referenced from DECISIONS.md sections 5 and 6. Parts 3 and 4 override Parts 1 and 2 where they differ.

STOP everything else first: no other pages (Diary etc.) until the Court is approved. Calendar and Garden stay as deployed.

## Part 1: Court

### What went wrong (so we do not repeat it)
Briefs and scans were hidden under a collapsed "More"; painted concept crops with oversized white chips looked wrong; the banner had no purpose; the Living Kingdom card was tiny; Luna's headline repeated three times. Do not use concept-image crops or fake overlays anywhere on the Court.

### What she decided
- First view: half world, half information. The world is big enough to feel alive; the key information is visible under it without scrolling on desktop.
- World style: PIXEL, code-drawn, refined from the old Cloud Court (the Classic Cloud Court scene is the base). Locked style: SVG/canvas, plum outline #4a2538, 32x32 crew sprites, blush cheeks, one gold accent. Re-colour into the new palette (cream, sakura, lavender, sky, plum). No painted art, no GPT art for now.
- Navigation: BOTH, equal. The left rail always works, and every place in the world is a tappable shortcut to the same tab.
- Priorities, all four: briefs and scans, prices, today's tasks and calendar, Luna's forecast.
- First row under the world: Today + Needs-you-now (left) and Briefs and scans (right).
- Alive in the world: crew walking and working, day and night, weather. NOT market mood (no sky or sea tied to BTC).
- Density: cosy detail that grows as she levels up.
- Mobile: short strip of the world, information first.

### Layout, desktop (1200px and up)
1. Header as now (clock, streak, stars, tails, menu).
2. LIVING WORLD, full width, about 45-55% of viewport height, max about 520px. No separate banner. Small place labels, not big boxes. Small badges only: level, crew at work, today's weather. The greeting is a small line, not a big card.
3. PRICES STRIP directly under the world: slim live bar with BTC, SOL and the scan tickers, with the data time ("as of 18:55"). Existing price data only.
4. ROW 1, two columns of equal height: LEFT = Today (Now / Next / Later, due soon, streak, habits) with Needs you now under it. RIGHT = Briefs and scans: compact cards for the latest Intel, Scan, Movers and Kumo's weekly review (title, time, first lines, Open, and the same rating / feedback actions Classic has). Nothing hidden behind "More".
5. ROW 2: Luna's forecast (one compact card, headline ONCE, moon and sign, up to three events, Read more; only text the calendar actually contains, no invented DO / DON'T), Kingdom progress, Quick capture.
6. Anything else Classic shows goes under a "More on your court" section that is collapsed by default but listed with its names (not hiding the key four). Verify every Classic widget is reachable and list any that are not.

Tablet: same order, two columns. Mobile (below 768px): world as a short strip (130-180px), then Needs you now, Today, Briefs and scans, prices, Luna, progress; Quick Capture is global (button), bottom bar of 5 (Home, Calendar, Hub, Diary, More).

### The world, details
- Layers: sky gradient, drifting clouds, a floating island with castle, clock tower, sakura tree, observatory dome, small house(s), waterfall, path and bridge, soft light and petals. Places (The Castle, Clock Tower, Sakura Garden, Observatory, Fox Diary, Life Hub) are hotspots with small labels and 44px touch areas, keyboard focusable, same destinations as the rail.
- Crew: existing sprites only. Idle bob; working pose at their place when a desk is running; walking along predefined paths between places when a desk starts or finishes. Use only the live data that already exists (who is at work, level). Pixel sprites scale nearest-neighbour, small, never covering labels.
- Day and night follow Asia/Singapore time (dawn, day, dusk, night with stars, moon, lantern glow, lit windows).
- Weather uses the Open-Meteo reading the Court already fetches for Singapore (clear, cloudy, rain, drizzle): rain streaks and darker clouds when it rains, no new API.
- Growth by level: cosy detail that grows. Level 1 is calm and complete (castle, tree, path, a few clouds, 2 lanterns). Each stage adds code-drawn lanterns, flowers, bridges, small houses, a fountain, animals, with a density cap and no overlap with labels. Use the existing stage thresholds (placeholders, cosmetic only). Missed days remove nothing. Core features are never locked.
- Performance and accessibility: pause when off-screen or the tab is hidden, reduced motion shows a still scene, descriptive labels for the hotspots, nothing essential only inside the picture.

### How to deliver (new rule)
- R1 first, small: put the Briefs and scans cards on the New-look Court right now (row 1 right), and fix Luna's repeated headline. R1 may deploy straight to production with the usual gates and live checks.
- R2: the Living World and the layout above. Visual slices do NOT go to production. Push the branch so Vercel makes a PREVIEW deployment and give her the link.
- For R2, take desktop and mobile screenshots of the preview yourself, compare them with the Classic Cloud Court and the approved styleboard, say honestly what is weaker than the concept art, and fix obvious flaws first (overlaps, oversized boxes, empty areas, unreadable text) before showing her. She approves by saying "ship it"; then merge and deploy with the live checks.
- Protected paths untouched. Classic switch stays. Keep PROGRESS.md and MISSING_ART.md accurate. After each step report in five lines.

## Part 2: Shared design system and all tabs

### Tab roles (her words)
Main Dashboard = Overview. Clock Tower = Time and scheduling. Life Hub = Long-term planning and life management. Sakura Garden = Habits and growth. Fox Diary = Reflection. Observatory = Research and intelligence. Each tab does only its role; never repeat another tab's content (one canonical source per activity).

### Look and feel
Follow the GPT boards for the feel (cream, soft plum, sakura accents, rounded cards, airy), but keep the numbers readable. "Balanced" density: airy feel, key information above the fold on desktop.

Type scale (Playfair Display for H1-H3, Nunito for everything else; Silkscreen only for tiny pixel labels; CJK fallback kept):
- H1 tab title 32/40 (mobile 28/36), weight 700. H2 section 24/32 (mobile 22/30), 600. H3 card title 20/28, 600.
- Body 16/24. Compact body 14/20. Caption and labels 13/18 minimum. Nothing a user must read is smaller than 13px; nothing tappable has text smaller than 14px. Numbers tabular. Line length at most about 72 characters for prose.
- The greeting is one line (16/24 or H3), never a giant card.

Spacing and shape: 4px base, rhythm 8/12/16/24/32/48. Page padding 32 desktop, 24 tablet, 16 mobile. Card padding 20 (24 for large cards), gap between cards 24 desktop / 16 mobile, section gap 32. Radius: cards 16, controls 12, chips 8, overlays 24. 1px soft line borders, shadow 0 4px 20px rgba(42,35,64,.06). Max content width 1440. Controls and tap targets 44px high. Equal-height cards in a row. No double borders, no heavy outlines.

Colour: kit tokens (canvas #FFF8FB, surface #FFFFFF, text #2A2340, secondary #655B78, line #E9DCE8, sakura #F65A9B only for actions and accents, lavender #A78BFA, sky #7DA7FF). Pink is never used as small body text.

Themes: Day (cream) and Night (a proper plum night mode with checked contrast, follows a switch or the Singapore clock). Seasonal themes later, not now.

### Headers on the other tabs
Each of the five tabs opens with a SMALL themed PIXEL SCENE strip, code-drawn in the locked style (about 96-140px high desktop, 72-96 mobile), with the tab name (H1) and a one-line purpose on top of it, and a little gentle motion (reduced-motion respected). Calendar: clock tower on a hill. Garden: see below (the garden IS the header scene, bigger). Diary: cosy library window with the fox asleep. Observatory: telescope and starry window. Life Hub: cosy room with plants and a window onto the kingdom. These are decoration, never covering content.

### Clock Tower (time and scheduling)
Main view: TODAY TIMELINE (hour by hour, Now / Next / Later, all-day events separate), a small month picker, Day / Week / Month toggle available (default Today). Beside it: My tasks (Kumo quick tasks, kept separate from calendar events), Focus timer (25/50/90, can reference a task without creating one), Upcoming events. Every event shows its calendar source and the page shows "last fetched". Read-only iCal: do not imply write sync. Keep existing multi-feed behaviour and Luna's astro calendar handling unchanged.

### Sakura Garden (habits and growth)
The garden itself leads: a larger pixel garden scene (tree growth stages 0-4 with one anchor so no scale jumps, bridge, lanterns, petals, companions) that grows from the existing habit activity. Habit quests sit beside or below it, with the evening check-in expandable. Keep the existing decay and rest-day logic exactly; no punitive wording; no duplicate tracking.

### Fox Diary (reflection), guided
Guided layout: the daily prompts first (one thing that went well, what I am grateful for, free writing), then the writing area. Month calendar and a TEXT-ONLY archive list (no thumbnails, no decorative charts), weekly recap from existing entries, autosave with an honest status ("saving", "saved", "could not save, retry"), privacy note. Entries stay private.

### Observatory (research and intelligence), in this order
1. Today's briefs and scans (Intel, Scan, Movers, Kumo review as cards, with rating/feedback, source and freshness). 2. ONE watchlist with prices (ticker, price, % move, freshness; prices live only here and in the Court prices strip). 3. Luna's 7-day sky (already built, restyle only, never invent interpretations). 4. Macro calendar (releases that move liquidity) and news / Telegram feed. Keep technicals, funding / OI, ingestion and everything that exists today.

### Life Hub (long-term planning and life management)
Four parts: Goals and milestones; Projects (linked to canonical tasks, no duplicate task records); Life admin (dog grooming, self-care, yoga, home reminders); Finance and trading journal (trading goals, thesis log, capital plan; tracking only, never advice). Do not repeat Today, the calendar, the full habit list or the diary.

### Order of delivery
R1 (hotfix, production) -> R2 Court Living World (preview, she says "ship it") -> Clock Tower -> Sakura Garden -> Observatory -> Fox Diary -> Life Hub -> Notifications, Settings, Onboarding, Mobile pass. Calendar and Garden are already deployed in the older style: restyle them to match this spec. Every visual slice goes to a preview link first, with your own desktop and mobile screenshots compared against the spec and honest notes on weaknesses; she says "ship it" to deploy. Protected paths untouched; Classic switch stays; keep PROGRESS.md accurate.

## Part 3: Amendments (override Parts 1 and 2 where they differ)

### GPT boards as the model for headers and information flow
For every tab, follow its moodboard in docs/kumo-redesign/moodboards/ for the header composition and the order information flows down the page (header, then the first row, then the second row), using our code-drawn pixel scenes instead of painted art, and the content rules in this spec instead of the mock-up's fake data and tiny labels. Where a moodboard element does not exist as a feature, show nothing (do not fake it).

### All options selected (include every one)
- Clock Tower: Today timeline; Week grid and Month calendar as switchable views; My tasks + Focus timer; Upcoming events + habits today.
- Sakura Garden: big pixel garden scene; habit quests + check-ins; streaks and garden progress; companions + decorations preview (preview only, no spending).
- Fox Diary: daily prompts + mood check-in; month calendar + text-only entry list; weekly recap; insights and mood chart (from real entries only, never invented; show an empty state until there is data).
- Court extras: Chief Kumo's pick + daily quote; Quick capture; Kingdom progress; Crew roster + weather chip (the roster shows who is on duty and what each desk is doing from existing data).

Keep the Court calm even so: the world, prices strip, row 1 (Today + Needs you now | Briefs and scans), row 2 (Luna, Kingdom progress, Quick capture), then Crew roster, Chief Kumo's pick and the quote as a quiet third row. The weather chip lives in the world.

### Also cover (in this order, after the six tabs)
Notifications (bell dropdown plus grouped inbox: Needs attention / For your information / quiet Kingdom moments, deduplicated, deep links, no fake push); Settings (Look: New / Classic, Day / Night, motion Still / Gentle / Full, export my data in an obvious place); empty, loading, error, stale and offline states on every tab; mobile: bottom bar of 5 (Home, Calendar, Hub, Diary, More) with Garden, Observatory, Settings under More; keyboard, focus rings and contrast checks; Onboarding last (friends only; show only integrations that really work).

## Part 4: Richness and missing moodboard elements

### Missing moodboard elements
If a moodboard shows something that does not exist in the app yet:
- Decorative or presentational (scenery, icons, badges, empty-state art, header scenes, small companions, frames): you MAY build it in code in our pixel style.
- A feature needing data or behaviour (new charts, new trackers, shops, notification types, anything that reads or writes user data): do NOT fake it. Build only if the data already exists; otherwise list it in PROGRESS.md under "FEATURE GAPS" with what it would need, and show a proper empty state. Never show invented numbers.

### Richer illustrations (the old Court felt too plain to her)
The world and the tab header scenes must feel rich and cosy, not sparse. All code-drawn in the locked pixel style (plum outline #4a2538, 32x32 crew, blush cheeks, one gold accent per character), using Canvas or layered SVG for performance.
- Depth: at least 5 parallax layers (far sky and mountains, clouds, mid hills and the floating island, buildings, foreground foliage and petals) with slow different drift speeds.
- Detail: many small distinct elements, not a few big ones: layered rooftops with lit windows, chimneys with drifting smoke, banners and flags in wind, lantern strings, stepping stones, flower beds, mushrooms, stone walls, small gardens, a waterfall with animated spray, a stream with sparkles, a bridge, a koi pond, a windmill or tea house.
- Life: butterflies, birds crossing the sky, fireflies at dusk, falling petals and leaves, cats or small animals, tiny villagers, flickering lanterns, twinkling stars, a moon that moves slowly, wind in the trees. Crew sprites walk and work.
- Light: sky gradients per time of day, warm window glow at night, soft rim light on buildings, subtle god-rays at dawn and dusk, rain and puddles when it rains, fog.
- Variety through the day and weeks: small seasonal touches (petals in spring colours, fireflies in warm months), and rare delighters (a shooting star, a rainbow after rain, a lantern festival on a streak milestone). Cosmetic only.
- Growth: level 1 is already complete and pretty; each stage adds a clearly visible new area (a second island, bridge, tea house, observatory lights, fountain) so the world looks noticeably richer as she levels up. Density cap so labels and hotspots stay readable.
- Budget: still 60fps on a mid laptop and a phone, pause off-screen and in hidden tabs, still image under reduced motion, total scene code and assets small. If the full scene is too heavy, pre-render static layers to canvas once and animate only the small moving parts.
- Review loop: build the scene in layers, screenshot at desktop and mobile after each layer, compare with the old Cloud Court and concept image 26 (composition only), and keep adding detail until the scene is clearly richer than the old Cloud Court. Be honest in the report about what is still plainer than the concept art.
- Tab header strips (Calendar, Garden, Diary, Observatory, Life Hub) get the same care at smaller size: 3 to 4 layers, 5 to 10 small details, one or two moving things.
