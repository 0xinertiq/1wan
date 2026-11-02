// Round 22: friends never see or load her personal content (briefs, Trades, prices, releases, technicals, the weekly
// review). The browser check (tests/browser/run.mjs, "friend") renders a friend's Court and fails on any of it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");

test("the dashboard reads her briefs and desk notes only for the owner", () => {
  const p = src("app/(court)/dashboard/page.tsx");
  assert.match(p, /const owner = await isOwner\(user\.id\);/);
  assert.match(p, /owner \? await loadBriefs\(supabase, user\.id\) : \{ rows: \[\]/);
  assert.match(p, /owner \? await supabase\.from\("agent_memory"\)/);
  assert.match(p, /\{owner && <PricesLoader /);
  assert.match(p, /trades: owner && \(/);
  for (const slot of ["brief", "scan", "tech", "econ"]) assert.match(p, new RegExp(`\\b${slot}: owner && `), slot);
  assert.match(p, /<OwnerProvider value=\{owner\}>/);
});

test("the owner check fails closed and the calendar route uses it", () => {
  assert.match(src("lib/owner.ts"), /return !!db && userId === \(await ownerId\(db\)\);/);
  assert.match(src("app/api/calendar/route.ts"), /if \(!\(await isOwner\(user\.id\)\)\) return NextResponse\.json\(\{ state: "off"/);
});

test("friends never fetch the release calendar or see prices, Telegram or the weekly review", () => {
  assert.match(src("components/court/live/EconLive.tsx"), /if \(!owner\) \{ setR\(\{ items: \[\], ok: true, at: "" \}\); return; \}/);
  const home = src("components/court/live/KumoHome.tsx");
  assert.match(home, /\{owner && <B n="Prices">/);
  assert.match(home, /\{owner && <B n="Next release">/);
  const set = src("components/court/pages/SettingsPage.tsx");
  assert.match(set, /\{owner && <Card title="News and Telegram">/);
  assert.match(set, /\{owner && <Card title="Kumo's weekly review"/);
});

test("switching the tables on copies this device's records into the account, never deleting the device copy", async () => {
  const { toMove } = await import("../src/lib/vault.ts");
  const r = (id, up) => ({ id, at: "2026-10-01T00:00:00Z", up });
  const local = [r("a", "2026-10-05"), r("b", "2026-10-02"), r("c", "2026-10-09")];
  const inDb = [r("b", "2026-10-03"), r("c", "2026-10-01")];
  assert.deepEqual(toMove(local, inDb).map((x) => x.id), ["a", "c"], "new here, or newer here; an older copy never overwrites the account");
  assert.deepEqual(toMove([], inDb), []);
  const v = src("lib/vault.ts");
  assert.ok(!/localStorage\.removeItem/.test(v), "the device copy is never deleted");
  assert.match(v, /if \(localStorage\.getItem\(movedKey\(uid, t\)\)\) return inDb;/, "copied once per account");
  assert.match(v, /if \(error\) return inDb;/, "a failed copy is tried again next load");
});
