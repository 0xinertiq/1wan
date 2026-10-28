// Overlap guard for the Living World (round 5, step 2). Measures the boxes the page uses (components/kumo/world/
// layout.ts): place labels, the HUD band (focus icon, greeting, chips), Chief Kumo, the quote bubble, the fox at
// every perch it may use, and the crew, at phone, tablet and desktop sizes, with every crew member at work
// (the most crowded case) and with short and long quotes. Day and night share the layout (only colours change),
// so both are run. Any intersection fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { worldLayout, hit, foxAt } from "../src/components/kumo/world/layout.ts";
import { CREW_AT } from "../src/components/kumo/kingdom.ts";

const SIZES = [{ name: "phone", w: 390, h: 196 }, { name: "tablet", w: 820, h: 400 }, { name: "desktop", w: 1100, h: 520 }, { name: "wide", w: 1400, h: 520 }];
const ALL = Object.entries(CREW_AT).flatMap(([place, ids]) => ids.map((id) => ({ id, place })));
const CASES = [{ crew: ALL, q: 60 }, { crew: ALL, q: 220 }, { crew: ALL, q: 320 }, { crew: [], q: 120 }];

for (const phase of ["day", "night"]) for (const sz of SIZES) test(`no overlaps: ${sz.name} ${phase}`, () => {
  for (const c of CASES) {
    const L = worldLayout(sz.w, sz.h, c.crew, c.q);
    assert.ok(L, `${sz.name}: no layout`);
    const bad = [];
    const labels = L.places.map((p) => p.box);
    const others = [L.hud, L.kumo, ...L.crew, ...(L.bubble ? [L.bubble] : [])];
    for (const a of labels) {
      for (const b of labels) if (a !== b && hit(a, b, 0)) bad.push(`${a.id} label x ${b.id} label`);
      for (const b of others) if (hit(a, b, 0)) bad.push(`${a.id} label x ${b.id}`);
    }
    if (L.bubble) for (const b of [L.hud, ...L.crew]) if (hit(L.bubble, b, 0)) bad.push(`bubble x ${b.id}`);
    for (const pt of L.perches) for (const b of [L.hud, ...labels, ...(L.bubble ? [L.bubble] : [])]) if (hit(foxAt(L, pt), b, 0)) bad.push(`fox at ${pt} x ${b.id}`);
    for (const b of [...L.crew, L.kumo, ...labels]) if (b.x < 0 || b.x + b.w > sz.w || b.y < L.hud.h || b.y + b.h > sz.h) bad.push(`${b.id} outside the scene`);
    assert.ok(L.perches.length >= 3, `${sz.name}: only ${L.perches.length} fox perches left`);
    assert.deepEqual([...new Set(bad)], [], `${sz.name} ${phase}, ${c.crew.length} crew, quote ${c.q}`);
  }
});

test("a box too small for the world gives no layout instead of a broken one", () => {
  for (const [w, h] of [[0, 0], [1100, 0], [1100, 59], [1100, 100], [0, 520], [80, 400], [NaN, 400]]) assert.equal(worldLayout(w, h, [], 80), null, `${w}x${h}`);
});
