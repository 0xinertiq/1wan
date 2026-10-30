// Round 21: the Dungeon follows Life Hub. One Journal panel (the shared Card, like Life Hub's "Life admin and money")
// holds three columns split by .ksplit's dashed line; each section wears Life Hub's small heading (sec-h); the
// Gratitude log is one compact, closed row per day that opens on a tap. The browser checks (tests/browser/run.mjs,
// "dunflow" with the "grat" sample) measure the banner against Life Hub's, the rows and the opened entry.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { DungeonPage } from "../src/components/court/pages/Dungeon.tsx";

const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const dun = src("components/court/pages/Dungeon.tsx");
const k = "2026-10-30";
const wins = { "2026-10-29": { w: "Closed the week calmly\nand a second line", g: "Quiet mornings" }, "2026-10-27": { w: "Slept well" } };
const ctx = { st: normalize({ wins }, k), k, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} };
const html = renderToString(React.createElement(CourtCtx.Provider, { value: ctx }, React.createElement(DungeonPage))).replace(/<!-- -->/g, "");

test("one Journal panel with three .ksplit columns, every section kept", () => {
  assert.match(html, /<section class="win kcard kfull kdun-panel"/);
  assert.match(html, /<div class="ksplit kdun"><div class="ksplit-col kd-pages">/);
  for (const t of ["Weekly look-back", "Your pages", "Gratitude log", "Today&#x27;s page", "Today&#x27;s gratitude", "Mood and tags", "Trade reflection"]) assert.ok(html.includes(`class="sec-h"`) && html.includes(`>${t}</h3>`), t);
  assert.ok(html.includes("Download my diary") && dun.includes("<Archive />"));
  assert.ok(!/<section class="win kcard (?!kfull kdun-panel)/.test(html), "no card inside the panel; sections instead");
  assert.match(dun, /<Callout tone="lav">Private to you\./);
});

test("the Gratitude log: one closed row per day, newest first, the first line only", () => {
  const rows = [...html.matchAll(/<button type="button" class="kgrat-row" aria-expanded="(\w+)">.*?<b>([^<]+)<\/b><span class="kgrat-first">([^<]*)<\/span><\/button>/g)];
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r[1] === "false"), "all closed at first");
  assert.match(rows[0][2], /29 Oct/); assert.match(rows[1][2], /27 Oct/);
  assert.equal(rows[0][3], "Closed the week calmly", "first line only");
  assert.ok(!html.includes("kgrat-read"), "no entry open");
  assert.match(css, /\.kgrat-first\{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis/);
  assert.match(css, /\.kdun \.kgrat-list\{display:grid\}/);
});

test("look-back breathes; the banner and headings come from the shared rules only", () => {
  assert.match(css, /\.kdun \.kd-week \.rv-sug\{gap:var\(--sp-3\);line-height:1\.6/);
  assert.ok(!/\.kdun-page(?!\.fit)[^{]*\.kroom\{/.test(css), "no Dungeon-only banner rule");
  assert.match(css, /\.ksplit\.kdun>\.kd-edit>\.kjournal>textarea:not\(\[type\]\)\{min-height:360px\}/);
});
