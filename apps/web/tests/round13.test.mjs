// Round 13: garden scene cleanup, the Edit garden panel (one new optional key, gedit), the Dungeon room banner,
// and branch progress backgrounds.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { OWNED_KEYS, normalize } from "../src/lib/court/state.ts";
import { anchorOn, anchorRows, ladderItems, move, moveShown, myMilestones, normGardenEdit, ordered, questName, shownHabits, split, toggle } from "../src/lib/court/gardenEdit.ts";
import { branchProgress } from "../src/lib/court/branchChart.ts";

const K = "2026-10-28", h = React.createElement;   // a Wednesday
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const ctx = (st, update = () => {}) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const EMPTY = normGardenEdit(undefined);

test("gedit: a new optional key; absent or odd values read as nothing edited, and it survives a save and reload", () => {
  assert.ok(OWNED_KEYS.includes("gedit"), "saved with her state, so Export my data includes it");
  assert.deepEqual(normalize({}, K).gedit, EMPTY);
  assert.deepEqual(EMPTY.anchors.mine, []); assert.deepEqual(EMPTY.ladder.done, {});
  for (const bad of [null, 7, "x", [], { hab: 3, anchors: { meta: { a: { at: "25:99", freq: "often" } }, mine: [{ id: "x", t: "no prefix" }] } }]) {
    assert.deepEqual(normGardenEdit(bad), EMPTY, "odd values are dropped, never break a page");
  }
  const doc = { gedit: {
    hab: { hidden: ["h1", "h1"], order: ["h2", "h1"] },
    quests: { names: { m1: "  Morning brief  ", k7: "" }, order: ["k7", "m1"] },
    anchors: { names: { d1: "Water" }, hidden: ["d2"], order: ["d3"], meta: { d1: { at: "07:30", freq: "custom", days: [5, 1, 1, 9] }, d2: { freq: "weekdays", days: [1] } }, mine: [{ id: "ma-1", t: "Stretch", at: K }], log: { [K]: ["ma-1"], bad: ["x"] } },
    ladder: { names: { b1: "First" }, labels: { b1: "my label" }, targets: { b1: "Dec 2026" }, hidden: ["b2"], order: [], mine: [{ id: "mm-1", t: "Mine", dt: "2027" }], done: { "mm-1": true, b1: true } },
  } };
  const e = normalize(doc, K).gedit;
  assert.deepEqual(e.hab, { hidden: ["h1"], order: ["h2", "h1"] });
  assert.deepEqual(e.quests.names, { m1: "Morning brief" }, "trimmed; a blank name means the original");
  assert.deepEqual(e.anchors.meta, { d1: { at: "07:30", freq: "custom", days: [1, 5] }, d2: { freq: "weekdays" } });
  assert.deepEqual(e.anchors.log, { [K]: ["ma-1"] });
  assert.deepEqual(e.ladder.done, { "mm-1": true }, "only her own milestones tick here; Small Wins ticks stay in swins");
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(normalize(doc, K))), K).gedit, e, "persists through a save and reload");
  // an older document without gedit loads exactly as before apart from the empty key
  const old = { streak: 4, xp: 120, hab: { list: [{ id: "h1", name: "Read", days: [1], at: K }], log: {} } };
  const a = normalize(old, K), b = normalize({ ...old, gedit: doc.gedit }, K);
  delete a.gedit; delete b.gedit;
  assert.deepEqual(a, b, "gedit changes nothing else in her state");
});

test("hiding folds an item away and keeps it (records, ticks and history stay; unhide brings it back)", () => {
  const list = [{ id: "h1" }, { id: "h2" }, { id: "h3" }];
  const s = split(list, (x) => x.id, ["h2"]);
  assert.deepEqual(s.shown.map((x) => x.id), ["h1", "h3"]);
  assert.deepEqual(s.folded.map((x) => x.id), ["h2"], "kept in the folded list, not removed");
  assert.deepEqual(toggle(toggle([], "h2"), "h2"), [], "Unhide undoes Hide");
  // hiding a habit only writes gedit: her habit and its ticks stay in hab
  const st = normalize({ hab: { list: [{ id: "h1", name: "Read", days: [3], at: K }], log: { [K]: ["h1"] } }, gedit: { hab: { hidden: ["h1"] } } }, K);
  assert.equal(st.hab.list.length, 1); assert.deepEqual(st.hab.log[K], ["h1"]);
  assert.deepEqual(shownHabits(st.hab.list, st.gedit).folded.map((x) => x.id), ["h1"]);
  // a hidden imported anchor keeps its ticks in swins
  const st2 = normalize({ swins: { done: {}, log: { [K]: ["d2"] } }, gedit: { anchors: { hidden: ["d2"] } } }, K);
  const rows = anchorRows([["d1", "One", ""], ["d2", "Two", ""]], st2.gedit, 3);
  assert.deepEqual(rows.folded.map((x) => x.id), ["d2"]); assert.deepEqual(st2.swins.log[K], ["d2"]);
  // the panel never deletes: no splice, filter-out or delete of hab, swins, defs or her own items
  const g = src("components/court/live/EditGarden.tsx");
  assert.ok(!/splice|confirmDelete|delete d\.|\.mine = .*filter/.test(g), "Edit garden has no delete path");
  assert.ok(!/\bdefs\b\s*=/.test(g), "the imported tracker definitions are never written");
});

test("order, rename and schedule helpers", () => {
  assert.deepEqual(ordered(["a", "b", "c", "d"], (x) => x, ["c", "a"]), ["c", "a", "b", "d"], "her order first, new items after in place");
  assert.deepEqual(move(["a", "b", "c"], "b", -1), ["b", "a", "c"]);
  assert.deepEqual(move(["a", "b", "c"], "a", -1), ["a", "b", "c"], "the top item stays put");
  assert.deepEqual(moveShown(["a", "x", "b", "c"], ["a", "b", "c"], "b", -1), ["b", "x", "a", "c"], "a hidden item keeps its place");
  assert.equal(questName({ ...EMPTY, quests: { names: { m1: "Brief" }, order: [] } }, { id: "m1", title: "Open the morning brief" }), "Brief");
  assert.equal(anchorOn(undefined, 0), true, "no setting = every day, as before");
  assert.equal(anchorOn({ freq: "weekdays" }, 6), false); assert.equal(anchorOn({ freq: "weekdays" }, 3), true);
  assert.equal(anchorOn({ freq: "custom", days: [3] }, 3), true); assert.equal(anchorOn({ freq: "custom", days: [3] }, 4), false);
  const e = normGardenEdit({ ladder: { names: { b1: "First" }, labels: { b1: "L" }, targets: { b1: "Dec" }, hidden: ["b2"], order: ["b3", "b1"], mine: [{ id: "mm-1", t: "Mine" }] } });
  assert.deepEqual(ladderItems([["b1", "One", "d1", "Jan", 1], ["b2", "Two", "d2"], ["b3", "Three", "d3"]], e), [["b3", "Three", "d3", undefined, undefined], ["b1", "First", "L", "Dec", 1]]);
  assert.deepEqual(ladderItems(myMilestones(e), e).map((x) => x[1]), ["Mine"]);
});

test("ladder targets and her own anchors and milestones never touch XP, stars, streak or tails", () => {
  for (const f of ["lib/court/actions.ts", "lib/court/quests.ts", "lib/court/tails.ts", "lib/court/garden.ts", "lib/court/habits.ts"]) {
    assert.ok(!/gedit/.test(src(f)), f + " never reads Edit garden");
  }
  const st = src("lib/court/state.ts");
  assert.ok(!/gedit/.test(st.slice(st.indexOf("export function rollover"))), "rollover and the streak rules never read it");
  // her own milestones tick in gedit with no water or XP call; Small Wins ticks keep the same path
  const p = src("components/court/pages/GardenPage.tsx");
  assert.match(p, /if \(id\.startsWith\(MY_MILESTONE\)\) return update\(\(d\) => \{ const done = \{ \.\.\.d\.gedit\.ladder\.done \}/);
  assert.match(p, /if \(!id\.startsWith\(HAB_PREFIX\)\) return tick\("swins", id, on, "milestone"\);/);
  const g = src("components/court/live/GrowLive.tsx");
  assert.match(g, /\(a\.mine \? tickMine : tickAnchor\)/, "imported anchors tick exactly as before");
});

test("Edit garden: one button, one panel with four tabs, the quest switches moved in", async () => {
  const { GardenPage } = await import("../src/components/court/pages/GardenPage.tsx");
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(normalize({}, K)) }, h(GardenPage)));
  assert.equal((html.match(/>Edit garden</g) ?? []).length, 1, "one Edit garden button");
  assert.ok(!/Edit quests/.test(html), "the separate Edit quests fold is gone");
  const { EditGarden } = await import("../src/components/court/live/EditGarden.tsx");
  const p = renderToString(h(CourtCtx.Provider, { value: ctx(normalize({ hab: { list: [{ id: "h1", name: "Read", days: [3], at: K }], log: {} }, gedit: { hab: { hidden: ["h1"] } } }, K)) }, h(EditGarden, { onClose() {} }))).replace(/<!-- -->/g, "");
  for (const t of ["Habits", "Quests", "Anchors", "Wins ladder"]) assert.ok(p.includes(">" + t + "<"), t + " tab");
  assert.match(p, /Folded away \(1 habit\)/); assert.match(p, />Unhide</);
  assert.match(p, /Add a habit in My habits/, "My habits stays the only place to add a habit");
  assert.ok(!/class="btn(?! sm ghost)[^"]*"[^>]*>(Hide|Unhide|↑|↓)</.test(p), "row buttons are the transparent ghost style");
});

test("branch progress: the decorations follow the effective chart", () => {
  // the four states themselves are tested in round14.test.mjs (round 14 split "in progress" into quiet and active)
  const g = src("components/court/live/GrowLive.tsx");
  assert.match(g, /const list = chartBranches\(raw, st, byear\);/, "branches keep reading the effective chart");
  assert.match(g, /data-bp=\{bp\.state\}/);
  assert.match(src("app/(court)/kumo-new.css"), /\.gk\[data-bp="done"\]\{[^}]*--k-gold-400/, "completed has a soft gold edge");
});

test("garden scene: the pond, bridge and left lantern are gone; the right lantern and tufts stay", () => {
  const t = src("components/kumo/decor/GardenTree.tsx");
  assert.ok(!/bridge/.test(t.replace(/\/\/.*$/gm, "")), "no bridge");
  assert.ok(!/fill\("n"\)/.test(t), "no pond");
  assert.equal((t.match(/sprite\(lanternS/g) ?? []).length, 1); assert.match(t, /sprite\(lanternS, 120, 69, "l2"\)/);
  assert.match(t, /\[\[96, 78\], \[104, 79\], \[112, 78\], \[40, 79\]\]/, "grass tufts unchanged");
});

test("Dungeon room banner: same frame and grid as the clock tower, new art files, one gold accent", async () => {
  const room = src("components/kumo/decor/DungeonRoom.tsx"), clock = src("components/kumo/decor/ClockRoom.tsx");
  for (const f of [room, clock]) { assert.match(f, /<RoomFrame /); assert.match(f, /viewBox=\{`0 0 \$\{ROOM_W\} \$\{ROOM_H\}`\}/); }
  assert.match(src("components/court/pages/Dungeon.tsx"), /<PageHead room=\{<DungeonRoom \/>\} title="Dungeon"/);
  const art = await import("../src/components/kumo/decor/dungeonArt.ts");
  for (const k of ["sisiDesk", "sconce", "candelabra", "jarShelf", "archWindow"]) {
    const s = art[k]; assert.ok(s.every((r) => r.length === s[0].length), k + " rows are one width");
  }
  const golds = ["sisiDesk", "sconce", "candelabra", "jarShelf", "archWindow"].map((k) => art[k].join("").split("g").length - 1);
  assert.deepEqual(golds, [3, 0, 0, 0, 0], "the journal ribbon is the only gold");
  assert.equal(art.DUN_PAL.X, "#4a2538", "plum outline");
  assert.match(room, /PixelSprite name="sisi"/, "Sisi from the existing sprite set (PixelSprite unchanged)");
  const { DungeonRoom } = await import("../src/components/kumo/decor/DungeonRoom.tsx");
  const html = renderToString(h(DungeonRoom));
  assert.match(html, /class="kroom ph-day kroom-dun"/, "the same .kroom box as the clock tower, so the same size");
});
