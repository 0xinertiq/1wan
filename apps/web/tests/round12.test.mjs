// Round 12 checks: the sakura bonsai's five stages and wilting (drawing only; decay rules unchanged), reduced motion,
// Branches from the effective chart, quest switches, the quote library, Today's gratitude, and no research notes in
// the Dungeon with their data kept.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { OWNED_KEYS, normalize } from "../src/lib/court/state.ts";
import { treeModel, wiltOf } from "../src/components/kumo/decor/treeArt.ts";

const K = "2026-10-28", h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const ctx = (st, update = () => {}) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });

test("bonsai: five stages from the round 10 thresholds, each fuller than the last", async () => {
  const { gardenStage, GROW_AT } = await import("../src/lib/court/habits.ts");
  assert.deepEqual([...GROW_AT], [0, 1, 5, 12, 20], "Bare 0 ticks, Sprout 1, Leafy 5, Blossoming 12, Full bloom 20");
  assert.deepEqual([0, 1, 5, 12, 20].map(gardenStage), [0, 1, 2, 3, 4]);
  const c = [0, 1, 2, 3, 4].map((stage) => treeModel({ stage, wilt: 0 }).counts);
  assert.deepEqual([c[0].leaf, c[0].blossom], [0, 0], "Bare: trunk and branches only");
  assert.ok(c[1].leaf > 0 && c[1].blossom === 0, "Sprout: a few leaves, no blossoms");
  assert.ok(c[2].leaf > c[1].leaf && c[2].blossom > 0 && c[2].blossom < 6, "Leafy: fuller leaves, first buds");
  assert.ok(c[3].blossom >= 10, "Blossoming: many clusters");
  assert.ok(c[4].blossom > c[3].blossom, "Full bloom: the lushest canopy");
  assert.ok(treeModel({ stage: 4, wilt: 0 }).drift.length > treeModel({ stage: 3, wilt: 0 }).drift.length, "more drifting petals at full bloom");
  assert.ok([...treeModel({ stage: 4, wilt: 0 }).px.values()].includes("o") && ![...treeModel({ stage: 3, wilt: 0 }).px.values()].includes("o"), "the moon only at full bloom");
});

test("bonsai wilting for 1, 3 and 7 missed days, and recovery on activity", () => {
  assert.deepEqual([0, 1, 2, 4, 7, 8, 30].map(wiltOf), [0, 0, 1, 2, 2, 3, 3], "days since activity → missed days (yesterday is fine)");
  const base = treeModel({ stage: 4, wilt: 0 }).counts, w1 = treeModel({ stage: 4, wilt: 1 }).counts, w2 = treeModel({ stage: 4, wilt: 2 }).counts, w3 = treeModel({ stage: 4, wilt: 3 }).counts;
  assert.ok(w1.fallen > 0 && w1.blossom <= base.blossom, "1 missed day: a few petals on the ground");
  assert.ok(w2.blossom < w1.blossom && w2.fallen > w1.fallen, "3 missed days: blossoms thin out, more fallen petals");
  assert.ok(w3.blossom <= 3 && w3.fallen > w2.fallen && w3.leaf < base.leaf, "7 missed days: mostly bare, petals scattered");
  assert.deepEqual(treeModel({ stage: 4, wilt: 0 }).counts, base, "recovery draws the earned stage exactly again; nothing is lost");
  assert.equal(treeModel({ stage: 2, wilt: 0, gold: 20 }).counts.gold, 8, "golden petals, up to a visible cap");
});

test("bonsai motion stops under reduced motion and when hidden; art in new files; decay rules untouched", () => {
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{\n\s+:root\[data-ui="new"\] \.ktree \.ktree-sway/);
  assert.match(css, /\.ktree\.still :is\(\.ktree-sway,\.ktree-petal,\.ktree-spark\)\{animation-play-state:paused\}/);
  assert.match(src("components/kumo/decor/GardenTree.tsx"), /visibilitychange/);
  assert.ok(fs.existsSync(path.resolve(import.meta.dirname, "../src/components/kumo/decor/treeArt.ts")));
  assert.ok(!/treeArt|GardenTree/.test(src("lib/court/garden.ts")), "the decay rules file is unchanged");
});

test("Branches follow the chart she edits: renames, edits, ticks, resets and the 2027 chart, no ticks lost", async () => {
  const { chartBranches } = await import("../src/lib/court/branchChart.ts");
  const { editCell, emptyGrid, resetToImported, chartOf } = await import("../src/lib/court/harada.ts");
  const imported = emptyGrid(); imported.pillars[0].name = "Health"; imported.pillars[1].name = "Wealth";
  let st = normalize({ defs: { grid: imported }, grid: { done: { "1.1": true, "1.2": true, "2.1": true } }, grid2027done: { "1.1": true } }, K);
  const list = [1, 2].map((n) => ({ n, name: "old", last: null, idle: 0, stage: "sprout", blossoms: 0, resting: false }));
  assert.deepEqual(chartBranches(list, st, "2026").map((b) => [b.name, b.blossoms]), [["Health", 2], ["Wealth", 1]]);
  st = { ...st, gridDefs: editCell(st.gridDefs, chartOf(st.defs.grid, st.gridDefs), { kind: "pillar", p: 0 }, { text: "Body and mind" }, "2026-10-28T01:00:00Z") };
  assert.deepEqual(chartBranches(list, st, "2026").map((b) => [b.name, b.blossoms]), [["Body and mind", 2], ["Wealth", 1]], "renamed, ticks kept");
  st = { ...st, grid: { ...st.grid, done: { ...st.grid.done, "2.5": true } } };
  assert.equal(chartBranches(list, st, "2026")[1].blossoms, 2, "a new tick shows at once");
  st = { ...st, gridDefs: resetToImported(st.gridDefs, chartOf(st.defs.grid, st.gridDefs), "x") };
  assert.equal(chartBranches(list, st, "2026")[0].name, "Health", "reset to the import");
  const y = chartBranches(list, st, "2027");
  assert.deepEqual(y.map((b) => [b.name, b.blossoms]), [["Sub-goal 1", 1], ["Sub-goal 2", 0]], "the 2027 chart and its own ticks");
  assert.equal(chartBranches(list, st, "2026")[0].blossoms, 2, "2026 ticks are untouched");
  assert.match(src("components/court/live/GrowLive.tsx"), /const list = chartBranches\(raw, st, byear\);/, "one source of truth for the Branches card");
});

test("quest switches persist under their own key and change nothing about XP", async () => {
  assert.ok(OWNED_KEYS.includes("questsOff"));
  const st = normalize({ questsOff: ["k2", "k2", "bad id", 7, "o1"] }, K);
  assert.deepEqual(st.questsOff, ["k2", "o1"]);
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(st)), K).questsOff, ["k2", "o1"], "persists through a save and reload");
  assert.deepEqual(normalize({}, K).questsOff, [], "every quest is on by default");
  const q = src("lib/court/quests.ts"), g = src("components/court/live/GrowLive.tsx");
  assert.ok(!/questsOff/.test(q) && !/questsOff/.test(src("lib/court/actions.ts")), "the XP and quest rules never read the switches");
  assert.match(g, /activeQ\(st, k\)\.filter\(\(q\) => !st\.questsOff\.includes\(q\.id\)\)/, "display only");
  assert.match(src("components/court/pages/GardenPage.tsx"), /Add your own in My habits\. Built-in quests can be switched off in Edit quests\./);
});

test("quote library: paste and upload parsing, the source switch, export, and no network", async () => {
  const { parseQuotes, quotePool, normQuotes } = await import("../src/lib/court/quoteLib.ts");
  const long = "x".repeat(200);
  const r = parseQuotes(`Stay calm | Kumo\n\n  \nStay  calm\nSmall steps count\n"Be kind" — | — Pip\n${long}`, [{ t: "Small steps count" }]);
  assert.deepEqual(r.add.map((q) => [q.t.slice(0, 10), q.a ?? null]), [["Stay calm", "Kumo"], ["Be kind\" —", "Pip"], ["xxxxxxxxxx", null]]);
  assert.equal(r.blank, 2); assert.equal(r.dup, 2); assert.equal(r.long, 1); assert.equal(r.add[2].t.length, 160);
  const csv = parseQuotes(`"Patience, then action",Olli\nOne more,`, [], true);
  assert.deepEqual(csv.add, [{ t: "Patience, then action", a: "Olli" }, { t: "One more" }]);
  assert.equal(parseQuotes("a\nb\nc", Array.from({ length: 499 }, (_, i) => ({ t: "q" + i }))).add.length, 1, "the library holds 500 at most");
  const mine = [{ t: "Mine", a: "Me" }];
  assert.deepEqual(quotePool(["B1", "B2"], mine, ["Old"], "both"), ["B1", "B2", "Old", "Mine — Me"]);
  assert.deepEqual(quotePool(["B1"], mine, [], "mine"), ["Mine — Me"]);
  assert.deepEqual(quotePool(["B1"], [], [], "mine"), ["B1"], "her set falls back to built-in when empty");
  assert.deepEqual(quotePool(["B1"], mine, [], "builtin"), ["B1"]);
  assert.ok(OWNED_KEYS.includes("quotes"), "her quotes are saved state, so Export my data includes them");
  assert.deepEqual(normalize({ quotes: { mine: [{ t: "ok" }, { t: "" }, 3], src: "weird" } }, K).quotes, { mine: [{ t: "ok" }], src: "both" });
  assert.deepEqual(normQuotes(undefined), { mine: [], src: "both" });
  for (const f of ["lib/court/quoteLib.ts", "components/court/pages/SettingsPage.tsx"]) assert.ok(!/fetch\(\s*["'`]https?:/.test(src(f)), f + " fetches nothing from the internet");
  assert.match(src("components/court/pages/SettingsPage.tsx"), /new FileReader\(\)/, "uploads are read in the browser");
});

test("Today's gratitude: saves today's entry under the existing key, edits the same day, lists and exports", async () => {
  const { gratitudePatch, gratitudeLog } = await import("../src/components/court/pages/Dungeon.tsx");
  const first = gratitudePatch(undefined, { w: "Shipped", g: "Tea", s: "Walked" });
  assert.deepEqual(first, { w: "Shipped", g: "Tea", s: "Walked" });
  const again = gratitudePatch({ ...first, n: "evening notes" }, { w: "Shipped it", g: "Tea", s: "Walked" });
  assert.deepEqual(again, { w: "Shipped it", g: "Tea", s: "Walked", n: "evening notes" }, "saving again edits today's entry and keeps the sheet's notes");
  assert.deepEqual(gratitudeLog({ [K]: again }).map((x) => [x.day, x.s]), [[K, "Walked"]]);
  const d = src("components/court/pages/Dungeon.tsx");
  assert.match(d, /update\(\(d\) => \{ d\.wins = \{ \.\.\.d\.wins, \[k\]: gratitudePatch\(d\.wins\[k\], next\) \}; \}, \["wins"\]\)/, "the same key the evening sheet uses: quest and XP behaviour unchanged");
  const t = d.slice(d.indexOf("function TodaysGratitude"), d.indexOf("export function WeeklyLookBack"));
  assert.ok(!/logQuest|levelUp|\.xp|\.streak/.test(t));
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(normalize({ wins: { [K]: again } }, K)) }, h((await import("../src/components/court/pages/Dungeon.tsx")).DungeonPage)));
  assert.match(html, /id="today-gratitude"/); assert.match(html, /value="Shipped it"/);
});

test("the Dungeon has no Research notes card; research notes data and export are unchanged", async () => {
  const { DungeonPage } = await import("../src/components/court/pages/Dungeon.tsx");
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(normalize({}, K)) }, h(DungeonPage)));
  assert.ok(!/Research notes|Saved and research|Attach/.test(html));
  const { TABLES, cleanRows } = await import("../src/lib/vault.ts");
  assert.ok(TABLES.includes("research_notes"));
  assert.equal(cleanRows("research_notes", [{ id: "n", kind: "macro", title: "Rates", text: "x" }])[0].kind, "macro");
  assert.match(src("app/api/export/route.ts"), /research_notes/);
  assert.match(src("components/court/pages/TradesPage.tsx"), /useVault<[^>]+>\("research_notes"\)/, "the macro desk still reads them");
});
