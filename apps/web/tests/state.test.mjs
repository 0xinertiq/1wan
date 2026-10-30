// State document safety: normalize, the save merge, the owned-key list, and a static check that every
// table holding user rows has row-level security plus an own-rows policy. Made-up data only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize, OWNED_KEYS } from "../src/lib/court/state.ts";
import { mergePatch } from "../src/lib/court/merge.ts";

const today = "2026-10-27";

test("normalize fills defaults for an empty or odd document", () => {
  for (const raw of [null, undefined, 42, "x", [], {}]) {
    const st = normalize(raw, today);
    assert.equal(st.v, 1);
    assert.equal(st.day, today);
    assert.deepEqual(st.q, {});
    assert.deepEqual(st.spr, { run: null, log: [] });
    assert.equal(st.birth, null);
    assert.equal(st.mny.hideNw, true);
  }
});

test("normalize drops malformed entries and keeps good ones", () => {
  const st = normalize({ lvl: "9", tails: [0, 3, 9, 1.5, -1], spr: { run: { at: 5 }, log: [{ at: "2026-10-27T01:00:00Z", tag: "study", min: 25 }, { at: 1 }, { at: "x", tag: "hack", min: 25 }] },
    tg: { channels: [{ handle: "ok", enabled: true }, { nope: 1 }] }, birth: { date: "2000-01-01", lat: "1", lon: 2 } }, today);
  assert.equal(st.lvl, 1);
  assert.deepEqual(st.tails, [0, 3]);
  assert.equal(st.spr.run, null);
  assert.deepEqual(st.spr.log.map((s) => s.tag), ["study", "other"]);
  assert.equal(st.tg.channels.length, 1);
  assert.equal(st.birth, null);
});

test("save merge replaces owned keys and leaves the rest untouched", () => {
  const owned = new Set(OWNED_KEYS);
  const doc = { q: { a: [1, 1] }, streak: 3, defs: { grid: "private" }, other: "kept" };
  const r = mergePatch(doc, { streak: 4 }, owned);
  assert.equal(r.ok, true);
  assert.deepEqual(r.merged, { q: { a: [1, 1] }, streak: 4, defs: { grid: "private" }, other: "kept" });
  assert.deepEqual(doc.streak, 3, "input not mutated");
});

test("save merge refuses keys the page does not own, and bad patches", () => {
  const owned = new Set(OWNED_KEYS);
  for (const p of [{ defs: {} }, { streak: 1, user_id: "x" }, { __proto__x: 1 }]) assert.equal(mergePatch({}, p, owned).ok, false);
  for (const p of [null, [], "x", 3]) assert.equal(mergePatch({}, p, owned).ok, false);
  assert.equal(mergePatch(null, { streak: 1 }, owned).ok, true);
});

test("OWNED_KEYS: no duplicates, never the private imported keys", () => {
  assert.equal(new Set(OWNED_KEYS).size, OWNED_KEYS.length);
  for (const k of ["defs", "user_id", "version"]) assert.ok(!OWNED_KEYS.includes(k), k);
  for (const k of ["q", "spr", "samsara", "birth", "packet"]) assert.ok(OWNED_KEYS.includes(k), k);
});

test("every table with user rows has RLS and an own-rows policy", () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../supabase/migrations");
  const sql = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n")
    .replace(/--[^\n]*/g, "").replace(/\s+/g, " ").toLowerCase();
  const tables = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+) \((.*?)\);/g)].filter((m) => /\buser_id\b/.test(m[2])).map((m) => m[1]);
  assert.ok(tables.length >= 12, "found " + tables.length + " tables");
  for (const t of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`), `${t}: RLS`);
    const pols = [...sql.matchAll(new RegExp(`create policy "[^"]+" on public\\.${t} (.*?);`, "g"))].map((m) => m[1]);
    assert.ok(pols.some((p) => /user_id = auth\.uid\(\)/.test(p)), `${t}: own-rows policy`);
  }
});

// Optional life-admin flags (owner approved, round 5b): backwards compatible, no rewrite of existing items.
test("normalize keeps life items without flags exactly as they were", async () => {
  const { normalize } = await import("../src/lib/court/state.ts");
  const it = { id: "a", name: "Dog grooming", cat: "pet", amt: null, rule: { type: "dom", d: 3 }, lead: 2 };
  const st = normalize({ life: [it] }, "2026-10-28");
  assert.deepEqual(st.life[0], it);
  assert.equal("autoPaid" in st.life[0], false);
  assert.equal("important" in st.life[0], false);
});

test("normalize keeps true/false flags and drops anything else", async () => {
  const { normalize } = await import("../src/lib/court/state.ts");
  const base = { cat: "bill", amt: 10, rule: { type: "dom", d: 1 }, lead: 0 };
  const st = normalize({ life: [{ ...base, id: "a", name: "Spotify", autoPaid: false, important: true }, { ...base, id: "b", name: "Rent", autoPaid: "yes", important: 1 }] }, "2026-10-28");
  assert.equal(st.life[0].autoPaid, false);
  assert.equal(st.life[0].important, true);
  assert.equal("autoPaid" in st.life[1], false);
  assert.equal("important" in st.life[1], false);
});

// Round 6: two new optional keys. Older documents (no prefs, no hab) load with safe empty defaults; odd values are dropped.
test("normalize: prefs and hab default safely and keep only well-formed values", async () => {
  const { normalize, OWNED_KEYS } = await import("../src/lib/court/state.ts");
  const old = normalize({ streak: 2 }, "2026-10-28");
  assert.deepEqual(old.prefs, {});
  assert.deepEqual(old.hab, { list: [], log: {} });
  const st = normalize({
    prefs: { lens: "weird", rooms: { journal: true, money: "yes" }, notif: { morning: true }, name: 7, onboarded: "2026-10-28" },
    hab: { list: [{ id: "h1", name: "Stretch", days: [1, 3, 9, "x"], paused: "no" }, { name: "no id" }], log: { "2026-10-28": ["h1", 3], bad: ["h1"] } },
  }, "2026-10-28");
  assert.deepEqual(st.prefs, { rooms: { journal: true }, notif: { morning: true }, onboarded: "2026-10-28" });
  assert.deepEqual(st.hab.list, [{ id: "h1", name: "Stretch", days: [1, 3], at: "" }]);
  assert.deepEqual(st.hab.log, { "2026-10-28": ["h1"] });
  assert.equal(normalize({ prefs: { lens: "off" } }, "2026-10-28").prefs.lens, "off");
  assert.ok(OWNED_KEYS.includes("prefs") && OWNED_KEYS.includes("hab"));
});
