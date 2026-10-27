# Missing art: stand-ins to replace with commissioned files

Every item below is a prototype drawn in code or recoloured from the asset pack. To swap in real art, set
`file` in the item's def (`apps/web/src/components/kumo/decor/<id>.ts`); no other code changes.
Pixel items use a 32x32 grid, plum outline #4a2538, one gold accent, nearest-neighbour scaling.

| Spot | Current stand-in | File to commission | Size | Anchor | Slot |
|---|---|---|---|---|---|
| Moon | `decor/moon.ts`, code pixel art | moon.png | 32x32 (shown 48-72px) | 0.5, 0.5 | sky_left, sky_right |
| Star | `decor/star.ts`, code pixel art | star.png | 32x32 (shown 12px) | 0.5, 0.5 | sky_any |
| Garden scene backdrop | Asset pack layers 01-06 (day) | garden_scene layers | 1600x520, cover | bottom centre | Garden tab banner |
| Sakura tree stages 0-4 | `decor/sakura_0.ts` to `sakura_4.ts`, code pixel art | sakura_0.png to sakura_4.png, all the same box | 32x32 (shown 56px) | 0.5, 0.92 (ground line) | branch_row, garden_centre |
| Stone lantern | `decor/lantern.ts` | lantern.png | 32x32 | 0.5, 0.92 | garden_left, garden_right, front_left, front_right |
| Flower patch | `decor/flowers.ts` | flowers.png | 32x32 | 0.5, 0.92 | garden_left, garden_right, front_left, front_right |
| Mushroom friend | `decor/mushroom.ts` | mushroom.png | 32x32 | 0.5, 0.92 | garden_left, garden_right, front_left, front_right |
| Court banner, desktop | `public/kumo/court-banner-desktop.webp`: prototype, cropped from concept image 33 (x 130-1400, y 0-214), replace with final art | court_banner_desktop.webp | 1270x214 shown cover at 220-280px high, top-anchored | focus left (greeting) | Court home banner. Live overlays cover the painted greeting, chips and date (boxes in `PaintedBanner.tsx`). Painted fox stands in for the pixel fox. |
| Court banner, phone | `public/kumo/court-banner-mobile.webp`: prototype, cropped from concept image 33 (x 640-1100, y 0-214), replace with final art | court_banner_mobile.webp | 460x214 shown cover at 130-180px | focus centre (castle, fox) | Court home banner, under 760px wide |
| Observatory banner, desktop | `public/kumo/obs-banner-desktop.webp`: prototype, cropped from concept image 24 (x 124-1250, y 0-216), replace with final art | obs_banner_desktop.webp | 1126x216 shown cover at 200-240px | focus left (title) | Luna's sky banner. Live title and Luna's moon line cover the painted title and speech bubble. |
| Observatory banner, phone | `public/kumo/obs-banner-mobile.webp`: prototype, cropped from concept image 24 (x 480-1010, y 0-216), replace with final art | obs_banner_mobile.webp | 530x216 shown cover at 130-170px | focus 0.4 (fox, telescope) | Luna's sky banner, under 760px wide |
| Calendar (Clock Tower) banner candidate | Concept image 36 has a clock-tower strip, but greeting, stat bar, toggle, avatar and a speech bubble are painted across its sky; not used yet | clock_tower_banner.webp | ~1408x312 | centre | Calendar tab header |

Code-drawn moon and star (`decor/moon.ts`, `decor/star.ts`) are no longer on the Observatory banner; they stay for Kingdom Mode skies.
