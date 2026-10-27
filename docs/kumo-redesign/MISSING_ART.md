# Missing art: stand-ins to replace with commissioned files

Every item below is a prototype drawn in code or recoloured from the asset pack. To swap in real art, set
`file` in the item's def (`apps/web/src/components/kumo/decor/<id>.ts`); no other code changes.
Pixel items use a 32x32 grid, plum outline #4a2538, one gold accent, nearest-neighbour scaling.

| Spot | Current stand-in | File to commission | Size | Anchor | Slot |
|---|---|---|---|---|---|
| Court kingdom banner | Asset pack layers 01-07 (painterly, not exact mockup art) | kingdom_banner_day layers | 1600x520, cover | bottom centre | Court home banner |
| Observatory banner backdrop | Pack layers 03-07 recoloured with CSS filter, gradient sky in CSS | kingdom_banner_night layers | 1600x520, cover | bottom centre | Luna's sky banner |
| Moon | `decor/moon.ts`, code pixel art | moon.png | 32x32 (shown 48-72px) | 0.5, 0.5 | sky_left, sky_right |
| Star | `decor/star.ts`, code pixel art | star.png | 32x32 (shown 12px) | 0.5, 0.5 | sky_any |
| Calendar (Clock Tower) banner | None yet (moodboard shows a clock tower scene) | clock_tower_banner layers | 1600x520, cover | bottom centre | Calendar tab header |
