// A friend reads only the shared Pulse and Intelligence briefs; never the scan, movers, review or another account's rows.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sharedRows, FRIEND_KINDS } from "../src/lib/briefs.ts";

const r = (kind, at, extra = {}) => ({ kind, title: kind, body: "Body", at, user_id: null, ...extra });

test("only the newest shared Pulse and Intelligence are returned, in that order", () => {
  const rows = sharedRows([r("scan", "2026-11-12T03:00:00Z"), r("daily", "2026-11-12T00:00:00Z"), r("weekday", "2026-11-12T01:00:00Z"), r("intel", "2026-11-11T00:00:00Z"), r("review", "2026-11-09T00:00:00Z"), r("movers", "2026-11-12T06:00:00Z")]);
  assert.deepEqual(rows.map((x) => x.kind), ["pulse", "intel"]);
  assert.equal(rows[1].at, "2026-11-12T00:00:00Z");
});

test("rows written for a specific account are not part of the shared set", () => {
  assert.deepEqual(sharedRows([r("pulse", "2026-11-12T01:00:00Z", { user_id: "someone" })]), []);
});

test("the friend kinds are exactly Pulse and Intelligence", () => assert.deepEqual(FRIEND_KINDS, ["pulse", "intel"]));

test("the dashboard reads shared briefs for friends on the server only, and the Crypto scan pill is hidden for them", () => {
  const page = fs.readFileSync(new URL("../src/app/(court)/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(page, /owner \? null : createAdminClient\(\)/);
  const line = page.slice(page.indexOf("const friendBriefs"), page.indexOf("const friendBriefs") + 160);
  assert.ok(line && !/scan/.test(line));
  const blk = fs.readFileSync(new URL("../src/components/court/CourtBriefs.tsx", import.meta.url), "utf8");
  assert.match(blk, /shared \? TABS\.filter\(\(t\) => t\.key !== "scan"\)/);
});
