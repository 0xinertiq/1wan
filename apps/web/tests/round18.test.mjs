// Round 18: no room banner on phones; the Dungeon calendar's entry hearts; Luna's labelled rows on one shared label
// column; the Dungeon's new column order with a compact Weekly look-back. The browser checks (tests/browser/run.mjs)
// measure the banners at phone width, Luna's rows at five widths and the Dungeon at three desktop sizes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { MiniMonth } from "../src/components/court/pages/CalendarPage.tsx";

const h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const ctx = (k) => ({ st: normalize({}, k), k, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const html = (k, el) => renderToString(h(CourtCtx.Provider, { value: ctx(k) }, el)).replace(/<!-- -->/g, "");
// the cell for day n of the shown month (skipping the leading days of the month before)
const cellOf = (out, n) => out.match(new RegExp(`<button type="button" class="((?!out )[^"]*)"[^>]*>((?:(?!</button>).)*?<span>${n}</span>)</button>`))?.slice(1);

test("phones: no room banner below tablet width; the banner code stays", () => {
  assert.match(css, /@media \(max-width:767px\)\{:root\[data-ui="new"\] \.kroom\{display:none\}\}/);
  assert.ok(!/\.kroom\{aspect-ratio:auto;height:160px\}/.test(css), "the swipe strip is gone");
  for (const f of ["RoomFrame", "roomKit", "room2Dungeon", "room2Life", "room2Trades", "room2News", "ClockRoom"]) assert.ok(fs.existsSync(path.resolve(import.meta.dirname, "../src/components/kumo/decor", f + ".tsx")), f + " kept");
  assert.match(css, /@media \(min-width:768px\)\{\n {2}:root\[data-ui="new"\] \.kroom\{aspect-ratio:auto/, "tablet and desktop unchanged");
});

test("Dungeon calendar: entry days get a faint heart behind the number and no dot; today's heart wins", () => {
  const k = "2026-10-28", entries = new Set(["2026-10-05", "2026-10-28"]);
  const out = html(k, h(MiniMonth, { marks: (d) => entries.has(d), onPick() {}, picked: "2026-10-20", mark: "heart" }));
  const [cls5, in5] = cellOf(out, 5);
  assert.ok(cls5.split(" ").includes("has-heart") && !cls5.split(" ").includes("has"), "an entry day: no dot class");
  assert.match(in5, /^<svg class="kheart-entry"[^>]*>.*<\/svg><span>5<\/span>$/, "the heart comes first, behind the number");
  const [cls28, in28] = cellOf(out, 28);
  assert.match(cls28, /is-today/);
  assert.match(in28, /^<svg class="kheart"/, "today with an entry shows today's heart");
  assert.ok(!in28.includes("kheart-entry"), "and not the entry heart as well");
  const [, in6] = cellOf(out, 6);
  assert.ok(!in6.includes("<svg"), "an empty day has no heart");
  // the faint heart: transparent pink, 30 to 40 percent, no plum outline; the number sits above it
  const op = css.match(/\.kheart-entry\{[^}]*opacity:([.\d]+)/);
  assert.ok(op && +op[1] >= 0.3 && +op[1] <= 0.4, "30 to 40 percent opacity");
  assert.match(css, /\.kheart-entry rect\{fill:var\(--k-btn-line\)\}/);
  assert.match(css, /\.kmini button>span\{position:relative\}/);
  // entry detection is untouched: the Dungeon still passes the same marks function
  assert.match(src("components/court/pages/Dungeon.tsx"), /<MiniMonth marks=\{has\} picked=\{day\} onPick=\{\(d\) => setDay\(d\)\} label="Journal month" mark="heart" \/>/);
});

test("other mini months keep their dots", () => {
  const k = "2026-10-28";
  const out = html(k, h(MiniMonth, { marks: (d) => d === "2026-10-05", onPick() {}, picked: null }));
  const [cls5, in5] = cellOf(out, 5);
  assert.ok(cls5.split(" ").includes("has"));
  assert.ok(!in5.includes("<svg"));
  assert.match(css, /\.kmini button\.has::after\{content:""/);
});

test("Luna's rows: one label column for every row, content on its own column, stacked only when narrow", () => {
  assert.match(css, /\.kluna-strips\{grid-template-columns:max-content minmax\(0,1fr\);container-type:inline-size\}/);
  assert.match(css, /\.kluna-strip\{grid-column:1\/-1;grid-template-columns:subgrid\}/);
  assert.match(css, /@container \(max-width:299px\)\{:root\[data-ui="new"\] \.kluna-strip\{grid-template-columns:minmax\(0,1fr\)\}\}/);
  const home = src("components/court/live/KumoHome.tsx");
  assert.match(home, /<p className="kluna-strip lean"><b>The day leans toward<\/b><span>/, "text unchanged");
  assert.match(home, /<p className="kluna-strip ease"><b>Be gentle with<\/b><span>/);
});

test("Dungeon columns: look-back, Your pages, Gratitude log | Today's page | Today's gratitude, mood and tags, reflection", () => {
  const d = src("components/court/pages/Dungeon.tsx");
  const page = d.slice(d.indexOf("export function DungeonPage"));
  const left = page.slice(page.indexOf('<div className="kcol kd-pages">'), page.indexOf('<div className="kcol kd-edit">'));
  const order = (s, names) => names.map((n) => s.indexOf(n));
  const l = order(left, ["<WeeklyLookBack />", '<Card title="Your pages"', "<GratitudeLog />"]);
  assert.ok(l.every((i) => i >= 0) && l[0] < l[1] && l[1] < l[2], "left column order");
  const right = page.slice(page.indexOf('<div className="kcol kd-side">'));
  assert.match(right, /^<div className="kcol kd-side"><TodaysGratitude \/><Side /, "right: Today's gratitude, then mood and tags and trade reflection");
  assert.ok(!right.includes("WeeklyLookBack"));
  assert.ok(d.indexOf('<Card title="Mood and tags">') < d.indexOf('<Card title="Trade reflection"'));
  // Download my diary and the Archive bar stay as they were, inside Your pages
  assert.match(left, /<Btn kind="sm ghost" onClick=\{\(\) => downloadDiary\(st, k\)\}>Download my diary<\/Btn><\/div>\n\s*<Archive \/>/);
  // the compact look-back: same lines and closing sentence, tighter spacing
  assert.match(d, /"Steady beats loud\. Whatever you wrote this week counts\." : "The week is open\. One line is enough\."/);
  assert.match(css, /\.kdun \.kd-week\.kcard \.win-body\{gap:var\(--sp-1\)/);
  const run = fs.readFileSync(path.resolve(import.meta.dirname, "browser/run.mjs"), "utf8");
  assert.match(run, /nobanner: true/); assert.match(run, /luna: true/);
});
