// Round 22: two devices. merge3 (lib/court/merge.ts) keeps both devices' ticks, and /api/state refuses a save made
// from an out-of-date copy, answering with the newer copy instead (tested with a stand-in database).
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { merge3, same } from "../src/lib/court/merge.ts";

test("ticks on two devices both survive: each quest, day and garden change is kept", () => {
  const base = { q: { m1: [1, 10] }, days: { "2026-11-01": { d: 3 } }, gd: { water: 2, seeds: [] } };
  const phone = { q: { m1: [1, 10], k7: [1, 25] }, days: { "2026-11-01": { d: 3 }, "2026-11-02": { d: 1 } }, gd: { water: 3, seeds: [] } };
  const laptop = { q: { m1: [1, 10], l2: [1, 15] }, days: { "2026-11-01": { d: 3 } }, gd: { water: 2, seeds: [{ id: "s1" }] } };
  const m = merge3(base, phone, laptop);
  assert.deepEqual(m.q, { m1: [1, 10], k7: [1, 25], l2: [1, 15] });
  assert.deepEqual(Object.keys(m.days).sort(), ["2026-11-01", "2026-11-02"]);
  assert.deepEqual(m.gd, { water: 3, seeds: [{ id: "s1" }] });
});

test("a side that did not change takes the other side's change, including a removal", () => {
  assert.equal(merge3(1, 1, 5), 5);
  assert.equal(merge3(1, 4, 1), 4);
  assert.deepEqual(merge3({ a: 1, b: 2 }, { a: 1 }, { a: 1, b: 2 }), { a: 1 }, "removed here, untouched there: removed");
  assert.deepEqual(merge3({ a: 1 }, { a: 1 }, { a: 1, c: 3 }), { a: 1, c: 3 });
});

test("lists of items with an id merge item by item; other lists and values keep this device's change", () => {
  const base = [{ id: "a", t: "call mum", done: false }];
  const here = [{ id: "a", t: "call mum", done: true }];
  const there = [{ id: "a", t: "call mum", done: false }, { id: "b", t: "buy rice", done: false }];
  assert.deepEqual(merge3(base, here, there), [{ id: "a", t: "call mum", done: true }, { id: "b", t: "buy rice", done: false }]);
  assert.deepEqual(merge3(base, [], there), [{ id: "b", t: "buy rice", done: false }], "deleted here stays deleted");
  assert.deepEqual(merge3(["x"], ["y"], ["z"]), ["y"]);
  assert.equal(merge3(10, 12, 15), 12);
  assert.ok(same({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }) && !same({ a: 1 }, { a: 1, b: 2 }));
});

// /api/state with a stand-in database: one user_state row at version 5.
let row = null, updates = 0;
const fakeDb = {
  auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
  from: () => {
    const q = {
      _upd: null, select() { return q; }, eq() { return q; },
      maybeSingle: async () => ({ data: row && { data: row.data, version: row.version }, error: null }),
      insert: async (r) => { row = { data: r.data, version: r.version }; return { error: null }; },
      update(u) { q._upd = u; return q; },
      then(res) { updates++; row = { data: q._upd.data, version: q._upd.version }; return Promise.resolve({ data: [{ version: q._upd.version }], error: null }).then(res); },
    };
    return q;
  },
};
globalThis.__fakeDb = fakeDb;
const FAKE = "data:text/javascript," + encodeURIComponent("export const createClient = async () => globalThis.__fakeDb;");
registerHooks({ resolve: (spec, ctx, next) => (spec === "@/lib/supabase/server" ? { url: FAKE, shortCircuit: true } : next(spec === "next/server" ? "next/server.js" : spec, ctx)) });
const { POST } = await import("../src/app/api/state/route.ts");
const post = async (body) => { const r = await POST(new Request("https://x/api/state", { method: "POST", body: JSON.stringify(body) })); return { status: r.status, j: await r.json() }; };

test("/api/state: a save from an out-of-date copy is refused with the newer copy; an up-to-date save merges", async () => {
  row = { data: { q: { k7: [1, 25] }, streak: 4, defs: { keep: true } }, version: 5 };
  updates = 0;
  const old = await post({ version: 4, patch: { q: { m1: [1, 10] } } });
  assert.equal(old.status, 409);
  assert.equal(old.j.stale, true);
  assert.equal(old.j.version, 5);
  assert.deepEqual(old.j.data.q, { k7: [1, 25] });
  assert.equal(updates, 0, "nothing written");
  const ok = await post({ version: 5, patch: { q: { k7: [1, 25], m1: [1, 10] } } });
  assert.equal(ok.status, 200);
  assert.equal(ok.j.version, 6);
  assert.deepEqual(row.data, { q: { k7: [1, 25], m1: [1, 10] }, streak: 4, defs: { keep: true } }, "other keys untouched");
});

test("/api/state: a brand-new account with no saved row is created", async () => {
  row = null;
  const r = await post({ version: 0, patch: { streak: 1 } });
  assert.equal(r.status, 200);
  assert.deepEqual(row, { data: { streak: 1 }, version: 1 });
});
