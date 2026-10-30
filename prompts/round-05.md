# Round 5

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 5 (same branch, same preview; preview only, nothing to production until I say "ship it"). This merges everything I have decided since the last prompt. It overrides earlier prompts where they differ. Work in the ORDER below so later changes do not break earlier ones. Never repeat the same information in two places. Protected paths and tail, XP, stars and streak logic untouched.

STEP 0. ONE FINAL SPEC
Rewrite docs/kumo-redesign/COURT_SPEC.md as the single consolidated spec of the Court, all tabs and all decisions so far, resolving contradictions between earlier prompts (list each contradiction and which rule won, in PROGRESS.md). From now on changes are small edits to that file. Also write a one-page "where each thing lives" map (one canonical home per item) at the top.

STEP 1. TOKENS, COLOURS, FONTS, LINKS, ICONS (foundation)
- One token set (colours day and night, spacing scale 4/8/12/16/24/32, radii, 1-2px borders, shadows, type scale). Replace hard-coded values in New look CSS and components. One card style, one page gutter and column gap, one heading, chip, button and input style. Remove dead or conflicting rules and Classic overrides that leak into the New look. Add a check script (run with the tests) that fails on raw hex colours, off-scale spacing, or any font outside the allowed set.
- FONTS LOCKED in the tokens: Playfair Display headings, Nunito body, Inter only for journal writing, Silkscreen only for tiny labels. Classic keeps Baloo 2 and Atkinson/Quicksand. No other font in the New look.
- DAY-MODE COLOUR STYLE for the whole dashboard (I prefer the old dashboard's look to the flat white and cream): blush page and panel tints (about #FFE8F1 page, #FFF8FB and #FFEDF4 panels, #FFE2EE dim panels), lavender title bars (about #CDBFFB to #B3A2F4) on card headers, plum text #5A2745, soft plum secondary #86506C, plum-pink outline about #A34876 (1-2px), dashed blush dividers #EBA9C6, soft pastel chips (mint #CDF2E0, lavender #EADDFF, peach #FFE0CF, butter #FFF1B8, pink #FFD3E5, sky #D3EAFF). No panel is plain white. Contrast 4.5:1 or better (7:1 for brief body). Night mode keeps deep plum with the same structure and must be fully readable (check every card, chip, label, strip and icon in night mode).
- NIGHT-MODE ICONS: the left rail icons (Court, Calendar, Garden, Dungeon, Life, Trades, News, Observatory, More), the header icons and every small pixel icon are dark purple on the dark background and almost invisible. Give every icon a light-on-dark night variant through tokens: light lavender-cream fill (about #ECE8F5) with a lighter plum-lavender outline or a soft glow, the active tab icon in sakura pink with a visible highlight pill, labels in #ECE8F5, contrast 3:1 or better for icons and 4.5:1 for labels, and the same visibility on hover, focus and in the phone bottom bar. Check the Dungeon, Life and Observatory icons especially. Add the icons to the contrast check.
- LINKS: one colour everywhere, deep sakura pink (about #C2185B in day, lighter pink about #F7A8CC in night, both 4.5:1 or better), underlined, same hover and visited state, no blue anywhere (also focus rings, selection, accent-color, scrollbars).
- SOURCES: small and unobtrusive. Replace the big source chips and boxes with one muted line of small inline text links under each item: "Sources: Kitco · CBS News" at 12px in the secondary colour, underlined pink on hover, no pill, no border, no background. Remove any duplicate "— CNBC, Business Standard" text tail.

STEP 2. OVERLAP GUARD AND WORLD HUD READABILITY
- The weather chip overlaps the "Clock Tower" label, the greeting and chips (level, "at work", weather) are nearly invisible over the sky, and the crew covers the "Dungeon" label. Fix for good:
  - Reserve a fixed HUD zone at the top left for the greeting, the three chips and the focus icon. No place label, building, fox or bubble may sit in it; labels that would collide are offset automatically.
  - HUD readability in every combination: the world follows Singapore time (day, dusk, night) while the interface theme is set separately, so test day world with night interface and night world with day interface as well. Chips become readable glass (about 75-85% opaque soft cream with plum text over a bright scene; about 80% deep plum with #ECE8F5 text over a dark scene), greeting text gets a soft backing or shadow, contrast 4.5:1 measured against the actual scene behind it.
  - Crew and the fox never cover place labels: labels sit above the crew's height and crew paths avoid label boxes.
  - Add an automated overlap test that measures bounding boxes of labels, chips, greeting, focus icon, quote bubble, fox and crew at three widths (phone, tablet, desktop) in day and night, and fails on any intersection; run it and fix before showing me. Do the same for every other section on the page: no overlaps between sections or cards.

STEP 3. COURT LAYOUT
- Under the world: the one-line Park a
