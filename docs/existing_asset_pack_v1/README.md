# Kumo Asset Pack V1

**Actual transparent PNG and editable SVG assets**, not crops from the approved mockups. Includes 1600×520 composable scene layers, starter/growing previews, 8 decoration objects, and 8 transparent petal animation frames.

## How to use
Copy `layers/`, `decorations/`, `animation/` and `asset-manifest.json` into `apps/web/public/kumo/`. Keep source SVGs for editing. Layer full-canvas PNGs in a relative aspect-ratio container with absolute inset 0, width/height 100%, `object-fit:contain`. Only render `08_growth_additions` after an earned progression state. Position decoration PNGs at predefined slot coordinates. Use the manifest to map assets and slots.

## Important
These are **new original illustrative vector assets**, stylistically compatible with the approved pastel direction but **not exact cutouts of the image-generation mockups**. Your existing 32×32 `PixelSprite` character system should remain authoritative; this pack deliberately does not replace character sprites. The provided petal frames are a basic loop prototype, not a polished animation sequence. Review the artwork against the live dashboard before shipping.

The asset pack does not include all seasons, backgrounds for every room, or a full sprite animation atlas. Those are subsequent asset milestones.
