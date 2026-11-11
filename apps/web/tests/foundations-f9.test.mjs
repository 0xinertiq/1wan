// Foundations F9: no page scrolls sideways on a phone (checked in a browser at 375, 390 and 430 on all ten tabs).
// The two fixes are phone/tablet-only CSS (under 980px), so desktop pixels cannot change.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const css = fs.readFileSync(path.resolve(import.meta.dirname, "../src/app/(court)/kumo-new.css"), "utf8");

test("the Court column may shrink to the screen on phones (the no-wrap 'Next:' line no longer widens the page)", () => {
  assert.match(css, /@media \(max-width:979px\)\{:root\[data-ui="new"\] \.khome\{grid-template-columns:minmax\(0,1fr\)\}:root\[data-ui="new"\] \.khome>\*\{min-width:0\}\}/);
});

test("a card header's pill group stays inside the card on phones", () => {
  assert.match(css, /@media \(max-width:979px\)\{:root\[data-ui="new"\] \.kcard-act\{min-width:0;max-width:100%\}\}/);
});

test("both fixes sit only under 980px", () => {
  for (const sel of [".khome{grid-template-columns", ".kcard-act{min-width:0"]) {
    const i = css.indexOf(sel); assert.ok(i > 0, sel);
    assert.equal(css.lastIndexOf("@media (max-width:979px){", i), css.lastIndexOf("@media", i), sel + " is inside the phone rule");
  }
});
