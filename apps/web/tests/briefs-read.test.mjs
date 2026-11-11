// 11 Nov (her request): the Court keeps Pulse | Intelligence | Crypto scan; Pulse and Intelligence open in an easy-to-read
// view (short lead, headline, short why, small sources; full brief one tap away); News keeps Today's briefing open.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readGroups } from "../src/components/court/CourtBriefs.tsx";
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");

test("three pills on the Court: Pulse, Intelligence, Crypto scan", () => {
  assert.match(src("components/court/CourtBriefs.tsx"), /\{ key: "pulse", label: "Pulse" \}, \{ key: "intel", label: "Intelligence" \}, \{ key: "scan", label: "Crypto scan" \}/);
});

test("short on purpose: Intelligence shows its Top 5; Pulse up to 4 sections of up to 3 stories", () => {
  const intel = "## Top 5 headlines\n" + Array.from({ length: 7 }, (_, i) => `${i + 1}. **Story ${i}.** Why ${i}. [CNBC](https://x.example/${i})`).join("\n");
  const g = readGroups("intel", intel);
  assert.ok(g.length === 1 && g[0].items.length <= 5 && g[0].items.length > 0);
  const pulse = Array.from({ length: 6 }, (_, s) => `## Section ${s}\n` + Array.from({ length: 5 }, (_, i) => `- **Item ${s}.${i}** detail`).join("\n")).join("\n\n");
  const p = readGroups("pulse", pulse);
  assert.ok(p.length <= 4); for (const x of p) assert.ok(x.items.length <= 3);
});

test("News keeps Today's briefing open above the headlines", () => {
  const n = src("components/court/NewsLive.tsx");
  assert.match(n, /<section className="win kcard" id="briefingWin"/); assert.doesNotMatch(n, /<details className="win kcard" id="briefingWin"/);
});
