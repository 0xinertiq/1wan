// Round 19 (switched off in round 20, code kept): the Dungeon fits one screen from 900px tall windows. The browser checks (tests/browser/run.mjs,
// "nocolscroll") measure the page and every column at 1440x900, 1920x1080 and 1280x900, also with a full
// six-line look-back; 1280x720 keeps the page-never-scrolls check.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const block = css.slice(css.indexOf("/* round 19: the Dungeon fits one screen"));

test("the Dungeon gets its own shorter banner; the other banners keep the shared cap", () => {
  assert.match(block, /\.kdun-page\.fit\{--dun-room:clamp\(56px,100vh - 750px,150px\)/);
  assert.match(block, /\.kdun-page\.fit \.kroom\{max-width:min\(100%,calc\(\(var\(--dun-room\) - 2 \* var\(--bw-2\)\) \* 20 \/ 3 \+ 2 \* var\(--bw-2\)\)\)\}/, "scaled by width at 20:3, so the whole room shows");
  assert.match(css, /@media \(min-width:1200px\)\{:root\[data-ui="new"\] \.kroom\{max-width:min\(100%,calc\(\(max\(120px,100vh - 504px\) - 2 \* var\(--bw-2\)\) \* 20 \/ 3 \+ 2 \* var\(--bw-2\)\)\)\}\}/, "shared cap unchanged");
  for (const line of block.split("\n").filter((l) => l.includes(".kroom"))) assert.match(line, /\.kdun-page\.fit \.kroom\{/, "only the Dungeon's banner is touched");
});

test("only the Gratitude log's list scrolls inside its card; the writing areas flex", () => {
  assert.match(block, /\.kd-pages>:last-child>\.win-body\{flex:1 1 auto;min-height:0;overflow-y:auto/);
  assert.equal([...block.matchAll(/overflow-y:auto/g)].length, 1, "no other inner scroll added");
  assert.match(block, /\.kd-side>:last-child textarea\{flex:1 1 auto;min-height:32px\}/);
  assert.match(css, /\.kdun-page\.fit \.kd-edit>\.kjournal textarea\{min-height:0\}/, "Today's page fills the middle column");
});

test("every card stays: left look-back, Your pages, Gratitude log; middle Today's page; right three", () => {
  const d = src("components/court/pages/Dungeon.tsx");
  const page = d.slice(d.indexOf("export function DungeonPage"));
  for (const c of ["<WeeklyLookBack />", '<Card title="Your pages"', "<GratitudeLog />", "<Editor ", "<TodaysGratitude />", "<Side "]) assert.ok(page.includes(c), c);
  assert.match(page, /actions=\{<TabPills label="Pages" value=\{tab\}/, "the Month / List switch sits in the header row");
  assert.match(page, /Download my diary<\/Btn><\/div>\n\s*<Archive \/>/);
  // (round 20: the fit is off and its browser runs replaced; tests/round20.test.mjs)
});
