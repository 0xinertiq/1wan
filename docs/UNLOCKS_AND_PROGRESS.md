# Kingdom growth, locked assets and gameplay contract

## Essential promise
Every account starts with a lovely, complete-looking floating kingdom. Users gain new scenery, companions, themes and placeable cosmetics through **meaningful activity already captured by Kumo**, not duplicate forms or grinding. Unlocks are additive and owned cosmetics never decay or disappear due to missed days. Preserve existing garden decay/rest-day mechanics as separate **plant feedback**, not punishment or loss of ownership.

## Reuse existing systems
Audit found `quests.ts`, `actions.ts`, XP/levels/stars/streaks, nine tails, `watering_events`, `user_state` keys, and code-drawn SVG sprites. First inventory exact existing events, levels, star awards, tails and user history. Define an event adapter; do NOT replace existing calculations or alter `OWNED_KEYS` without an explicit reviewed migration. Don't double-award XP for a garden tick and its mirrored watering event. Prefer server-authoritative, idempotent award records for any new rewards.

## Starter (free for everyone)
- Castle + floating island, sky/clouds, a few trees, one bridge/path, starter sakura tree and a fox companion.
- One usable default theme and all necessary accessibility controls.
- Functional module navigation is **never locked** behind levels. Only optional cosmetics and world details can be locked.
- Starter decorations: 2 lanterns, 1 small flower patch, 1 bench (if corresponding production assets exist).

## Proposed unlock catalog (illustrative thresholds; map to existing level curve)
| Item ID | Type | Suggested gate | Stars | Placement | Behavior |
|---|---|---|---:|---|---|
| sakura_blossom_cluster | decoration | level 2 | 0 | garden_left/right | One-time grant, permanent |
| lantern_pair | decoration | level 3 | 0 | path_left/right | Permanent |
| cloud_variant_peach | sky variant | level 4 | 0 | global | Theme variant |
| fox_scarf_rose | companion cosmetic | level 5 | 0 | companion | Permanent |
| pond_lilies | decoration | level 6 | 0 | pond | Permanent |
| observatory_glow | world detail | level 7 | 0 | observatory | Cosmetic only |
| fox_companion_2 | companion | level 8 | 0 | companion | Permanent |
| bridge_lanterns | decoration | level 9 | 0 | bridge | Permanent |
| dusk_lavender_theme | theme | level 10 | 0 | global | Theme, not dark mode override |
| seasonal_sakura_arch | decoration | level 12 | 0 | entrance | Permanent |
| golden_wind_chime | shop cosmetic | unlocked shop from level 3 | 40 | tree_right | Star purchase once |
| koi_pond_accent | shop cosmetic | unlocked shop from level 6 | 65 | pond | Star purchase once |
| fox_cape_starlight | shop cosmetic | unlocked shop from level 10 | 90 | companion | Star purchase once |

**These thresholds and prices are placeholders, not a claim about existing XP balance.** Calibrate against actual `needFor(lvl)` and current star economy. Existing tails must remain valid; map tail milestones to a parallel visual unlock only after verification.

## Event-to-growth mapping
- Existing quest completion -> canonical quest event -> XP/stars per current rules -> level gate evaluation -> one-time cosmetic grant.
- Existing habit/grid/watering activity -> existing event -> garden visuals; never count the mirrored event twice.
- Diary save -> diary entry recorded -> optional first-entry / consistency milestone; do not reward repeated autosave calls or word count spam.
- Project milestone -> completed canonical milestone -> unlock evaluation; do not award on editing the same completion repeatedly.
- Research brief rating / follow-up -> meaningful contribution if enabled, capped; don't award on rereading the same brief.
- Rest days and quiet periods -> no negative XP, no item repossession, no shame mechanics.

## Visual growth stages (illustrative)
1. Starter: calm sky, island, castle, sparse foliage, one companion.
2. Blooming: added blossoms, lanterns, warm garden accents.
3. Expanding: decorative side buildings, richer path, companion variants.
4. Flourishing: observatory lighting, pond and bridge accents, seasonal detail.
5. Personal Kingdom: owned theme and placements, optional richer world; density cap.

Stage is a *derived presentation* of existing milestones, not a separate daily checklist. Scenes must have a maximum visual density and avoid covering navigation hotspots.

## Ownership and locked-state behavior
- Catalog states: `locked` (requirements shown), `unlocked_unowned` (purchasable or claimable), `owned_unplaced`, `placed`.
- Unlock condition and purchase price are separate. Some unlocks are free automatic grants; others reveal shop inventory.
- Locked items visible in Studio/Shop as silhouettes or softened thumbnails with explicit requirement and preview. Never pretend they are owned. Provide progress toward next gate without making up data.
- Each item can be bought/granted only once unless explicitly marked consumable (V1: no consumables).
- Server must validate user identity, level, prerequisites, stars balance, and available slots. Atomic purchase: debit stars + add ownership + audit event in one transaction. Client-only validation is insufficient.
- Use a stable unique key `(user_id, item_id)` and `(user_id, source_event_id, reward_rule_id)` to prevent duplicate purchases and rewards.
- Place only owned items; predefined slots, bounds, overlap restrictions, responsive anchor coordinates. Move/undo/save; store placement per-user. Theme selection per-user; never mutate other users' kingdom.
- Level-up modal/notification only on new transitions, not every page load. Include a 'View unlock' action and respect reduced motion.
- For friend accounts, strict RLS and independent XP, inventory, settings and saved scenes; test as two different users.

## Technical migration caution
Existing state is largely one `user_state` JSON row and the audit says the save API enforces `OWNED_KEYS`. **Do not invent writes to new keys in the client.** Propose an additive migration with dedicated catalog/inventory/award/placement tables, RLS, and server-side purchase/award functions. Present SQL and rollback plan for approval; verify live schema before applying. Keep existing XP and stars as source of truth until a verified migration strategy exists. Avoid race conditions between stars stored in JSON and transactional purchase flows; use a safe server-authoritative bridge or defer the shop until it is sound.

## Asset-production gate
The V1 pack contains SVG/PNG placeholders and a few petal animation frames. A catalog item is not 'production ready' until it has transparent normal/locked/preview imagery where needed, consistent outline/shadow, fixed dimensions/anchor, verified alpha, retina resolution, and visual approval. **Do not create blank placeholders that look purchasable.** Hide unavailable items from the live shop but keep them in the planned catalog.

## Tests required
- Same source event delivered twice gives one reward.
- A level-up grants the right item once; historical users retain progression.
- Unowned/locked item cannot be placed; insufficient stars cannot buy.
- Two concurrent purchase requests cannot overspend or double-grant.
- User A cannot read or alter User B's inventory, placement, rewards or diary.
- Scene layout works on mobile and desktop; hotspots remain accessible.
- No loss of existing tails, quest XP, stars, streak or garden rest logic.
- Animation disabled under `prefers-reduced-motion`; stable layout on slow connections.
