// Bigdata.com is permanently disconnected: the display layer removes every mention (lib/noBigdata.ts).
// Made-up sample text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { noBigdata } from "../src/lib/noBigdata.ts";

const sample = [
  "Daily Intel Brief",
  "",
  "Markets are calm. Bigdata.com was unavailable, so this run used RSS only. Gold is up.",
  "## Asia",
  "**Kospi rallies.** Chips lead. — [CNBC](https://a.example), [Bigdata.com](https://bigdata.com/x)",
  "- BigData search returned nothing today",
  "- A normal bullet",
  "| Source | Status |",
  "| bigdata | failed |",
  "| RSS | ok |",
  "**Gaps:** Bigdata.com unavailable; used web search.",
  "**Gaps:** BIGDATA down",
  "Sources: Bigdata.com, CNBC, Kitco",
  "Sources used: web search (Bigdata unavailable)",
  "## Bigdata notes",
].join("\n");

test("removes every Bigdata mention and keeps the rest", () => {
  const out = noBigdata(sample);
  assert.equal(/big\s*data/i.test(out), false);
  const L = out.split("\n");
  assert.ok(L.includes("Markets are calm. Gold is up."));
  assert.ok(L.includes("**Kospi rallies.** Chips lead. — [CNBC](https://a.example)"));
  assert.ok(L.includes("- A normal bullet"));
  assert.ok(L.includes("| RSS | ok |"));
  assert.ok(L.includes("**Gaps:** used web search."));
  assert.ok(L.includes("Sources: CNBC, Kitco"));
  assert.ok(L.includes("Sources used: web search"));
  assert.ok(!L.some((l) => /^\*\*Gaps:\*\*\s*$/.test(l)));
});

test("leaves text without Bigdata untouched", () => {
  const t = "**Fed holds.** Why it matters. — [Reuters](https://r.example)\n\n| a | b |";
  assert.equal(noBigdata(t), t);
  assert.equal(noBigdata(null), null);
});
