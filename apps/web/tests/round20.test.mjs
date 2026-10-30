// Round 20: the Dungeon scrolls like the other tabs. The one-screen fit (rounds 12 and 19) is switched off but kept,
// so the shared banner width, spacing and text apply; the look-back has normal spacing; the Gratitude log lists its
// days with no gaps and ends after the last day. The browser checks (tests/browser/run.mjs, "dunflow") measure it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const dun = src("components/court/pages/Dungeon.tsx");

test("the one-screen fit is off, its code kept", () => {
  assert.match(dun, /const DUN_FIT = false;/);
  assert.match(dun, /if \(!DUN_FIT \|\| !el /);
  assert.ok(css.includes("/* round 19: the Dungeon fits one screen"), "round 19 CSS kept (inert without .fit)");
  assert.ok(!/\.kdun-page(?!\.fit)[^{]*\.kroom\{/.test(css), "no Dungeon banner rule outside the fit mode");
});

test("Weekly look-back uses the normal card spacing", () => {
  assert.ok(!/\.kd-week[^{]*\{[^}]*gap:0/.test(css));
  assert.ok(!/\.kd-week\.kcard \.win-body\{gap:var\(--sp-1\)/.test(css));
});

test("the Gratitude log: no gaps between days, the card ends after the last day", () => {
  assert.match(dun, /<Card title="Gratitude log" sub="private, newest first" className="kgrat-log">/);
  assert.match(css, /\.kpg\.kdun>\.kd-pages>\.kgrat-log\{flex:0 0 auto\}/);
  assert.match(css, /\.kdun \.kgrat-log>\.win-body\{gap:0\}/);
  assert.match(css, /\.kdun \.kgrat-log \.kgrat \.klink-row\{min-height:0;padding:var\(--sp-2\) 0;border-bottom:0/);
  const run = fs.readFileSync(path.resolve(import.meta.dirname, "browser/run.mjs"), "utf8");
  assert.match(run, /for \(const size of \["1280,720", "1440,900", "1920,1080"\]\) runs\.push\(\{[^}]*hash: "diary", dunflow: true \}\)/);
  assert.ok(!/fit: true/.test(run), "no browser run expects the fit any more");
});
