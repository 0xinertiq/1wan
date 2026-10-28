# Kumo aesthetic overhaul: progress

Branch: `kumo/aesthetic-overhaul`. Design package lives in `docs/` (not `docs/kumo-redesign/`): `docs/design_implementation_kit_v1/`, `docs/moodboards/`, `docs/existing_asset_pack_v1/`, `docs/KUMO_*.md`.

| Slice | Status | Commit | Notes |
|---|---|---|---|
| Preflight | done | 01a4622 baseline | tsc OK, 29/29 tests, build OK. Backup: newest export is 2026-10-16 (old dashboard). Needs a fresh Export my data before deploy. |
| A. Foundation | done, live | fc0d74b | Playfair Display + Nunito, kit tokens, day palette, cards/buttons/chips/inputs/tabs. New is default; Classic switch in Settings. Night keeps the v52 palette for now. |
| B. Primitives + nav | done, live | 40e3127 | Nav bar and rail restyled (still 5 tabs), empty states, 44px touch targets. Docs task (prompts) shipped with this deploy. |
| C. Court home | done, live | 98b4557 | New look only: kingdom banner (asset-pack layers 01-07, Kumo sprite), Today Now/Next/Later from the calendar, Luna's astro weather card (existing feed + Luna's calculation, quoted, no invented guidance), Quick capture (same list as Park a thought). All older windows remain below. |
| C2. Court cleanup | done, live | 17cafae | One Today card (Now/Next/Later, glance row, rest under More), one Luna forecast card (Do/Don't only when the calendar text has them) with Full sky on a new Observatory page (#observatory, not in the nav), Court scene softened and compacted under Kingdom progress (it shows level-ups), banner reframed with fox and Prototype art label, 12-column row with 24px gaps and equal heights, everything else under More on your court, 14px type floor. Classic keeps the v52 layout exactly. |
| C2b. Painted banners | done, live | 079dc78 | Court and Observatory banners now use prototype crops from concept images 33 and 24 (WebP, desktop + phone, 207 KB total). Painted mock UI is covered by real overlays (greeting, room chips, live level, date, Luna's moon line). Petals and cloud drift on top, off under reduced motion. Pixel fox hidden on the Court banner (painted fox there). |
| C2c. Living Kingdom card | done, live (to be replaced by the pixel Living World in R2, per COURT_SPEC.md) | d268b36 | New look: Cloud Court replaced by the Living Kingdom card (concept 26 Starter/Growing crops). Places link to Calendar, Garden, Observatory, Diary, Life; crew at work as sprites at their places (same duty rules); BTC and SOL in the bubble; level-up banner moved with it. Stage from level, read-only. Night after 19:00 SGT. Classic keeps the Cloud Court. Kingdom Mode page is slice F. |
| R1. Briefs and scans on the Court | done, live | d3cf4b6 | COURT_SPEC.md is now the single source for the Court. Row 1: Today + Needs you now (left) and Briefs and scans (right: Intel, Scan, Movers, Kumo review cards with first lines, Open, sources and the same feedback). Row 2: Luna, Kingdom progress, Quick capture. Luna headline shown once (moon and sign). |
| Fonts (Part 6 as amended) | done, on preview | 82c559b | Nunito for inputs and selects (Quicksand override replaced, New look only), tabular numbers, Inter only for diary writing and entries. |
| R2. Living World (pixel) | on PREVIEW, waiting for "ship it" | b02784e, then R2b | Code-drawn world (sky per SGT time, mountains, cloud bank, distant islets, island with castle, clock tower showing real SGT time, observatory, sakura tree, two cottages, pond, stream, bridge, waterfall, walls, bushes, flowers, lanterns, villagers, cat, balloon, birds, petals, fireflies, rain), growth by level, crew walk to their place when their desk ran today. Prices strip, row 1 / row 2 / quiet row 3 (crew roster, Kumo's pick, quote), phone order and Quick capture button. Painted Court crops removed. |
| D. Luna Astro Weather | done, live | e307f85 | Already existed (astro feed + Luna's calculation): restyled only. New look: moonlit banner (pack layers recoloured, code-drawn moon and stars, labelled prototype), 7 day folds in SGT with quoted text, source line, and Luna's calculated events kept apart. Decoration system started (decor/, one file per item). |
| E1. Calendar | done, live | 5999543 | CSS only: segmented view switch, soft day cells, pink today, gold picked day, event pills, rounded rows. |
| E2. Sakura Garden | done, live (shipped before the stop arrived) | ad7c663 | New look: garden scene (pack backdrop + pixel lantern, flowers, mushroom), eight branch trees at stage 0-4 from the same blossom count as the bonsai (read-only). Garden logic untouched. |
| E. Pages (rest) | todo | | Diary, Life Hub, Notifications, Settings, Onboarding |
| F. Kingdom preview | todo | | |
| G. Mobile + a11y | todo | | |

## NEEDS OWNER APPROVAL
- Kingdom stage thresholds (placeholders from UNLOCKS_AND_PROGRESS.md): Starter level 1, Growing from level 2, Expanding 5, Thriving 7, Your Own 10. Cosmetic only, read-only from her level. Change in `apps/web/src/components/kumo/kingdom.ts` (STAGES).
- Art folder path: DECISIONS.md section 5 says `kumo-art-source\original_concept_references`; the real path has one more level, `kumo-art-source\Kumo_Complete_Visual_Reference_V2\original_concept_references`.

## Classic widgets on the New-look Court (reachability check, R1)
Weather line, Today (all of it, under its More), Needs you now, Kingdom progress (status), Luna (forecast on Court, full sky on the Observatory page), Briefs (cards; the old brief tabs also under More on your court), Watchlist scan with prices (cards; full window under More), Technicals, This week, Week ahead, Economic calendar, News (all under More on your court), Status line (under the banner), Cloud Court (replaced by the Living Kingdom card; the pixel world in R2). Nothing unreachable.

## Not done yet in R2 (honest list)
- Phone bottom bar of 5 (Home, Calendar, Hub, Diary, More): left for the mobile pass; the current five tabs stay.
- Rare delighters (rainbow after rain, lantern festival on a streak milestone), seasonal touches, fog: not built.
- Crew walk in straight lines (no path graph yet); Kumo stays at the gate.
- Night mode colour pass with contrast check: not done (night keeps the v52 colours).
- Screenshots: taken of the world on its own (desktop 620x240 at 2x, phone strip) in headless Chrome; the full Court page could not be screenshot because the preview needs your Vercel and app login.

## R2b (owner's preview feedback, on preview)
Crew sprites 8.5% of the world height (15% on the phone strip), off-duty crew stay inside the castle; glass place labels (60%, blur, solid on hover/focus, 44px hit area); quote of the day as Kumo's speech bubble (tap to expand), below him over the clouds; prices strip is one line that scrolls sideways; desktop under the strip: Briefs and scans 2/3 left, rail 1/3 right (Today, Needs you now, Luna, Quick capture), old row 2 and the progress card removed; crew roster as one line; level, EXP bar, habits this week and save state in the header after the clock (New look only; Classic keeps its status card); Luna card shows the transit lines small, then DOs and DON'Ts exactly as the astro calendar writes them ("✅ DO:" / "🚫 DON'T:" lines; UTC times shown in SGT), a small "astro calendar" tag and Read more; the "Applies all day, wherever you are" line is dropped. Kumo's pick moved back inside the Today card's More.

## R3 (owner's round 3, on preview)
Done: enchanted pixel restyle of the world (no grey; see COURT_SPEC Part 7), cloud speech bubble with the quote only (below the strip on the phone), one-line Quick capture under the world, one-line prices, Briefs block (Intel | Scan) with Top 5 and Today's plan, rail (Today, Needs you now, Kumo's weekly review, Luna), roster wraps without sideways scroll, Luna card fixes, Bigdata wording removed from Sources lines, new Trades and News tabs, merged Week ahead, phone bar with More.

Where each "More on your court" widget went:
- Technicals: Trades (left).
- Watchlist scan with prices: Trades (left).
- Midday movers: Trades (left), as its own card (latest alert or "No movers today (checked HH:MM)" and the age of the last real alert).
- Brief tabs: replaced by News, Briefs and scans (full text of every brief, newest first, history by desk and date).
- Headlines (news feed): News (right), with "In today's top 5" tags.
- This week + Week ahead: merged into one Week ahead card on Calendar (left).
- Economic calendar: Calendar (left).
- Trade log and trade tools: Trades (right); the Life tab no longer shows Trade in the New look ("write a thesis" opens Trades). Classic unchanged.
- Weather line: removed from the Today card; the world's weather badge shows it.
- Kumo's pick: inside the Today card's "More".

Open questions (NEEDS OWNER INPUT):
- Brief formats: I could not read the real briefs (reading production data was blocked), so Top 5, Today's plan, the no-movers note and the review summary are read by tolerant rules and tested on made-up text. If a card looks wrong on the preview, send me the headings of that brief, or allow a read-only check of the briefs table.
- Observatory is now thin (only Luna's 7-day sky). Proposal: keep it as "Sky" inside News, or as a tab inside Calendar. Nothing deleted until you choose.

## R4 (owner's round 4, on preview)
Done: Luna card order (energy, transits, DOs, DON'Ts; no Read more; extra text only on the Observatory with the attribution); Kumo's weekly review moved below Luna; Today card = Now / Next / Later + stat strip + parked thoughts; Quick capture renamed Park a thought (same list, confirmed: both write to the same "dump" list), one line under the world, floating button and old card removed; Coming up card on the Court with auto-paid and subscriptions hidden (Court only); focus sprint hourglass in the world; Fox Diary renamed Dungeon with a new icon and an enchanted gate in the world.

Where the old Today window's parts went (New look):
- Brief | Sky | Week tabs: removed from the Court (calendar day lives in Calendar, Luna in her card, the week in Calendar's Week ahead).
- Momo's day (timeline and free-time ideas): Calendar tab, left column, under Week ahead.
- Kumo's pick: Sakura Garden tab, at the top.
- Return recap ("Last time was..."): top of the Today card, only on the day it applies.
- Focus sprint: the hourglass in the world.
- Park a thought: the line under the world; parked thoughts in the Today card.
- Quote of the day: Kumo's cloud bubble.

NEEDS OWNER APPROVAL:
- An "auto-paid / hide on Court" flag for life items. Until then the Court hides bills and money items whose name or note mentions GIRO, auto pay or deduct, instalment, income tax, property tax, subscription, Spotify, Claude, Netflix, iCloud, Google One, YouTube, Disney or Apple One/Music/TV. Adding the flag would change the saved state shape, so it waits for you.
- Focus sprint pause: the existing sprint has Start and Stop only. A pause would need a new saved field, so the hourglass offers Stop for now.
- "Marked important" for Coming up: there is no such field today; it would need the same kind of flag.

## R5 (full Court update + art direction, on preview)
Done:
- World redrawn to the art direction (COURT_SPEC Part 9): pastel sky, big moon, faceted island with roots and crystals, gnarled sakura, waterfall pool, castle, clock tower, observatory, Life Hub cottage, pagoda, Dungeon gate, picnic, goose, hearts, square petals. Zoomed framing: island about 88% of the width.
- The fox: new pixel kitsune with fanned tails from the existing tails value (read-only), hops between perches, naps on roofs, jumps with hearts when XP rises, tap card with each tail and progress to the next. Tails chip removed from the New-look header (Classic keeps it). `crew/fox.md` added.
- Greeting as plain text (no chip, no date); quote bubble about 60% opaque with blur, rising from Kumo on his own cloud.
- Header: date left of the clock, rest-day line under it.
- Rail: Today, Luna, Needs you now, Coming up, Kumo's weekly review.
- Luna's card ported from v52 (renderLuna, explain, lean and ease lists, lunaCare) with the v52 sky table (`lib/court/astroTable.json`, `lib/court/luna.ts`). The calendar's DO / DON'T text only adds Luna's own fixed phrases by keyword. Rule-based.
- Needs you now redesigned; releases at the same time grouped (one Seen per card, stable across minutes). The calendar has forecast and previous only; no actuals, so none are shown.
- Briefs contrast fixed (below) and one reading layout.
- Garden (New look): two columns, Daily anchors | Branches | Quests.
- Fox Diary: no user-facing mentions left in the app; `docs/status.md` and `docs/build-dashboard-v2.md` now say Dungeon (was Fox Diary). Your handoff docs are left as you wrote them.

Contrast fixes (night): the "From this brief" / "Top 5 headlines" / "Today's plan" panel was #F0EAFF behind #ECE8F5 text (about 1.1:1); now #2A2340 behind #ECE8F5 (about 12:1), secondary #BDB4D6 (about 7.5:1), links #B9A6FF (about 6.9:1). Plan table zebra rows were 50% white at night; now 5%. Day: cream #FFFDF8 panel with #2A2340 text (about 15:1).

Already in place from R3/R4 (checked, unchanged): Park a thought is the old Quick capture (same "dump" list, one entry point); one-line prices; Briefs Intel | Scan with Top 5 and Today's plan; Trades; News with Expand all, sticky zebra tables that stack on the phone and "In today's top 5" tags; Calendar's merged Week ahead and Economic calendar; Coming up hides auto-paid and subscriptions on the Court only; roster wraps; "More on your court" removed (where each widget went: R3 above).

Honest notes (weaker than the direction):
- Screenshots: the scene (day, dusk, night), the phone strip and the fox were rendered and checked in headless Chrome. The full Court page could not be screenshot: the preview and the local app need your login, and I do not use your password or browser session.
- The fox's tails are small spiky plumes; at nine tails they crowd. Fluffier layered tails need a bigger sprite.
- On the phone strip (168px) buildings are small; places there are 44px hotspots without text, as before.
- Hearts and the fox's jump fire on any XP gain (the closest existing signal for a logged habit or trade).
- Luna's sky table ends on 7 Jan 2027 (as in v52); after that the card says the day is not covered. Extending it is a code task with lib/sky.ts (no AI).
- Cloud faces are only a few pixels.

NEEDS OWNER APPROVAL (new): an AI rewrite of the astro calendar text in Luna's voice would need a paid call; for now Luna only adds her own fixed phrases by keyword. (The three items above still stand.)

## R6 (on preview)
Done:
- World fits snugly: the whole island, towers, spires and the rock underside sit inside the scene with an even margin (no cut-off tops, island fills the width). Drawn crisp at a whole-number scale, then fitted. Phone strip 196px.
- Crew about 15% of the scene height (20% on the phone strip), on the ground in front of the buildings; Kumo on his cloud slightly smaller; fox about 10%.
- Quote bubble: clear glass cloud with token colours. The brown look came from solid plum outline circles showing through the translucent fill; the outline is now a 1px ring cut out with a mask.
- Fox: hops every 16 seconds instead of 7, each hop 1.8 seconds instead of 0.9 (half the speed), gentler easing; still under reduced motion.
- Briefs: full card width. Top 5 fixed (below). Sources show only as link chips. Every block of an Intel brief in News uses the same item layout.
- Luna: lean / gentle as two side-by-side soft blocks (lavender, sakura, plum text); "Today in your chart" small and quiet below them.
- Links: one sakura colour everywhere, underlined, same hover and visited; pink focus ring, selection, form accent and scrollbars.
- Weekly review: on the Court only while unread, with Mark as read; summary once, then desk lines and suggestions with Show more / Show less; a dot on News marks a new review.

Top 5 headlines, what was wrong: I read the stored brief (28 Oct, 07:53 SGT, read-only). Its "## Top 5 headlines" block has five items, written as paragraphs ("**headline.** why — [Source](url), [Source](url)"), not as list items. The old parser only looked for list items, found none, and fell back to "first line of each section", so the Court showed four items labelled with the section names, the first being "Top 5 headlines". The parser now reads paragraph items: on the real brief it returns all five, with the bold headline as the title and no source text in the why. No prompt change needed. Older briefs (no Top 5 block) show one line per section with the section name as a small label.

Weekly review read state: kept on this device (localStorage), no saved state change. If you want it synced across devices, it needs a new field in your saved state: NEEDS OWNER APPROVAL.

Consistency pass, causes found:
1. kumo-new.css grew round by round (A, C2, R2, R2b, R3, R4, R5): each round added a block that overrode earlier ones, often with !important (18), so the same element had up to three competing rules.
2. Raw values everywhere: 79 hex and 49 rgba colours, and spacing spread over 2, 3, 6, 9, 10, 14, 18, 20 and 22px next to the 4/8/12/16/24 scale.
3. No single token set: kumo-new.css had its own --kumo-* values, tokens.css pointed at the v52 variables, and night mode kept the Classic v52 palette.
4. Classic leaks: dashboard.css (75 KB, v52) still styles cards that render in the New look (.tcard, .gk, .gs, .jp, .jt, .lp, .quest, details.gdet) with 2-3px lavender borders and hard drop shadows; only some were overridden.
5. Links had three colours (#6A4FC9, #B9A6FF, browser default) and the focus ring was lavender.

What changed:
- One token file, `src/app/(court)/kumo-tokens.css`: palette, day and night semantic tokens (a proper plum night), spacing, radii, border, shadows, type, link and focus. The v52 variables are remapped to these tokens under the New look, so leaked Classic rules take the same colours.
- Replaced in kumo-new.css: 45 hex and 43 rgba colours (another 34 hex and 6 rgba moved into the token file), 214 spacing values snapped to the scale tokens, 18 radii to radius tokens, 7 lavender focus rings and 1 input focus, 9 blue or lavender link colours. Night override blocks no longer needed were removed (17 lines).
- Components: chart colours (TechLive, 9 values), the calendar dot, the sprint ring and two header icons moved to tokens. Pixel art and illustrations keep their own colours (sprites, world, fox, bonsai, header and nav icons, Classic Cloud Court).
- One card, inner row, chip, button, input and heading style, and one column gap (24px desktop, 16px phone), applied to New-look cards and to the Classic card classes that show in the New look.
- `tests/tokens.test.mjs` (runs with the tests): fails on raw colours in kumo-new.css or New-look components, and on off-scale spacing or radii in kumo-new.css.

Left to do (honest):
- I could not visit the tabs in a browser: the preview and the local app need your login. The pass was done in code; please look at Calendar, Life Hub, Dungeon and Settings on the preview, as they still rely most on Classic markup.
- dashboard.css itself (Classic) still has many raw values; it is out of scope while the Classic switch stays. Some of its 2px borders on less common elements may still show in the New look.
- Font sizes are tokenised in the new rules but not yet everywhere in kumo-new.css.
- Underside facets of the island read a little stripy; the fox's tails still crowd at nine.

## Round 5 of the owner's prompts (R7, on preview)
COURT_SPEC.md is now one consolidated spec with a "where each thing lives" map at the top.

Contradictions between earlier prompts, and the rule that won:
1. Body font: Inter (DECISIONS section 4, kit) vs Nunito (owner, 27 Oct). Nunito; Inter only for journal writing.
2. Night mode: "keep the v52 night palette" (Part 2, DECISIONS) vs a proper plum night. Plum night through tokens.
3. Day colours: kit cream and white surfaces (Part 2) vs blush panels, lavender title bars, no white panel (round 5). Blush.
4. Card headers: Luna's "1px line, no gradient header" (R3, R4) vs lavender title bars on every card (round 5). Title bars, with plum text (contrast checked).
5. Borders: "1px soft line, no heavy outlines" (Part 2) vs "plum-pink outline 1-2px" (round 5). 2px plum-pink outline on cards, dashed blush dividers inside.
6. World framing: zoomed and cropped (R5) vs snug, nothing cut off (R6). Snug, now below a HUD band.
7. Crew size: 7-9%, 8.5%, 8-10% vs 15%. 15% (20% on the phone strip).
8. Quote bubble: white chip, then 55-65% cloud, then 35-45% glass. Glass.
9. Briefs on the Court: cards (R1), then summaries with full text only in News (R3), then the full briefs in a three-tab card (round 5). Full briefs on the Court; News keeps the history.
10. Sources: chips (R6) vs one small text line (round 5). Text line.
11. Today card: Brief | Sky | Week tabs removed (R4) vs Today | Week tabs (round 5). Today | Week.
12. Week ahead card on Calendar (R3) vs the Week tab on the Court (round 5). Week tab; the Calendar card is gone.
13. Coming up card on the Court (R4) vs due items in Needs within 3 days (round 5). Coming up removed from the Court.
14. Needs you now: macro releases grouped into cards (R5) vs no macro releases (round 5). No macro releases; they live in the Calendar and the "Next:" line.
15. Luna's card: the calendar's DOs and DON'Ts word for word (R4), then the v52 port (R5), then side-by-side blocks (R6), then stacked strips (round 5). Stacked strips on the v52 port.
16. Midday movers: on the Court (R1) vs Trades only (R3, round 5). Trades only.
17. Link colour: about #C2185B requested; #C2185B is 4.39:1 on the pink tint, so the same hue one step darker, #AD1457, is used (5.1:1 or better everywhere). Night #F7A8CC as asked.
18. World places tappable on every width (Part 1) vs 44px tap targets (Part 2). On the phone strip six 44px targets cannot sit apart, so the strip has none; the bottom bar goes to the same places.
19. Rail order changed four times. Final: Today | Week, Luna, Needs you now, Kumo's review while unread.
20. Observatory: "briefs and scans first" (Part 2) vs Luna's sky only (R3). Luna's sky only.

Done:
- Tokens: blush day palette, plum night, font tokens, icon tokens (light fill and outline or glow at night, sakura active pill), HUD glass. The check now also fails on fonts outside the set and on contrast below the minimums for text, secondary text, links, title bars, chips, nav labels, icons (3:1) and the world HUD over the real sky colours (day and night, both themes).
- World: HUD band (focus hourglass, greeting with a glass backing, level, at work, weather); island fitted below it; labels, crew, Kumo, bubble and fox placed by one layout. tests/world-layout.test.mjs checks phone, tablet, desktop and wide, day and night, every crew member out, short and long quotes: no overlaps. HUD and labels are glass by the scene (Singapore time), so a day world under the night theme and a night world under the day theme both read.
- Court: "Next:" liquidity line; Briefs card with Pulse | Intelligence | Crypto scan and the full brief in the old style; Today | Week; Luna strips; Needs you now rules; review only while unread. Negative margins between Court sections removed (5), so sections cannot overlap.
- Liquidity: why the FOMC alert was missing. The release is in the data (Wed 28 Oct 14:00 New York = Thu 02:00 SGT; the feed also lists the statement and press conference). The "Releases that move liquidity (Olli)" list and the "Memes" category you saw are not in this app's code (branch, main or the v52 reference); they come from the old claude.ai dashboard. Here the Economic calendar now defaults to the whitelist (lib/liquidity.ts), 48 hours ahead for the Court line, high impact only, same-moment releases grouped.
- News: headlines are filed by content (crypto words file under Crypto whatever feed carried them; central-bank and inflation news on a world feed file under Macro).
- Trades: Live watchlist (price, day change, 1-month range bar from 30 daily candles), Midday movers, Live technicals; the dated scan lives in the Court Briefs card only.

Causes of the inconsistencies (summary): styles were added round by round as overrides (7 layers, up to three competing rules per element); colours and spacing were hard-coded; night mode used the Classic palette; Classic card styles leaked into the New look; icons used fixed dark colours with no night variant; links had three colours.

Honest notes:
- Screenshots: the world with its real layout boxes was rendered in headless Chrome (desktop day and night, tablet night, phone day). The full page could not be screenshot or clicked through, because the preview and the local app need your login. Please look at Calendar, Life Hub, Dungeon and Settings first.
- Live watchlist: the old list selector and wave notes came from TradingView in the old dashboard and are not in this app. FEATURE GAP: a watchlist selector needs a saved list or a TradingView connection.
- Week tab: tapping a day opens the Calendar tab, not that day yet (the calendar has no way to receive a day from another tab).
- Needs you now rules also apply in Classic (it shares the card).
- "Agents waiting on me" covers briefs to rate; there is no agent yes / no suggestion feature in this app yet (FEATURE GAP).

NEEDS OWNER APPROVAL (open): focus sprint pause (new saved field); "auto-paid" and "important" flags for life items; synced weekly-review read state; an AI rewrite of the astro calendar in Luna's voice; Kingdom stage thresholds.
