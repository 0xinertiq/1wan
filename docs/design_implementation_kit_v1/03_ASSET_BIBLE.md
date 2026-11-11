# Asset Bible and production requirements

## IMPORTANT
The approved reference image is a **composition guide**, not a ready-to-ship layered sprite pack. Existing code-drawn pixel sprites in `spriteDefs.ts` / `PixelSprite.tsx` are production source assets and should be protected. Do not extract arbitrary objects from a flattened screenshot and pretend they have transparent edges.

## Scene asset inventory
1. `kingdom-starter-desktop`: panoramic 1600x520 source target, safe central crop, WebP/AVIF 1x/2x as appropriate.
2. `kingdom-starter-mobile`: portrait/compact crop 900x700 source target.
3. `kingdom-growing-desktop`: same camera/geometry as starter, additive decorative layers.
4. `kingdom-full-scene`: large 1920x1080 source target for Kingdom Mode.
5. `sky`, `clouds`, `hills`, `castle`, `foreground`, `petals`: individually layered transparent assets where motion/placement requires it.
6. `sakura-garden-base`, `sakura-tree-stage-0..4`: matching anchor and bounding box; no sudden scale jumps.
7. `companion-*`: prefer current 32x32 SVG sprite definitions and CSS motion; new companions must match established pixel rules.
8. `decoration-*`: transparent PNG/WebP, logical bounds + anchor point + valid placement slot types.
9. `theme-*`: Sakura default; Moonlit and Matcha may use colour swaps first, then separate art only if approved.
10. `empty-state-*`: at most a small fox/companion illustration per empty-state family.

## Pixel sprite standard
Existing 32x32 pixel grid, plum outline, blush cheeks, one gold accent; nearest-neighbour scaling, no blurry transforms. Avoid mixing realistic 3D mascots with pixel sprites in interactive components.

## Placement model
Use predefined normalized positions `{slotId,xPct,yPct,scale,layer,allowedCategories}` for kingdom decoration. For responsive mobile, use a separately defined anchor map or proportional crop rules. Validate overlaps and click targets. Persist only item IDs and slot IDs, not arbitrary browser coordinates.

## Animation and optimization
Use CSS animation on isolated transparent layers; pause offscreen; avoid video as default; offer Still/Gentle/Full modes. Export compressed assets, test 1x/2x, preserve alpha, no baked-in UI text. Add alt text for meaningful illustrations, empty alt for decorative ones.

## QA checklist
Consistent lighting/perspective, matching edge treatment, no fake text, transparent backgrounds where required, correct clipping, accessible contrast under overlays, performance budget, responsive crop and legal usage rights.

## Deliverable status
This package includes the approved **styleboard** and detailed asset manifest. It does NOT yet include a full set of individually cut, animated production layers; these must be created/validated before decoration placement is shipped. Claude should use existing sprite code and neutral placeholders until each art asset is accepted.
