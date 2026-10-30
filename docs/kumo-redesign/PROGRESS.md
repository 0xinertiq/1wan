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

## Round 5b and 5c (on preview)
Done:
- Bigdata hidden in the UI through one display scrubber, lib/noBigdata.ts (tests/noBigdata.test.mjs, made-up text): it drops headings, list items and table rows that mention Bigdata, link chips and list entries ("Sources: Bigdata.com, CNBC" becomes "Sources: CNBC"), parentheticals, and any sentence that mentions it (such as "Bigdata.com was unavailable, so ..."). Places covered: every brief, scan, movers note and Kumo review (the page passes each brief's title, body, rendered text, top lines and sources line through it once, so the Briefs card, News, Trades movers, the review card and Classic's brief windows all get the cleaned text); the "Sources:" line (cleanSources now comes from the same module); "What this desk has learned" (lessons, source notes, self-check). Stored data and the ingest / export routes are untouched.
- Crypto scan tab on the Court: snapshot label, read-through, Movers, one "Strongest now" line (top 3 by score from the Style Map), "Open in Trades →". The full scan stays in News; Trades will host the Style Map, Trade Plan and Catalysts later (not built).
- Needs you now: first in the right column; one button style (same 44px height and width pattern, right-aligned, centred with the text); the card animates away and leaves no space when nothing waits.
- Auto-paid and Important flags (approved): optional fields on life items. normalize() keeps them only when true or false (anything else is dropped) and leaves existing items exactly as they were; OWNED_KEYS unchanged; no migration. Tests in tests/state.test.mjs. Until she sets the toggle, GIRO, auto-deducted tax and subscriptions count as auto-paid. Life Hub > Life admin has "Auto-paid" and "Important" toggles per item (New look). Court: auto-paid hidden; shown when overdue, due within 3 days or Important.
  Exact diff of state.ts:
  + type LifeItem: autoPaid?: boolean; important?: boolean;
  + function lifeFlags(i): keep the two flags only when boolean (unchanged object when neither is present)
  - life: arr<LifeItem>(r.life).filter((i) => i && i.rule && typeof i.name === "string"),
  + life: arr<LifeItem>(r.life).filter((i) => i && i.rule && typeof i.name === "string").map(lifeFlags),
- Focus sprint pause (approved): tap the hourglass while running to pause (dashed ring, "II 12m"), tap again to resume; a small × stops it (not counted). The remaining time is kept on this device while paused; resuming moves the saved start time forward, so the saved state keeps its shape. Default stays 25 minutes.
- Quote of the day always in full: no clamp, no ellipsis, no tap to expand; the glass cloud grows (up to about 320px wide, then taller). The layout puts it in the first free spot in the scene (rising from Kumo, the top-right sky, beside the castle label) and under the strip when no spot is free. The overlap test now also runs 320-character quotes at phone, tablet, desktop and wide, day and night: no overlaps.
- The fox, v2 (crew/fox.md): redrawn on the crew's 32-pixel grid with the same 1px plum outline, eyes, blush and chibi proportions (big round head, tiny body, stubby legs, big ears with pink insides and red tips, red cheek stripes, gold bell on a red collar, soft lavender-pink shading), plump round tails fanned behind him from the tails value (read-only). Same scale as the crew (about 15% of the scene height). Squash-and-stretch hop, nap pose with closed eyes and "z", happy bounce with sparkle, idle tail wag; still under reduced motion. Checked side by side with Kumo, Pip, Olli and Momo at 32, 64 and 96px on day and night skies; the first tails hid behind his head and looked like red balls, so they were made longer, plumper and fanned wider.

Honest notes:
- On the tablet width (820px) quotes longer than about 60 characters, and on desktop the longest quotes (over about 200 characters), sit under the world strip rather than in the sky, because no free spot in the scene is big enough.
- The pause lives on this device: on another device the same sprint shows as running.
- Full-page screenshots still need your login; the world, the layout boxes and the fox were rendered and checked in headless Chrome.

Not built (as asked): synced review read state, a paid AI rewrite of Luna's text, new kingdom thresholds (placeholders kept).

## Round 5d (on preview)
Done:
- Sources: the word "Sources:" is gone everywhere. Under each item only the source names as small links joined by a middle dot (13px, deep sakura, underlined, no pills); nothing when an item has none (including a tail with no links). Covers the Briefs card (all three tabs), the Intel Top 5, News, Kumo's review, Trades movers and the brief-level sources line (SourcesLine, which now shows nothing instead of "not recorded"). Every line still goes through the Bigdata scrubber (bodies at the page, sources through cleanSources).
- Briefs one type step up: body 17 to 18px (1.65), lead lines 15 to 17px, section titles 20 to 22px, labels and source links 13px; Briefs card, News and Kumo's review. Night contrast for brief body stays 7:1 or better (the contrast check passes); tables keep their own scroll box, so nothing forces the page to scroll sideways.
- One date and time style: a shared formatter in lib/court/time.ts (stamp, dayStamp, stampAge, ageText, inText, clock, sgtKeyOf, badgeParts, monthTitle; tests/time.test.mjs). 25 hand-made date and time formats in 18 component and page files now use it (brief titles and ages, "as of", the "Next:" line, Today and Week, Needs you now, News, Trades, Calendar, Luna's sky, Source health, the old progress page). The token check now fails on any hand-made date or time formatting in components and pages (the world's clock face, pixel art, is the one listed exception). Timestamps show as small pixel labels (Silkscreen 12px).
- Header: one pixel badge "WED 28 OCT · 10:12 SGT" (pixel clock with a gold hand, Silkscreen, stepped corners, plum outline by day and lavender at night, blinking colon that stops under reduced motion), same height as the neighbouring chips; the rest-day line sits under it. Classic keeps its clock chip.

Checks: typecheck, build, 62 tests (tokens, fonts, contrast, overlap, dates, Bigdata, flags, parsers). The badge and a brief item were rendered with the real stylesheets in day and night at 1000px and 390px: no overflow; the night badge outline was too dark and now uses the lavender icon outline. Full-page screenshots still need your login.

## Bug fix: "Application error: a client-side exception" (28 Oct, preview)
- Not reproduced exactly: the real Court ran clean in headless Chrome with her real briefs, state (journal text blanked, local only), calendar, trades, watering events and live public feeds, server-rendered then hydrated, day and night, desktop and phone.
- Found and fixed every way one bad value could blank the whole page: the shared date formatter and the older date helpers threw on an unreadable date (the old code printed "Invalid Date"); a world box shorter than the HUD band gave a negative or giant canvas; malformed calendar events, watering events, feed lists, a missing gamble list, or an odd saved "seen" value crashed a card and with it the page.
- Safeguards: an error boundary per card and per tab ("This card could not load" with Retry); a page-level and a root fallback with "Reset saved settings on this device" (clears only this app's local keys); versioned, validated local settings (lib/court/store.ts); data cleaned where it enters.
- Tests: tests/render.test.mjs renders every screen with empty, partial, broken and old-format data and fails on any error; npm run test:browser opens the real app in headless Chrome (38 runs, also with old and broken saved values) and fails on any console error or uncaught exception.

## Round 6: the remaining tabs (on preview)
Built: Trades, Calendar, Life Hub (with Grid & Wins as a Harada 9x9 chart), Dungeon, Garden, News, Settings, Notifications, Onboarding, Kingdom Mode; Observatory removed. The placement map is at the top of COURT_SPEC.md.

Where moved features live now: Money (spending, typed figures, Money Wins balances and ladder) in Life Hub > Finance overview; Trade (log, sizer, ledger review with stop and ATR flags, plans, rules, gamble and late-night ledger) in Trades; Grid & Wins in Life Hub; Samsara's weekly counters and milestones in Life Hub > Grid & Wins > Weekly targets; Small Wins ladder in Garden > Wins ladder; technicals inside Trades (Live watchlist area); the weekly review packet in News; Count your wins and the one weekly look-back in the Dungeon; Luna's sky only on the Court.

### Decisions made (smaller, reversible option each time)
1. Trade log uses the existing trades table and /api/ledger (her real ledger), not a new trades table. The target price is kept inside the trade's checks field (no column change, no migration).
2. Round 6 records use one generic shape per table (id, data, created and updated times; research_notes also has kind, journal_entries has day), so new fields need no new migration.
3. Preview storage lives in this browser under its own keys, so "Reset saved settings on this device" never deletes records. Settings has "Download this device's preview records".
4. The Dungeon writes pages to journal_entries. Older diary text (wins, thanks, notes) and older moods stay where they are and show read-only on their day; Count your wins still saves where it always did. Mood is not a key this app owns, so new moods are saved on the journal page.
5. Habit editor: her own habits go in the new optional key hab; they never award XP or touch quests, streak or tails.
6. Garden tree stage = this week's daily quests done ÷ planned, in five steps; it droops while the trunk is thirsty. Cosmetic only.
7. Grid & Wins wizard on an existing chart fills empty cells only (see approvals); a user with no chart gets the full wizard.
8. Samsara milestones (not placed by addendum 2) sit under Weekly targets with their ids unchanged.
9. Last fetched on the Calendar is when the page last received calendar data (the calendar fetching code is untouched).
10. Tilly's "Summarise my notes" is not shown: no paid API is configured (CLAUDE.md: no paid API yet), so the rule "hidden when no AI key or cap" applies.
11. Onboarding opens by itself only for a brand-new account (no history at all); it never redirects her. Rooms switched off hide Garden, Dungeon, Trades and News from the nav; Court, Calendar, Life Hub and Settings always stay.
12. Settings and Birth details in the header menu, and the packet button, go to their one home in the New look; Classic keeps its sheets and its old Life sub-tabs (Classic is out of scope).
13. Notification read state is per device, like the review read state.

### NEEDS OWNER APPROVAL
1. Three new optional user_state keys (no migration, older documents load unchanged, tests in tests/state.test.mjs and tests/harada.test.mjs):
   - type CourtState: + prefs: Prefs; hab: Habits; gridDefs: GridDefs;
   - OWNED_KEYS: + "prefs", "hab", "gridDefs" (appended; nothing removed)
   - normalize(): + prefs: normPrefs(r.prefs), hab: normHab(r.hab), gridDefs: normGridDefs(r.gridDefs),
2. Grid & Wins wizard rebuild: archiving the old chart's ticks would mean moving st.grid.done, which the nine tails read, so the wizard fills empty cells only on an existing chart. A full rebuild with archived ticks needs your go-ahead and a tails review.
3. Feedback loop: Useful / Needs work ratings and one-line notes are stored in the feedback table (one row per brief kind, last 60 items in items). The scheduled desks cannot read them: they still read the old dashboard's database, and /api/ingest/brief only accepts writes. Smallest safe fix: a new read-only GET /api/ingest/feedback behind the same ingest secret, returning the last 14 days of ratings per desk, plus one line in each desk prompt to read it. It touches the protected ingest area, so not built.
4. Applying migration 0006 and setting the flag (steps below).
Still open from before: synced review read state (later), kingdom thresholds (placeholders).

### Round 6 storage: steps for you
(1) Export your data first
1. Open the preview and sign in.
2. Click the menu (three dots) at the top right, then the down-arrow icon "Export my data".
3. Save the file somewhere safe (it holds your journal and trades).
4. On each browser where you tried the preview, open Settings and click "Download this device's preview records" (only shown before the flag is on).

(2) Apply the migration in Supabase
1. Go to supabase.com, sign in, open the 1wan project.
2. In the left bar click "SQL Editor", then "New query".
3. Open supabase/migrations/0006_round6_tables.sql from the repo, copy all of it, paste it into the editor.
4. Click "Run". You should see "Success. No rows returned".
5. In the left bar click "Table Editor": you should see journal_entries, goals, finance_entries, research_notes, longterm_watchlist, tasks and routines, each with a small "RLS enabled" label.

(3) Set the flag (not a secret; never paste keys into chat)
1. Vercel: open the 1wan project, Settings, Environment Variables. Add the name NEXT_PUBLIC_1WAN_TABLES with the value on, tick Preview only for now, Save. Then Deployments, the latest preview, the three dots, Redeploy.
2. Your computer: open apps/web/.env.local in a text editor, add one line NEXT_PUBLIC_1WAN_TABLES=on, save.

(4) Verify
1. Open the preview, Settings: "Your data" should say "Saved to your account".
2. Add a task in Calendar, reload: it is still there. Open it on your phone: it is there too.
3. Export my data again: the file now has the seven new sections.
4. Optional: supabase/tests/0006_rls_test.sql is a pgTAP test for a local or branch database only (never production).
Records saved in preview storage before the flag do not move by themselves; tell me if you want an import button.

### Checks
Typecheck, build, 130 unit tests (tokens, fonts, contrast, overlap, dates, Bigdata, normalize, Harada chart, storage cleaning, inbox, astro rule on the Calendar, Observatory redirect, render of every page with empty, partial, old and odd data) and 58 headless browser runs (every tab by address, day and night, desktop, tablet and phone, old and broken saved values and records): no console errors.

### Not checked
- Screens were not visually reviewed by screenshot (as asked); layout is checked through the render tests, tokens and the overlap test.
- The Supabase backend was not run against a real database (the migration is not applied); the device backend was.
- The RLS SQL test was written but not run (no local database here).
- Real calendar, ledger and spending responses inside the new pages were only checked with fixture data this round.

### Independent review (fresh reviewer, read-only) and the one fix round
Passed: placement map (each feature has one New-look home), protected list untouched (only export gained the new tables; three optional state keys), no migration applied, no Bigdata text, privacy, no advice language, Observatory removed with a working redirect, Garden is pixel art, the Harada layout and tick ids, no astrology on the Calendar, 130 of 130 tests.
Fixed:
- Page-header and cross-page links (#grid-wins, #econ-cal, #dungeon-week, #research, #tlog) now open their tab and scroll; tested.
- The chart editor saves what was typed when it is closed.
- The wizard locks cells that already have text, instead of silently ignoring edits.
- The trade log can link a plan and marks it reached and placed, as the ledger did. The ledger review refreshes after a save.
- The bell and the inbox share read state.
- Each notification switch does what it says. Morning means one summary item; the review switch is honoured.
- Room switches are in Settings.
- Dungeon reflections save when you leave the box and only send changed fields.
- The phone bar order is Home, Calendar, Hub, Diary, More.
- The pale-blue chips are now peach and lavender.
- Segmented tabs are pressed buttons. Clearer labels on chart ticks and the block picker. Fewer live regions.
- Dead Observatory styles and an old comment are gone.
- A load error from the account storage shows as an error, not as empty.
- CSV import handles quoted commas.
Kept as is: "Astrology gives timing, not outcomes." on the chart (addendum 1 asks to keep it). The new size calculator uses its own equity box, not the ledger's account setting (the ledger sizer is still in the ledger section).
After the fixes: typecheck, build, 133 tests and 58 browser runs clean.

## Round 7: layout cleanup, rooms pilot, alert pop-ups (on preview)

Branch `kumo/aesthetic-overhaul`, preview only. Nothing protected was edited: auth, existing RLS and migrations, middleware, /api/ingest and /api/export, calendar fetching, scheduled tasks, XP, stars, streak and tails logic, PixelSprite.tsx, spriteDefs.ts, env vars. No user data is deleted: hidden cards keep their records.

### Where moved features live now
- Momo's day (Calendar) → only "Ideas for your free time", on the Court's Today card.
- Watchlist card → gone; prices live in the Technicals rows and on the Court (price feed unchanged).
- Ledger review, plans, rules and gamble log → hidden; records and the late-night flag logic kept.
- Watchlist scan and Midday movers tabs (News) → Trades only.
- Kumo's weekly review and the packet → one card in Settings (#review-card); the Court's unread review card is retired so it has one home.
- Saved and research strip → retired from News; notes stay in research_notes, the Dungeon's attach list and Export my data.
- Goals card → retired; goals stay in the goals table and Export my data.
- Notifications tab, bell and Settings card → alert pop-ups on the agents; stored choices kept in prefs.notif (an explicit "off" still mutes a rule).

### Decisions made
1. Buttons: one shared `.btn` (transparent pink: translucent fill, 1.5px pink border, plum text). At night the text is the night ink, not plum, so it stays readable. Selected segmented tabs and mini-month days use the same transparent style.
2. Banners: the scene is drawn with "meet" (never cropped) inside a 5:1 box (4:1 on the phone); the sky and the hill run past the scene's edges so a wider box shows more sky and grass, never empty bars.
3. Pilot room: the Calendar's clock tower interior, a 400 x 60 pixel strip (new files `decor/rooms.ts`, `decor/ClockRoom.tsx`), with the real Singapore time on the big clock, a swinging pendulum (off under reduced motion), and Momo by her desk (the existing sprite, reused, not edited). Drag with the mouse, swipe on touch, arrow buttons or keyboard. The other tabs keep their fixed banners until you approve.
4. "More" stays: on phone and tablet it opens a sheet with Garden, Trades, News, Settings and Kingdom Mode (the tabs that do not fit the bottom bar). On desktop it is hidden because the rail lists every tab.
5. Aligned grids: two-column pages stretch both columns to the row and the last card in each column grows, so the columns finish evenly.
6. Calendar astro rule: isAstro is unchanged; the Calendar also uses a new isSkyItem (feed names like Luna or moon, and sky phrasing such as "Full Moon", "retrograde", "Venus trine Jupiter"). Single words like "Cancer" or "Mars" never hide a real event.
7. Garden: tree stage and petals come from this week's quests, anchor ticks and her own habits together. Her habits appear in Quests ("Your habits today") and as one derived phase at the end of the Wins ladder ("Your habits", won once ticked this week). Nothing is stored twice; ticking anywhere writes the same hab.log entry; Small Wins ids and ticks are untouched; no XP from her habits. Kumo's pick moved inside the Quests card.
8. Dungeon: Your pages | Today's page | Weekly look-back then the side cards; on a tablet the page sits left and the two others stack right. The top-right look-back bubble was removed (the card is in view).
9. Life Hub: Grid & Wins' Chart | Weekly targets control sits in the card's title bar; the view switch below is "Grid | List".
10. Trades: Calculator | Performance stats share a row (in that order), after the Trade log. The chart button and its drawing code are gone; her saved chart lines stay in her state. The "30-day low to high" caption is on the Watchlist range column, which no page shows now, so no range column remains anywhere.
11. News: headlines follow her lenses on the News tab only (the Court keeps every topic); a new Tech topic is read from story titles on world and markets feeds. The Briefs card shows Intel for a news or markets lens and Pulse for Tech or Markets.
12. Alerts: Momo's morning summary (05:00 to 11:59) speaks for new briefs; Pip announces each brief after that; Olli: big releases within 48 hours; Coco: tasks, routines and life admin due today or overdue; Momo: habit reminder from 17:00; Kumo: bookings within two hours from Needs you now (the others are covered by Coco) and, on Sundays, the weekly review. Dismiss hides an alert for good; Later hides it for three hours. Kept on this device. Kumo joins the Court roster so his "!" has a place.
13. The fox is called 9-Tails in the tour, the Kingdom catalogue and the fox's own card.

### NEEDS OWNER APPROVAL
- New optional user_state key `lenses` (with tests). Diff in `apps/web/src/lib/court/state.ts`:
  ```
  + export const LENS_IDS = ["crypto", "macro", "markets", "world", "local", "tech", "any", "off"] as const;
  + export type LensId = (typeof LENS_IDS)[number];
    CourtState: + lenses: LensId[];
    OWNED_KEYS: ..., "prefs", "hab", "gridDefs", + "lenses"
  + export function normLenses(v, old) { known ids once each; "off" or "any" alone; empty → from her old prefs.lens (trading → crypto, macro, markets) }
    normalize: + lenses: normLenses(r.lenses, r.prefs?.lens),
  ```
- The other rooms (Court, Life Hub, Garden, Dungeon, Trades, News, Settings) as wide rooms like the clock tower. Waiting for your verdict on the pilot.
- Still open from round 6: applying migration 0006 and the read-only feedback endpoint.

### Checks
Typecheck clean; 140 unit and render tests pass (8 new in tests/round7.test.mjs); headless-browser runs clean, now also failing on any button with a solid pink fill; `next build` passes with only the existing Supabase realtime warning.

### Not checked
No screenshots (as asked). The room's drag and swipe were checked in code and by the browser runs, not by hand on a phone.


### Independent review (fresh reviewer, read-only) and the one fix round
The reviewer found no protected file touched, no solid pink button left, one home for every moved feature, and nothing deleted. Fixed:
- Classic keeps its Technicals chart (the New look still has no chart button).
- The morning's briefs never alert twice: Pip only announces briefs filed from 12:00, and Momo's summary covers the rest.
- Replaying the tour no longer resets the lenses chosen in Settings.
- The Dungeon's note text no longer points to the removed research strip.
- The alert "!" waits for saved Dismiss and Later choices, so it never flashes.
- The alert bubble closes on scroll, focus moves to the current tab after the last Dismiss, and a link to the current address still opens.
- Each Briefs card has its own heading id.
- Wins-ladder habits now show today's tick, so ticking and unticking always match.
- The Tech topic shows only on the News tab, so the classic Court's headlines are unchanged.
- Dead code removed: the bell and inbox styles, and the unused Watchlist card.

Kept, with notes:
- **Alerts default to on.** Only an explicit "off" stored before mutes a rule, and with the Notifications card gone she cannot change this. NEEDS OWNER APPROVAL: keep on, or return to morning-only.
- **The Calendar's sky filter** (also in Classic) hides calendars named with "luna" or "moon", and titles such as "Moon cake festival" or "Eclipse meetup".
- **`forLens` and the `Research` type stay**, because the Dungeon and the tests use them.
- **`InboxProvider` keeps its name.**

Checks after the fix round:
- Typecheck is clean.
- 140 tests pass.
- Browser runs are clean.
- The build passes.

## Round 8: tighter layouts (on preview)

Nothing protected was edited, and no records are deleted.

### What changed, by tab
- **Calendar:** the Calendar card, then the Economic calendar, both full width.
  - My tasks, Month at a glance and Upcoming are off this tab. Tasks stay saved and still show in Needs you now and Today's Coming up.
  - Coco's task alert now opens Needs you now.
- **Garden:**
  - No banner: the pixel garden sits straight on the page (no sky, box or border) and still grows with the week, with the progress line under it.
  - Daily anchors and Branches, then My habits and Quests, share rows, so tops, bottoms and widths line up. The Wins ladder spans the width below.
  - Card titles and labels sit on one baseline.
- **Dungeon:** Your pages keeps its natural height, with Research notes under it in the left column.
- **Life Hub:**
  - Weekly targets are restyled: three even soft cards, slim bars, compact +/- buttons; the milestone groups and Weekly rhythm use the same soft style. Data and ids are unchanged.
  - Grid cells: a double-click or double-tap marks an action done, using the same "p.a" key, `useTick` and `water()` as the editor's Done box, which stays. A single press opens the editor.
  - Done cells are a soft pastel green, the same by day and night.
  - All cells are the same height, with clear gaps between cells and between blocks. Text is clamped, and the full text shows on hover and in the editor.
- **Trades:** one full-width card holds Midday movers, then Scan details. The Macro desk is compact.
- **News:**
  - The Briefs card is removed; the Intel and Pulse briefs live on the Court.
  - New "Today's briefing" card, built by rules with no AI:
    - Keeps stories in her lenses, leaving out social-only ones.
    - Groups near-duplicate leads by title similarity and adds up their sources.
    - Ranks by score, then by recency, and shows the top five with sources and age.
    - Ends with a count line.
- **Settings:**
  - Kumo's weekly review card shows only the review list, then the packet. The "Briefs and scans" header and tabs are gone.
  - Account is in the left column.
  - The Look card uses a label grid.
- **Every page:** ends with 48px plus the safe-area buffer.

### Decisions made
1. The near-duplicate threshold for the briefing is 0.35 trigram similarity. The feed clustering uses 0.45, so the briefing only merges stories the clustering kept apart.
2. A double press is two presses on the same cell within 350 ms. The first press opens the editor, as a single press always did.
3. Soft cards use the glass surface with a new hairline plum-tinted border token. The done-cell green is one new token, the same by day and night.

### Checks
- Typecheck is clean.
- 148 tests pass, including 8 new ones in tests/round8.test.mjs.
- All 56 browser runs are clean.
- The build passes, with only the existing Supabase realtime warning.


### Independent review (fresh reviewer, read-only) and the one fix round
The reviewer found no protected file touched and nothing deleted.

**Must-fix:** with My tasks off the Calendar, tasks could not be added or ticked anywhere.
- My tasks now sits in the Life Hub, beside Routine. They are the same records.
- Needs you now and Coco's alert link there.

**Also fixed:**
- A double press now ticks the cell and closes the editor.
- Grid cells no longer zoom the page on a double tap.
- Weekly rhythm sits in the same soft box as the milestones.
- Midday movers line up flush with Scan details.
- On the phone the Garden cards read anchors, habits, branches, quests.
- The Look row is labelled "Version".
- The briefing's count leaves out Telegram items.
- The scan note points to Briefs on the Court.
- Unused Calendar imports and a dead CSS rule were removed.

**Kept:**
- Branches and Daily anchors share a row, so the shorter card stretches to the longer one.
- The unused non-bare paths in BriefsLibrary and MoversCard stay for now; they are small.

After the fix round:
- Typecheck is clean.
- 148 tests pass.
- All 56 browser runs are clean.
- The build passes.

## Round 9: fixes, editable finance, research note input (on preview)

Nothing protected was edited, no records are deleted, and no new migration was needed: `finance_entries` is already in migration 0006, which is written but not applied, with user_id and owner-only RLS. Until the tables are switched on, finance records are kept in Preview storage on this device. Export my data already includes the table.

### By tab
- **Calendar:** the Calendar and Economic calendar cards share one stack (`.kcal-stack`). The old 900px centred column no longer narrows the Calendar card, so both have the same width, edges and header line.
- **Dungeon:**
  - Research notes line up with Your pages.
  - A New note form (title, text, optional link, optional tag) saves to research_notes as kind "note".
  - Notes list newest first under the form and can be attached to the page as before. The empty-state text is updated.
- **Life Hub, Finance overview:** the tabs are Overview, Log a spend, and Budgets and CSV.
  - Overview shows the Money Wins ladder first, then the editable tracker:
    - Overview tiles. Net worth reads "hidden" until hovered or focused; on touch, tap to show and tap again to hide.
    - Figures with Edit, Undo and a 5-line history: emergency fund, free SGD, sinking fund balances, net worth parts.
    - Monthly cash flow with a month picker: Income in − Fixed bills − Sinking funds − Logged spending = Left over.
      - Income is typed once per month; the import is the starting value.
      - Fixed bills are pulled from Life admin bills with an amount, counted once per hit in the month.
      - Sinking funds are the monthly set-asides from the import.
      - Logged spending is totalled by category.
      - "Left over with the coming changes" is one muted line.
    - Loans owed to me: lent, a repayments list, written off, still expected. Net worth counts only the still-expected part.
  - The Show net worth button is gone from the New look.
- **Life Hub, folding done items** (New look):
  - A fully ticked Weekly targets milestone group folds under "Show done (n)", and ticked milestones sort to the bottom of an open group.
  - Life admin items that are auto-paid, a one-off paid, or paid this month fold under "Show paid (n)".
  - Nothing is removed; ticks and ids are unchanged.
- **Trades:**
  - The card is renamed "Scan".
  - Midday movers and each scan section show their first lines with "Show more", with tighter spacing.
  - The calculator has a one-line explainer, a label and hint on every field, empty fields instead of a pre-filled "1", Calculate, and a result box (position size, amount at risk, risk : reward).
- **News:** Today's briefing groups headlines by meaning:
  - case and punctuation are normalised;
  - coin and Fed aliases are folded, and entities and numbers compared (60K = $60,000);
  - word overlap and trigram similarity are added.
  - The best-scored headline stays, and the others show as "also reported by".

### Decisions made
1. Balances stay where they always lived (user_state `money`: t, f, nw), so the Money Wins auto rules and the Sunday reset keep working. Loans, monthly income and the edit history live in `finance_entries` as new kinds (`loan`, `income`, `edit`). No new user_state key.
2. Anything that looks like an account or card number (8 or more digits) is masked as ••• in finance records.
3. The imported "loans back received" figures are shown as one muted line under Loans, so they are not counted twice. Enter a loan to track it fully.
4. If a net worth part from the import already counts the S$9,000 loan, set that part to 0 after adding the loan, so it is not counted twice.

### Checks
- Typecheck is clean.
- 157 tests pass, including 9 new ones in tests/round9.test.mjs.
- All 56 browser runs are clean.
- The build passes, with only the existing Supabase warning.

### Independent review (fresh reviewer, read-only) and the one fix round
The reviewer found no protected file touched.

**Fixed:**
- **Briefing false merges.** Two headlines with different named subjects (Fed and ECB, Bitcoin and Ethereum) are never merged. Years and Title Case words no longer count as subjects, and each story is compared only with a group's lead headline, so matches don't chain from one story to the next.
- **Net worth double counting.** Once loans are tracked, an imported net-worth part that is itself money lent out is left out, with a note on it.
- **Imported loan figures.** The SGD and USD "loans back" received figures are editable again.
- **Restored from the old money view:**
  - routine r1 status and r2 status text;
  - fund pace, due date, monthly amount and bar;
  - Free SGD vs baseline;
  - the "imported as of" line;
  - the "from fund" and "in" notes on Coming up.
- **No import:** someone without an import still gets their typed money figures under Log a spend.
- **Bills counted once:** spends logged under "bills" no longer count twice in the cash flow.

**Minor fixes:**
- Undo steps back one change at a time, and an empty entry never saves as 0.
- The loan forms explain bad input, and repayments plus written-off can't pass the amount lent.
- "Every N days" bills count by phase, so past months don't change.
- Those bills fold once done this month.
- Switching months quickly no longer mixes up the spending lines.
- "Show more" and its fade appear only on blocks that are really clipped.
- Reveal has a fixed label.
- Calculator hints are read once.
- The note form says when a link was dropped.

**Kept, with notes:**
- **Not yet editable:** fund targets, monthly set-asides, and a loan's name or amount.
- **USD loans:** loans are in SGD; the imported USD figure stays separate.
- **Bills:** only Life admin bills (not "Money" items) count as fixed bills.
- **Bill paid from a sinking fund:** if a bill is paid from a fund, it shows both as a bill and as a set-aside.

Checks after the fix round:
- Typecheck is clean.
- 159 tests pass.
- All 56 browser runs are clean.
- The build passes.

## Round 10: fixes and additions (on preview)

Nothing protected was edited and nothing was deleted. Scheduled tasks were read, not changed.

### Diagnoses
- **D1, the garden never sprouts.**
  - Cause: the stage was the share of everything possible this week (quests, all 8 anchors every day, and her habits). It needed 20% to leave Seed, so normal weeks stayed a seed.
  - Fix: the stage now comes from real ticks this week. 1 tick sprouts it, 5 give leaves, 12 a young tree, 20 blossoms (`gardenStage`). Decay and recovery are unchanged.
- **D2, catalysts look stale.**
  - Cause: there is no separate store. Trades shows the "Catalysts" section of the newest scan brief. The reading side was correct, so the cause is on the writing side: the scan task's text, or scans not arriving.
  - Reading-side fix: Catalysts now shows the scan's date and how many of its dates have already passed.
  - Writing side: the scan prompt lives only in the cloud task. Not changed; needs her.
- **D3, Kumo's review judges the old 0.5 ATR stop.**
  - Cause: 0.5 ATR appears nowhere in the repo; the app and prompts/ already use 1 ATR. crew/kumo.md had no stop rule, and the review prompt lives only in the cloud task.
  - Fix: crew/kumo.md now states the 1 ATR / 1:2 rule.
  - Still needed: the cloud task needs its prompt re-pasted. A re-run alone is not enough. Not done; needs her approval.
- **D4, how the briefing ranks.** Each story has a cluster score (source type, freshness, watchlist +20, release +10, independent wordings +5 each, up to 100). The briefing keeps her lenses, merges same-meaning stories, ranks by score then recency, and takes the top five. Each item now has a "Why this story" line: score, sources, and the biggest lift.

### Items
- **Calendar:**
  - Back, the label (with Today) and Next sit on one aligned row.
  - Mini month cells are fixed. The cause was a clash with Classic's `.today` grid rule; the class is now `is-today`, with one number per cell and the heart behind it.
- **Dungeon:** the reflection selector has no "Not about a trade" option and is hidden when there are no trades.
- **Life Hub:** Chart 2026 | Chart 2027 | Weekly targets.
  - 2027 uses new optional keys `gridDefs2027` and `grid2027done`. It starts blank with the wizard, with "Copy from 2026" (words only), its own ticks, history, undo and "Reset to blank".
  - 2026 is unchanged.
- **Loans:**
  - Loans can be removed (kept, restorable, logged in history) and the amount lent edited with history and undo.
  - One-time change, as asked:
    - the USD 9,000 loan entry is removed;
    - SGD loans come to S$40,000 as one entry (no answer came, so one entry);
    - the imported loans-back figures are kept but folded away.
- **Trades:**
  - No "Read the alert".
  - The Style Map is always open.
  - Leverage (x) adds notional, margin required, and an estimated liquidation price, with a warning if it comes before the stop. Labelled "approximate; fees and maintenance margin not included".
- **News:**
  - Dedupe by meaning now also compares direction (rebounds vs drops).
  - A final check across all items guarantees no two items are the same story.
- **Court:**
  - Briefs open expanded.
  - The Today card has a to-do list (tasks table with `todo: true`, or preview storage) that carries unfinished items over ("from yesterday"); done items clear after their day and stay as history. To-dos stay off My tasks and Needs you now.
  - The Mercury line is smaller.
  - Quotes rotate on each load and every 4 minutes, none repeated until all have had a turn.
  - The quote bubble rises from Kumo with its tail pointing at him.

### NEEDS OWNER APPROVAL
- New optional keys `gridDefs2027` and `grid2027done` (diff in lib/court/state.ts: CourtState fields, OWNED_KEYS entries, normalize lines; tests in tests/round10.test.mjs).
- Re-paste the chief-kumo-weekly-review prompt with the 1 ATR rule. Optionally paste the scan prompt into prompts/ so the catalysts writing can be checked.

### Checks
- Typecheck is clean.
- 169 tests pass, including 10 new ones.
- All 56 browser runs are clean.
- The build passes.

### Independent review (fresh reviewer, read-only) and the one fix round
The reviewer found no protected file touched. It confirmed the 2027 chart is isolated, the leverage and short-liquidation maths are right, and to-dos stay off other views.

**Fixed:**
- **Must-fix, phantom loan.** The one-time loan change could add S$40,000 for anyone with no loans. It now adds nothing without her imported Money Wins loans (so friends and new accounts are untouched), never runs on a failed load, and runs once.
- **Must-fix, wrong loan removed.** It removed any S$9,000 loan. It now removes only a loan marked USD.
- **Must-fix, unsaveable trade link.** The newest trade could not be linked in the reflection. A disabled "Pick a trade" placeholder now shows until a trade is chosen.
- **Minor:**
  - The "why" line now counts sources after the final merge.
  - Catalyst dates no longer read "3 may rise" as a date, and use the scan's own year.
  - Dead layout code was removed.

**Kept, with notes:**
- **Quote bubble placement:** the bubble only rises from Kumo, so on short scenes it sits under the strip instead of in a corner of the sky, as asked.
- **Quote on load:** the quote changes once just after load (the day's quote, then the rotation).

After the fix round:
- Typecheck is clean.
- 169 tests pass.
- All 56 browser runs are clean.
- The build passes.

## Round 11: small fixes (on preview)
- **Gratitude:**
  - "Count your wins" is now "Gratitude" everywhere: button, sheet title, helper text and Dungeon labels.
  - The evening sheet still saves to the existing `wins` key (date, what went well, what I'm grateful for, notes), with the same quest and XP behaviour. That key is part of her saved state, so Export my data includes it.
  - The Dungeon has a "Gratitude log" (newest first, tap to read, Edit to change the words only).
  - Decision: kept the existing key rather than journal_entries, because the code already uses it.
- **Trades:** no "Fenn" tag beside the Trade log title.
- **News:** a category chip opens every headline in that category at once, and Collapse goes back to eight.
- **Settings:** Sign out sits beside Replay the tour in the page header. It uses the existing POST /auth/signout route, which signs out and returns to the login screen; auth is unchanged. The Account card no longer repeats either button.

Checks:
- Typecheck is clean.
- 174 tests pass.
- All 56 browser runs are clean.
- The build passes.
Review (fresh, read-only): no protected file touched and nothing must-fix.

Fixed:
- The Classic diary editor, the diary download and the weekly recap now use the gratitude wording.
- The Gratitude log shows 30 entries with "Show all" for the rest.

Noted, not changed:
- The Gratitude log is New look only. Classic has the renamed button and its diary.

## Round 12 and addendum 2 (on preview)

Nothing protected was edited; decay, XP, stars, streak and tails are unchanged. The new art is in new files: `components/kumo/decor/treeArt.ts` (the pure drawing) and `GardenTree.tsx`.

### Branches diagnosis
The Branches card took its names from the old imported chart (`st.defs.grid` in lib/court/garden.ts), not from her edits (`gridDefs`). Its blossoms counted only the 2026 ticks.

Now `lib/court/branchChart.ts` maps the branches onto the effective chart: her edits over the import for 2026, or the separate 2027 chart, with that year's ticks. A 2026 | 2027 switch sits on the card. Ticks are keyed by position, so renames keep them. Decay stays in garden.ts, untouched.

### The bonsai
- **Stages,** from this week's real ticks (round 10 rule):
  - Bare: 0 ticks
  - Sprout: 1
  - Leafy: 5
  - Blossoming: 12
  - Full bloom: 20, with the moon and extra petals
- **Wilting,** drawn from the trunk's days since real activity (yesterday counts as fine):
  - 1 missed day (idle 2): paler leaves, a drooping twig, a few fallen petals.
  - 3 missed days (idle 4): drooping branches, yellow-brown leaves, thinner blossoms, more petals on the ground.
  - 7 missed days (idle 8): mostly bare, drooping, petals scattered.
  - Recovery: any activity restores the earned stage, with a sparkle.
- **Extras:**
  - Golden petals on the tray, up to 8.
  - Sway and drifting petals pause under reduced motion, a hidden tab or off screen.
  - Day and night palettes.
  - A "next stage at N more ticks" hint.

### Other items
- **Dungeon on one screen:** at desktop sizes (1200px wide, 540px tall or more) it fits the window. The banner is compact, the columns scroll inside themselves, and Today's page fills its column. It's checked in the browser at 1280×720 and 1440×900.
- **Quests:**
  - Edit quests switches built-in quests on or off (new optional key `questsOff`); display only, with XP unchanged.
  - Caption added under Habit Quests.
- **Quotes:**
  - A Settings card: add one, paste many, upload .txt or .csv, with a preview and counts.
  - Blank lines and duplicates are skipped, quotes are cut to 160 characters, and the library holds at most 500.
  - Choose Both, Built-in only or Mine only; Remove all my quotes asks first.
  - New optional key `quotes`, included in Export. Her old dashboard quotes (`uq`) count as hers and are untouched.
- **Addendum 2:**
  - Today's gratitude sits at the top of the right column: three lines, autosave, Save, and a saved tick. It writes today's entry under the existing `wins` key (same quest and XP behaviour), and the Gratitude button on Today's page jumps to it.
  - The Research notes card and the attach control are gone from the Dungeon. The research_notes data, the macro desk, the export and the notes already attached to a page are all kept.

### NEEDS OWNER APPROVAL
- **New optional keys** `questsOff` and `quotes`. The diff in lib/court/state.ts covers the CourtState fields, the OWNED_KEYS entries, and the normalize lines (`normQuotes` in lib/court/quoteLib.ts).

### Checks
- Typecheck is clean.
- 182 tests pass.
- All 58 browser runs are clean, including the two one-screen checks.
- The build passes.

### Independent review (fresh reviewer, read-only) and the one fix round
The reviewer found no protected file touched and the decay rules unchanged. It confirmed the bonsai matches the brief, and that research notes and quotes are kept.

**Fixed (must-fix):**
- **Dungeon fit after normal navigation.** The Dungeon now fits one screen when opened from the nav too: it measures when its tab is shown, measures again once the compact head applies, then trims any leftover overflow.
- **Small win wiped.** The evening sheet and the Classic diary editor no longer wipe the small win.
- **Today's gratitude text.** The card picks up newer words from the sheet or the log when she isn't typing, and saves what was typed when she leaves or hides the tab.
- **Quotes:**
  - Quotes in any script are accepted.
  - The `"Quote" — Author` form and `"Be kind" — | — Pip` split correctly.
  - BOM and CRLF are handled; a CSV header row is skipped; a `|` inside a CSV cell stays in the quote.
  - Duplicates of built-in or older quotes are skipped.

**Fixed (minor):**
- Kumo's pick respects the quest switches.
- A blank pillar name shows "Sub-goal n", from the chart only.
- The tray now draws over the trunk base, so its rim stays crisp.
- Thirsty leaves are paler.
- The recovery sparkle can no longer stick.
- The upload button shows a focus ring.
- Diary search includes the small win.
- The stale News comment is corrected.

**Noted:**
- **Notes out of sight.** Her own research notes, and the notes already attached to pages, no longer show anywhere in the app. They are kept in research_notes and in Export my data, as asked.
- **Browser flake.** One server-render browser run once showed a hydration flake. It passed on rerun; it is a known minute-boundary flake from the header clock.

After the fix round:
- 182 tests pass.
- All 58 browser runs are clean.
- The build passes.

## Round 13 (preview)

1. **Garden scene.** The pond, bridge and left lantern are gone. The right lantern, grass tufts, bonsai, sun and planter stay; growth, wilting and petals are unchanged.
2. **Edit garden.** One button on the Garden page opens one panel with four tabs: Habits, Quests, Anchors and Wins ladder.
   - You can rename, reorder, hide and unhide in every tab. Anchors also take a time and days (daily, weekdays or custom), and ladder milestones take a label and a target.
   - New habits are still added only in My habits. The Habits tab has a button that jumps there.
   - The quest switches from Round 12 (`questsOff`) moved into the Quests tab, and the separate Edit quests fold is gone.
   - Hiding folds an item away; nothing is deleted. Finished ladder milestones fold under "n finished".
   - **Storage:** one new optional key, `gedit`. Anchors and milestones she adds tick inside `gedit` and award nothing. The Daily anchors quest still counts the eight imported anchors.
3. **Dungeon room banner.** Sisi's stone study (candles, bookshelves, a desk with her journal, Sisi at it) uses the same `RoomFrame` and `.kroom` box as Momo's clock tower, so the two banners are the same size.
   - On desktop screens under about 800px tall, both banners share a height cap so the Dungeon still fits one screen. The art fills the width and trims a little top and bottom.
   - The new art is in new files: DungeonRoom.tsx, dungeonArt.ts and RoomFrame.tsx.
4. **Branch backgrounds.** Each branch on the Branches card now shows its progress:
   - grey: not started;
   - a pastel green fill from the left, sized by the share of that branch's cells done: in progress (activity this week, or at least one cell done);
   - full green with a soft gold edge: all eight cells done.

**NEEDS OWNER APPROVAL:**
- The `gedit` key.
- The shared room-banner height cap on short screens, which also shortens the Calendar banner there.
- Whether a branch with cells done but no activity this week should count as in progress (current) or as not started.

## Round 14 (preview)

**Round 13 decisions applied:**
- **Banner height cap:** kept.
- **Daily anchors target:** it now counts only the imported anchors that are scheduled and shown that day, so hiding one gives 7/7. The quest still completes through logQuest, so XP, stars and streak are unchanged.
- **Branch states:** grey means never started; a faint tint means cells done but quiet this week; pastel green means active this week; a soft gold edge means complete.
- **Storage keys:** lenses, gridDefs2027, questsOff, quotes and gedit are approved.

**New room banners** (MoreRooms.tsx, moreRoomsArt.ts), all on the shared RoomFrame, so they match the Calendar and Dungeon banners in size:

| Tab | Room | Agent | Gold accent |
|---|---|---|---|
| Life Hub | planner room | Coco | planner ribbon |
| Trades | desk with chart screens | Fenn | ticker arrow |
| News | newsroom with pinboard and wire printer | Pip | one pin |

**Banners removed:** Settings and Kingdom Mode no longer render a banner. The scene code is kept.

## Round 15 (preview)

Four room banners were redesigned as distinct rooms: `room2Dungeon.tsx`, `room2Life.tsx`, `room2Trades.tsx` and `room2News.tsx`, with shared helpers in `roomKit.tsx`.

- **Size:** all four use the Calendar's RoomFrame, so they keep the same size and the short-screen cap.
- **Calendar:** the clock tower is unchanged.
- **Old room files:** the Round 13 and Round 14 rooms are kept, unused.

| Tab | Room | Agent | Motion |
|---|---|---|---|
| Dungeon | torchlit study | Sisi | flicker |
| Life Hub | sunny morning room | Coco | plant sway, dust motes |
| Trades | night desk | Fenn | ticker scroll, candle blink |
| News | dawn newsroom | Pip | paper feed, sunrise glow |

- **Motion:** CSS only, slow, and off under prefers-reduced-motion.
- **Agents:** each one has a small idle bob.
