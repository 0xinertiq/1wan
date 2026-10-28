// Grid & Wins as a Harada chart (round 6, addendum 1): edits keep tick ids, undo and history, reset, the wizard's
// fill-empty rule, and the optional gridDefs key defaulting safely. Made-up chart text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../src/lib/court/state.ts";
import { chartOf, cleanGrid, editCell, emptyGrid, fillEmpty, hasChart, normGridDefs, resetToImported, undo, tickId, HIST_MAX } from "../src/lib/court/harada.ts";

const IMPORTED = { goal: "A calm, funded life", pillars: Array.from({ length: 8 }, (_, i) => ({ name: "Pillar " + (i + 1), acts: Array.from({ length: 8 }, (_, j) => ({ t: `Act ${i + 1}.${j + 1}`, why: "why", when: "weekly" })) })) };
const AT = "2026-10-28T03:00:00Z";

test("older documents load with an empty gridDefs; odd values are dropped", () => {
  assert.deepEqual(normalize({}, "2026-10-28").gridDefs, { cur: null, hist: [], draft: null });
  const d = normGridDefs({ cur: "x", hist: [{ at: 1, g: {} }, { at: AT, g: { goal: "G" } }], draft: { step: 99, g: { goal: "D" } } });
  assert.equal(d.cur, null); assert.equal(d.hist.length, 1); assert.equal(d.draft.step, 9);
  assert.equal(cleanGrid({ goal: "x".repeat(500) }).goal.length, 120);
});

test("editing a cell persists in her own version, keeps the original and the tick ids", () => {
  const st = normalize({ defs: { grid: IMPORTED }, grid: { done: { "3.4": true } } }, "2026-10-28");
  const base = chartOf(st.defs.grid, st.gridDefs);
  const gd = editCell(st.gridDefs, base, { kind: "act", p: 2, a: 3 }, { text: "Reworded action" }, AT);
  const saved = normalize({ defs: { grid: IMPORTED }, grid: st.grid, gridDefs: gd }, "2026-10-28");
  assert.equal(chartOf(saved.defs.grid, saved.gridDefs).pillars[2].acts[3].t, "Reworded action");
  assert.equal(saved.defs.grid.pillars[2].acts[3].t, "Act 3.4", "imported chart untouched");
  assert.equal(saved.grid.done[tickId(2, 3)], true, "tick stays on the same cell");
});

test("the centre block and each block's middle cell read the same sub-goal", () => {
  const gd = editCell(normGridDefs(null), cleanGrid(IMPORTED), { kind: "pillar", p: 4 }, { text: "Health" }, AT);
  const g = chartOf(IMPORTED, gd);
  assert.equal(g.pillars[4].name, "Health"); // one field feeds both cells, so they cannot drift apart
});

test("undo, version history (last 5) and reset to the imported chart", () => {
  let gd = normGridDefs(null);
  for (let i = 0; i < 7; i++) gd = editCell(gd, chartOf(IMPORTED, gd), { kind: "goal" }, { text: "Goal v" + i }, AT);
  assert.equal(gd.hist.length, HIST_MAX);
  assert.equal(chartOf(IMPORTED, gd).goal, "Goal v6");
  gd = undo(gd, IMPORTED);
  assert.equal(chartOf(IMPORTED, gd).goal, "Goal v5");
  gd = resetToImported(gd, chartOf(IMPORTED, gd), AT);
  assert.equal(chartOf(IMPORTED, gd).goal, "A calm, funded life");
  assert.equal(gd.hist[0].g.goal, "Goal v5", "her version is kept in history");
  let one = editCell(normGridDefs(null), cleanGrid(IMPORTED), { kind: "goal" }, { text: "x" }, AT);
  one = undo(one, IMPORTED);
  assert.equal(one.cur, null, "undoing back to the original clears the override");
});

test("the wizard fills empty cells only on an existing chart; a new user gets the whole wizard chart", () => {
  const partial = cleanGrid({ goal: "Mine", pillars: [{ name: "Keep", acts: [{ t: "Keep me" }] }] });
  const w = cleanGrid({ goal: "Wizard", pillars: Array.from({ length: 8 }, (_, i) => ({ name: "W" + i, acts: Array.from({ length: 8 }, (_, j) => ({ t: `w${i}.${j}` })) })) });
  const f = fillEmpty(partial, w);
  assert.equal(f.goal, "Mine"); assert.equal(f.pillars[0].name, "Keep"); assert.equal(f.pillars[0].acts[0].t, "Keep me");
  assert.equal(f.pillars[0].acts[1].t, "w0.1"); assert.equal(f.pillars[7].name, "W7");
  assert.equal(fillEmpty(null, w).goal, "Wizard");
  assert.equal(hasChart(chartOf(undefined, normGridDefs(null))), false, "no chart: the wizard's first-run state");
  assert.equal(hasChart(emptyGrid()), false);
});
