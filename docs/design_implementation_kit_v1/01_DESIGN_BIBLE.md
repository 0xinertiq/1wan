# Kumo Design Bible — approved direction / proposed exact tokens

## Brand
A cute, serene, functional virtual kingdom. A beautiful world on day one; meaningful activity unlocks extra cosmetic detail. The kingdom enhances productivity; it never displaces information. Style: pastel sakura fantasy, warm cream surfaces, restrained pink, lavender, sky blue, plum typography, gentle storybook/pixel-art hybrid. Avoid all-pink full-page fills, thick outlines on every card, random stock photos, unnecessary illustrations in information modules, gamification guilt and visual noise.

## Typography
- Heading: **Playfair Display** 600–700, fallback Georgia, serif.
- Interface: **Nunito** 400–700, fallback system-ui, sans-serif.
- Pixel labels: existing **Silkscreen** sparingly for levels/kingdom labels, not long text.
- Preserve CJK fallback fonts where relevant; test Chinese labels. Load with `next/font` where practical; retain safe fallback.
- Desktop H1 32/40, H2 24/32, H3 20/28, body 16/24, compact body 14/20, caption 12/18, minimum normal interactive text 14px. Mobile H1 28/36, H2 22/30. Avoid tiny text in dense research cards.

## Candidate palette (final code tokens in CSS)
- Primary sakura `#F65A9B`, hover `#E6498A`, pale `#FCE8F1`.
- Lavender `#A78BFA`, light `#F0EAFF`.
- Sky `#7DA7FF`, light `#EAF2FF`.
- Canvas `#FFF8FB`, surface `#FFFFFF`, muted surface `#F8F5FC`.
- Text `#2A2340`, secondary text `#655B78`, line `#E9DCE8`.
- Success `#21866F`, warning `#9B6300`, danger `#B83858` (dark enough for text); soft semantic backgrounds.
These are curated from the approved visual, NOT pixel-sampled exact artwork values. Test WCAG contrast; do not use saturated pink as small body text on white.

## Geometry and layout
- Base spacing unit 4px; primary rhythm 8/12/16/24/32/48px.
- Card radius 16px; controls 12px; small chips 8px; large overlays 24px.
- Border 1px soft line; avoid double borders and inset frames. Shadows: 0 4px 20px rgba(42,35,64,.06) for cards; 0 12px 32px rgba(42,35,64,.12) for overlays.
- Desktop >=1200px: left rail ~72px expanded optionally ~208px, main max content width ~1440px, page padding 24–32px, 12-column grid. Tablet 768–1199px: condensed rail, 16–24px padding. Mobile <768px: single column, 16px horizontal padding, <=5 bottom nav items, safe-area aware.
- Compact homepage kingdom banner desktop target 220–280px high, mobile 130–180px; crop responsively without clipping key characters. Full-screen Kingdom Mode separate.
- Minimum tap targets 44x44px; keyboard focus ring; sensible tab order; loading, error, empty, disabled and offline states.

## Motion and performance
- Gentle cloud drift 30–60s, occasional petals 12–24s, companion idle 3–8s; pause when offscreen and when tab hidden; `prefers-reduced-motion` disables nonessential motion. Never animate whole-page heavy backgrounds. CSS transforms/opacity preferred; keep assets compressed, responsive and lazy-loaded. Static-first rendering.

## Art language
Scenery: soft painterly fantasy, warm daylight, floating castle and cherry blossoms. Existing crew: preserve code-drawn 32x32 pixel sprites, plum outline, blush cheeks, one gold accent; treat painterly world as a backdrop and sprites as intentional layered characters. Do not randomly replace the existing sprites with inconsistent animal illustrations.

## Navigation
Desktop left rail and top contextual toolbar; mobile Home / Calendar / Hub / Diary / More with globally accessible Quick Capture. Observatory, Garden, Kingdom and Settings accessible through More or context. Bell accessible globally. Keyboard and screen-reader labels required.

## Global design rules
1. One canonical source of truth for each activity; never mirror tasks into a second editable copy.
2. Homepage is a summary, not a second Calendar or second Life Hub.
3. Calendar chronological: Now → Next → Later, with all-day events separately.
4. Artwork belongs in kingdom scenes, welcome/empty states and occasional reward moments, not every information card.
5. Market Pulse has market-wide indicators and narratives; Watchlist exclusively owns ticker prices.
6. Data freshness and source labels must be visible; no invented live prices, health scores or sync statuses.
7. Preserve night-mode and user theme overrides; design accessible dark tokens before release.
