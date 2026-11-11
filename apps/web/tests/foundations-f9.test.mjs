// Foundations F9: no page scrolls sideways on a phone (checked in a browser at 375, 390 and 430 on all ten tabs).
// The two fixes are phone/tablet-only CSS (under 980px), so desktop pixels cannot change.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const css = fs.readFileSync(path.resolve(import.meta.dirname, "../src/app/(court)/kumo-new.css"), "utf8");

test("the Court column is never wider than the page, at any width (a long watchlist made it 1867px at 1440)", () => {
  assert.match(css, /:root\[data-ui="new"\] \.khome\{grid-template-columns:minmax\(0,1fr\)\}:root\[data-ui="new"\] \.khome>\*\{min-width:0\}/);
});

test("a card header's pill group stays inside the card on phones (phone-only rule)", () => {
  assert.match(css, /@media \(max-width:979px\)\{:root\[data-ui="new"\] \.kcard-act\{min-width:0;max-width:100%\}\}/);
});
