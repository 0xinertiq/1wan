# 1(WAN) New look: the one spec (Court, all tabs, all decisions)

Consolidated on 28 Oct 2026 from every Court prompt (R1 to round 5). This file is the single source; earlier prompts are superseded, and the contradictions between them, with the rule that won, are listed in PROGRESS.md. From now on changes are small edits here. Classic (the v52 look, one click in Settings) is out of scope and stays as it is.

## Where each thing lives (one canonical home per item)

| Item | Home | Elsewhere (summary or link only) |
|---|---|---|
| Today's briefs, full text (Pulse, Intelligence, Crypto scan) | Court, Briefs card | News: the same briefs in the history list |
| Brief history (all desks, by date), Kumo's reviews once read | News, Briefs and scans | |
| Kumo's weekly review, unread | Court rail ("New weekly review", Mark as read) | News tab dot until read |
| Headlines feed (Pip), categories, "In today's top 5" tags | News | |
| Midday movers | Trades (left) | |
| Live prices | Court prices strip (one line) | Trades: Live watchlist |
| Live watchlist (price, day change, 1-month range), technicals | Trades (left), labelled Live | Court Briefs: "Open in Trades" from the dated scan |
| Full Crypto scan (style map, trade plan, catalysts, gaps) | News, brief history (full text) | Court Briefs: snapshot, read-through, Movers, "Strongest now" (top 3 by score); Trades will later host the Style Map, Trade Plan and Catalysts (not built yet) |
| Trade log and tools | Trades (right) | |
| Liquidity releases (FOMC, NFP, CPI, PPI, PCE, GDP, ECB, BoJ, BoE, refunding) | Calendar, Economic calendar ("Moves liquidity" default, "All releases" toggle) | Court: one "Next:" line within 48h; Week tab: small tags |
| Calendar events (day, week, month views) | Calendar | Court Today: Now / Next / Later; Week tab: top 3 a day |
| Momo's day ideas | Calendar (left) | |
| The next 7 days at a glance | Court, Today card, Week tab | |
| Due bills, bookings, life admin, with the Auto-paid and Important toggles | Life Hub, Life admin (every item) | Needs you now when overdue, due within 3 days or marked Important (never auto-paid); Week tab rows |
| Parked thoughts (Park a thought) | Court: the one-line input under the world; the list under Today's stat strip | |
| Luna's daily reading | Court, Luna's card | Week tab: Moon sign and tone tag |
| Luna's 7-day sky, astro calendar text with attribution | Observatory | |
| Habits, daily anchors, branches, quests | Sakura Garden | Today stat strip: counts only |
| Kumo's pick | Sakura Garden (top) | |
| Journal (private, exportable, Inter) | Dungeon | |
| Focus sprint (tap to pause and resume, small stop) | World, the hourglass in the HUD | |
| Quote of the day (always in full) | World, Kumo's glass cloud bubble, or under the strip when no spot in the scene is free | |
| Date and time (one pixel badge), level, EXP, streak, stars, rest day | Header | World HUD: level chip |
| Tails (0 to 9, read-only) | World, the fox and his card | Classic: header chip |
| Weather | World HUD chip | |
| Crew at work | World (crew at their places), roster line under the columns | World HUD: "n at work" chip |
| Settings, Look switch, Export my data | Header menu | |

## Global rules
- One canonical home per item; other places show a summary and link. The app tracks, never advises. No Bigdata wording in the UI: every brief, review, desk note and sources line is shown through one display scrubber (lib/noBigdata.ts); stored data and the ingest / export routes are untouched. Protected paths and the tails, XP, stars and streak logic are never changed.
- Visual slices go to the preview first; production only after she says "ship it".
- No single-column pages that need long scrolling: grids, two columns, segmented controls. When a section is crowded, reduce (fewer items, "+n more", collapsed details) rather than shrink. No section scrolls sideways (the phone prices strip may).

## Design system (tokens: `apps/web/src/app/(court)/kumo-tokens.css`)
- One token set: palette, day and night semantic colours, spacing 4/8/12/16/24/32/48, radii (chip 8, control 12, card 16, modal 24, pill), borders 1-2px, shadows, type scale, link and focus. The v52 variables are remapped to the tokens under the New look so leaked Classic rules match. `tests/tokens.test.mjs` fails on raw colours, off-scale spacing or radii, fonts outside the set, and contrast below the minimums (text 4.5:1, brief body 7:1, nav labels 4.5:1, icons 3:1, world HUD over the real sky 4.5:1).
- Fonts (locked): Playfair Display headings, Nunito body, Inter only for journal writing, Silkscreen only for tiny labels, Noto Serif SC / Ma Shan Zheng only as the CJK fallback. Classic keeps Baloo 2, Atkinson and Quicksand.
- Day (the old dashboard's look): blush page #FFE8F1, panels #FFF8FB and #FFEDF4, dim panels #FFE2EE, lavender title bars (#CDBFFB to #B3A2F4) on card headers, plum text #5A2745, secondary #86506C, plum-pink outline #A34876 (2px on cards), dashed blush dividers #EBA9C6, pastel chips (mint, lavender, peach, butter, pink, sky). No plain white panel.
- Night: deep plum with the same structure (panels #2A2340 / #30294A, text #ECE8F5, secondary #BDB4D6, dark lavender title bars). Every icon has a night variant: light fill #ECE8F5, lavender outline #B9A6FF or a soft glow; the active tab in sakura with a highlight pill.
- Links: one colour everywhere, deep sakura (#AD1457 day, #F7A8CC night), underlined, same hover and visited. No blue anywhere (focus ring, selection, accent-color, scrollbars are sakura and plum).
- One card, row, chip, button, input and heading style; one column gap (24px desktop, 16px phone); 44px tap targets; visible focus rings; reduced motion respected.
- Dates and times: one formatter (lib/court/time.ts) for every date and time in the app: 24-hour Singapore time with a leading zero and "SGT"; "Today 05:40 SGT" for today, otherwise "27 Oct 07:45 SGT"; weekdays as three letters with the date ("Thu 29 Oct"); ages after a middle dot ("· 3h ago"). Timestamps are small pixel labels (Silkscreen, 12px, tabular); running text stays in Nunito. tests/tokens.test.mjs fails if a component formats a date or time by hand.
- Brief reading sizes: body 18px (line height 1.65), lead lines 17px, section titles 22px, uppercase section labels and source links 13px; the same in the Briefs card, News and Kumo's review. Brief body stays 7:1 or better in night mode.
- Sources: under each item only the source names as small links joined by a middle dot ("TechCrunch · DealStreetAsia"), deep sakura and underlined, no label, no pills; nothing when an item has none. The Bigdata scrubber runs on every sources line.

## Header
One pixel date-and-time badge ("WED 28 OCT · 10:12 SGT": the pixel clock with its gold hand, Silkscreen, stepped corners, plum outline (lavender at night), blinking colon, still under reduced motion), then the Queen's progress (level badge, EXP bar), streak, stars, menu. On a rest day one small line under the badge: "Rest day, streak protected". No tails chip in the New look. Classic keeps its clock chip.

## Court (desktop)
1. The world (below).
2. "Park a thought": one line, the only entry point on the Court.
3. Prices strip: one line (BTC, SOL, the scan's tickers, "as of" time); extra tickers become "+n" or scroll sideways on the phone.
4. "Next: FOMC decision Thu 02:00 SGT, in 16h": the next liquidity release within 48 hours; hidden when there is none.
5. Two columns. Left 2/3: Briefs. Right 1/3, in order: Needs you now (only when something waits), Today (Today | Week), Luna's card, Kumo's weekly review (only while unread).
6. Crew roster: one wrapping line under the columns.
Phone: the world strip, Park a thought, Needs you now, Today, Briefs, Luna, review, prices, roster; bottom bar Home, Calendar, Hub, Dungeon, More.

### Briefs card (the old dashboard's full brief style)
Header "Briefs", small right label "Your scheduled tasks". Pill tabs Pulse | Intelligence | Crypto scan. Each tab: title, date and age; the summary as a soft pink callout; then the whole stored brief (uppercase small section labels, dashed dividers, bold-lead items with detail, tables, quotes) and under each item only its source names as small links ("A · B", no label, no chips, no "— A, B" tail). Intelligence: Top 5 headlines as a numbered list of five items (bold headline, why it matters, sources), then the other sections as the brief gives them. Crypto scan: only the snapshot label ("Snapshot · Scan hh:mm SGT"), the read-through callout, Movers and one line "Strongest now" (the top 3 coins by score from the Style Map: ticker, score, bucket), with "Open in Trades →". The style map, trade plan, watch line, alerts, thesis log, catalysts and gaps stay in News (full text); later the Trades tab will host the Style Map, Trade Plan and Catalysts. Pulse: deals, shifts, social listening, content radar. Show more / Show less. Under it: Useful / Needs work, the one-line change box, and a collapsible "What this desk has learned" (her agent memory, read-only). Full column width.

### Today | Week
- Today: Now / Next / Later from the calendar, the stat strip (Due soon as a count, Streak, Habits this week, Yesterday), parked thoughts with Done. No Luna, weather, focus sprint or macro events.
- Week: the next 7 days, two compact lines each (day and date, today highlighted; Moon sign and tone tag such as "Gem · easy"; liquidity tags; events with start times, top 3 then "+n more"; due life items). A day opens the Calendar. One line: "Week at a glance: easiest day, most friction". No habits.

### Luna's card
Luna's sprite and "Luna · the stars align for you"; chips (Moon sign, element, phase, tone, any retrograde); one summary; the next Moon sign change in SGT; "The day leans toward" and "Be gentle with" as two slim stacked strips (bold label left, phrases joined by dots; lavender then sakura; dark tints at night); "Today in your chart" small and quiet (13px, secondary); a care callout when needed; self-care for today (4-5 bullets). From the v52 sky table and logic (lib/court/luna.ts, table to 7 Jan 2027); the astro calendar only adds Luna's own phrases. No green or red, no advice.

### Needs you now
First in the right column. Only (a) life admin, reminders and bookings due today, overdue, within 3 days or marked Important, and calendar bookings starting within 2 hours; (b) agents waiting on her (today's briefs to rate, as one line). Items marked Auto-paid stay hidden (until she sets the toggle, GIRO, auto-deducted tax and subscriptions count as auto-paid). No macro releases, habits or price alerts. At most 3, then "+n more". Same day or same time items share one card with one Seen; left-aligned with time in SGT and "in n min". One button style on every row (same height and width pattern, right-aligned, 44px). When nothing waits the card animates away and leaves no space; it returns when something is due.

### The world
Code-drawn pixel kingdom, chibi storybook style: pastel sky by Singapore time, big soft moon at dusk and night, faceted floating island with roots and crystals, gnarled sakura, waterfall pool, castle, clock tower with real SGT time, ribbed observatory, timber Life Hub cottage, pagoda, mossy Dungeon gate, picnic, goose, hearts, square petals. Weather from Open-Meteo. Growth by level (cosmetic, density cap).
- Layout (components/kumo/world/layout.ts, checked by tests/world-layout.test.mjs): a HUD band across the top holds the focus hourglass, the greeting (no date) and three chips (level, at work, weather); the whole island is fitted snugly below it with no cut-off spires. Place labels sit above their buildings, never in the HUD and never under the crew; on the phone strip there are no place hotspots (the bottom bar goes to the same places).
- HUD and labels are glass chosen by the scene (cream with plum text over a light scene, plum with light text over dusk and night), so they read whatever the interface theme is.
- Crew about 15% of the scene height (20% on the phone), standing on the ground in front, idle bob and working poses. Kumo stands on his own cloud right of the castle; his quote is always shown in full (no clamp, no tap to expand) in a clear glass cloud (about 40% cream by day, 45% lavender at night, 1px plum outline, up to about 320px wide and as tall as it needs), in the first free spot (rising from Kumo, the top-right sky, beside the castle label) or under the strip when none is free.
- The fox (crew/fox.md v2): an original chibi kitsune on the crew's pixel grid and scale (about 15% of the scene height), plump fanned tails from the tails value (read-only), a squash-and-stretch hop every 16 s, naps, a happy bounce, a tail wag, a tails card; only on perches clear of labels, the HUD and the bubble.
- Performance: pause off-screen and in hidden tabs; reduced motion shows a still scene.

## Tabs
- Calendar: left, the Economic calendar (Moves liquidity | All releases) and Momo's day; right, the calendar with Day / Week / Month views. Every event shows its source and the page shows "last fetched"; read-only iCal.
- Trades: left, the Live watchlist (price, day change, 1-month range bar), Midday movers (latest alert or "No movers today (checked 14:30)" with the age of the last real alert) and the Live technicals; right, the trade log and tools (unchanged behaviour). Tracking only.
- News: left, Briefs and scans (full text by desk with history, Expand all, uniform items, Kumo reviews with Mark as read); right, the Headlines feed with categories by content (a crypto headline files under Crypto whatever feed carried it) and "In today's top 5" tags.
- Observatory: Luna's 7-day sky and the astro calendar text with its attribution.
- Sakura Garden: two columns: scene, tree and summary left (sticky); Daily anchors | Branches | Quests right. Decay and rest-day logic unchanged.
- Dungeon (was Fox Diary; internal ids unchanged): guided prompts, writing in Inter, month calendar, text-only archive, weekly recap; private, never shown to friends, exportable.
- Life Hub: goals, projects, life admin (every item, including auto-paid ones), finance and trading journal (tracking only).
- Settings, notifications, onboarding: later slices, same tokens.
