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
  const cal = src("app/api/calendar/route.ts");
  assert.match(cal, /if \(await isOwner\(user\.id\)\) return NextResponse\.json\(\{ \.\.\.\(await loadCalendars\(\)\), google: "owner" \}/);
  assert.match(cal, /return NextResponse\.json\(await loadGoogle\(user\.id\)/, "everyone else: only their own Google Calendar");
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

test("friends never see her trading quests (display only; what quests count and award is unchanged)", async () => {
  const { QUESTS, TRADING_Q, forViewer } = await import("../src/lib/court/quests.ts");
  assert.deepEqual(TRADING_Q, ["o1", "f1", "o2"]);
  assert.equal(forViewer(QUESTS, true).length, QUESTS.length, "her own list is unchanged");
  assert.deepEqual(forViewer(QUESTS, false).map((q) => q.id), QUESTS.map((q) => q.id).filter((id) => !TRADING_Q.includes(id)));
  assert.ok(!/forViewer|TRADING_Q/.test(src("lib/court/actions.ts") + src("lib/court/state.ts")), "the XP, stars and streak rules never read it");
  const today = src("components/court/live/TodayLive.tsx");
  assert.equal((today.match(/filter\(\(x\) => owner \|\| x\.id !== "charts"\)/g) ?? []).length, 2, "no chart review idea for a friend");
  assert.match(src("components/court/live/EditGarden.tsx"), /all = forViewer\(QUESTS, useOwner\(\)\)/);
});

test("migration 0009: shared briefs readable by the owner only, inside the database", () => {
  const m = fs.readFileSync(path.resolve(import.meta.dirname, "../../../supabase/migrations/0009_briefs_owner_only.sql"), "utf8");
  assert.match(m, /using \(user_id = auth\.uid\(\) or \(user_id is null and public\.is_court_owner\(\)\)\)/);
  assert.match(m, /security definer\s+set search_path = ''/);
  assert.match(m, /order by u\.created_at asc limit 1/, "the same owner rule as the app: the first account");
  assert.match(m, /revoke all on function public\.is_court_owner\(\) from public, anon;/);
});
