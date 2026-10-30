// Round 16: branch colours with the real stored shapes, through the same path the Garden page uses:
// user_state -> normalize() -> branches() (garden.ts, decay unchanged) -> chartBranches() -> <BranchRow>.
// Round 17: room banners fit their area (the browser checks run at four window sizes; see tests/browser/run.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { normalize } from "../src/lib/court/state.ts";
import { branches } from "../src/lib/court/garden.ts";
import { chartBranches } from "../src/lib/court/branchChart.ts";
import { BranchRow } from "../src/components/court/live/GrowLive.tsx";

const K = "2026-10-28", h = React.createElement;   // a Wednesday; the week starts Monday 2026-10-26 (SGT)
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const pillars = Array.from({ length: 8 }, (_, p) => ({ name: "Pillar " + (p + 1), acts: Array.from({ length: 8 }, (_, a) => ({ t: `Act ${p + 1}.${a + 1}`, why: "", when: "" })) }));
// the stored shapes: grid.done is { "p.a": true } (p, a from 1 to 8), written by a double press in Grid & Wins;
// watering events are { at, source: "grid", ref: "grid:p.a" } (2027: ref "grid2027:p.a")
const all8 = (p) => Object.fromEntries(Array.from({ length: 8 }, (_, a) => [`${p}.${a + 1}`, true]));
const doc = { defs: { grid: { goal: "Goal", pillars } }, grid: { done: { "2.1": true, "2.2": true, "3.1": true, "3.2": true, "3.3": true, "3.4": true, ...all8(4) } } };
const evs = [
  { at: "2026-10-27T03:00:00Z", source: "grid", ref: "grid:3.4", weight: 1 },   // this week: pillar 3 is active
  { at: "2026-10-05T03:00:00Z", source: "grid", ref: "grid:2.2", weight: 1 },   // weeks ago: pillar 2 is quiet
];
const rowsFor = (st, year, ev) => chartBranches(branches(st, K, ev).list, st, year, ev).map((b) => renderToString(h(BranchRow, { b, k: K })));
const stateOf = (html) => html.match(/data-bp="([a-z]+)"/)[1], shareOf = (html) => html.match(/--bp:(\d+)%/)?.[1];

test("2026: the real stored shape reaches every branch row with the right state and fill share", () => {
  const rows = rowsFor(normalize(doc, K), "2026", evs);
  assert.equal(rows.length, 8);
  assert.equal(stateOf(rows[0]), "idle", "pillar 1: never started, grey");
  assert.equal(stateOf(rows[1]), "quiet", "pillar 2: cells done, no activity this week, faint tint");
  assert.equal(stateOf(rows[2]), "active", "pillar 3: active this week, green fill");
  assert.equal(stateOf(rows[3]), "done", "pillar 4: all eight cells, gold edge");
  assert.deepEqual(rows.slice(0, 4).map(shareOf), ["0", "25", "50", "100"], "the fill follows the share of cells done");
  // done cells with no watering event at all still count as progress (quiet), not as never started
  assert.equal(stateOf(rowsFor(normalize(doc, K), "2026", [])[1]), "quiet");
});

test("2027: its own ticks (grid2027done) and watering refs (grid2027:p.a) colour the 2027 view", () => {
  const st = normalize({ ...doc, grid2027done: { "5.1": true, "5.2": true, ...all8(6) } }, K);
  const rows = rowsFor(st, "2027", [...evs, { at: "2026-10-28T02:00:00Z", source: "grid", ref: "grid2027:5.2", weight: 1 }]);
  assert.equal(stateOf(rows[4]), "active"); assert.equal(stateOf(rows[5]), "done");
  assert.equal(stateOf(rows[2]), "idle", "2026 activity does not colour the 2027 chart");
});

test("the colours actually paint: the branch rules outweigh the generic card rule", () => {
  const css = src("app/(court)/kumo-new.css");
  // the generic rule carries an ID's weight through :is(..., #mktWrap); the branch rules match it with :not(#kbp)
  const generic = css.indexOf(':root[data-ui="new"] :is(.gk,.gs,.gr,.jp,.jt,.sc,.lp,.quest,.joyhero,.qod,.daycard,#mktWrap)');
  assert.ok(generic > 0, "the generic rule this fix answers is still there");
  for (const s of ["idle", "quiet", "active", "done"]) {
    const at = css.indexOf(`.gbranches .gk[data-bp="${s}"]:not(#kbp){background:`);
    assert.ok(at > generic, s + ": ID weight and later in the file, so it wins");
  }
  assert.match(css, /\[data-bp="active"\]:not\(#kbp\)\{background:linear-gradient\(90deg,var\(--k-bp-fill\) 0,var\(--k-bp-fill\) max\(var\(--bp,0%\),6%\),var\(--k-surface\) calc/, "left-to-right fill by share, fading at its edge");
  assert.match(css, /\[data-bp="done"\]:not\(#kbp\)\{[^}]*--k-bp-gold/);
  const tokens = src("app/(court)/kumo-tokens.css");
  for (const t of ["--k-bp-fill", "--k-bp-quiet", "--k-bp-quiet-fill", "--k-bp-idle", "--k-bp-gold"]) assert.match(tokens, new RegExp(t + ":#"), t + " defined");
  assert.match(tokens, /data-theme="dark"\]\{--k-bp-fill:/, "night colours too");
});

test("room banners: the shared frame fits its area from tablet width up, the cap scales the whole room", () => {
  const css = src("app/(court)/kumo-new.css");
  assert.match(css, /@media \(min-width:768px\)\{\n {2}:root\[data-ui="new"\] \.kroom\{aspect-ratio:auto;height:auto;width:100%[^}]*\}\n {2}:root\[data-ui="new"\] \.kroom-scroll\{height:auto;overflow:hidden;cursor:default\}\n {2}:root\[data-ui="new"\] \.kroom-inner\{width:100%;min-width:0;height:auto;aspect-ratio:20\/3\}/);
  assert.match(css, /@media \(min-width:1200px\)\{:root\[data-ui="new"\] \.kroom\{max-width:min\(100%,calc\(\(max\(120px,100vh - 504px\) - 2 \* var\(--bw-2\)\) \* 20 \/ 3 \+ 2 \* var\(--bw-2\)\)\)\}\}/, "the short-screen cap limits width, not crops");
  assert.ok(!/\.kroom\{[^}]*max-height:max\(120px/.test(css), "the old cropping cap is gone");
  const run = fs.readFileSync(path.resolve(import.meta.dirname, "browser/run.mjs"), "utf8");
  assert.match(run, /\["1280,720", "1440,900", "1920,1080", "1024,768"\]\) for \(const hash of \["calendar", "diary", "life", "trades", "news"\]\)/, "browser checks at four sizes on all five tabs");
});
