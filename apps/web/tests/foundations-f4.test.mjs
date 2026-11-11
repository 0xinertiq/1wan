// Foundations F4: one journal record per day (win, thanks, mood) in her synced wins record; old diary moods read as
// they are; device-only Dungeon moods copied in once; picking today's mood counts Luna's mood quest.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { OWNED_KEYS, normalize } from "../src/lib/court/state.ts";
import { journalDay, moodOf, moodsToCopy, setMood, wroteOn } from "../src/lib/court/journal.ts";
import { questEvt } from "../src/lib/court/actions.ts";
import { lookBack } from "../src/components/court/pages/Dungeon.tsx";

const K = "2026-11-11";
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");

test("the journal record lives in wins, which is already a saved key; no new key", () => {
  assert.ok(OWNED_KEYS.includes("wins"));
  assert.ok(!OWNED_KEYS.includes("mood"), "the old imported moods stay read-only");
});

test("one record per day: win, thanks and mood together; other fields kept", () => {
  const st = normalize({ wins: { [K]: { w: "Shipped it", g: "Sun", n: "note" } } }, K);
  setMood(st, K, 4);
  assert.deepEqual(st.wins[K], { w: "Shipped it", g: "Sun", n: "note", m: 4 });
  assert.deepEqual(journalDay(st, K, { text: "page" }), { win: "Shipped it", thanks: "Sun", notes: "note", mood: 4, text: "page" });
  setMood(st, K, 9); assert.equal(st.wins[K].m, 4, "out of range is ignored");
});

test("mood order: the journal record, then her old diary mood, then a mood only this device knew", () => {
  const st = normalize({ wins: { a: { m: 2 } }, mood: { a: { m: 5 }, b: { m: 3 } } }, K);
  assert.equal(moodOf(st, "a", 1), 2);
  assert.equal(moodOf(st, "b", 1), 3);
  assert.equal(moodOf(st, "c", 1), 1);
  assert.equal(moodOf(st, "d"), null);
});

test("device-only moods are copied in once, never over an existing mood", () => {
  const st = normalize({ wins: { a: { m: 2 } }, mood: { b: { m: 3 } } }, K);
  assert.deepEqual(moodsToCopy(st, [{ day: "a", mood: 5 }, { day: "b", mood: 5 }, { day: "c", mood: 4 }, { day: "d", mood: 0 }]), [["c", 4]]);
});

test("a mood alone is not a written day: the 21:30 wins sheet still opens", () => {
  assert.equal(wroteOn({ m: 3 }), false); assert.equal(wroteOn({ g: "x", m: 3 }), true);
  assert.match(src("components/court/CourtSheet.tsx"), /wroteOn\(st\.wins\[k\]\)/);
});

test("picking today's mood counts Luna's mood quest (it could not be completed before)", () => {
  const st = normalize({ day: K }, K);
  setMood(st, K, 3); assert.equal(questEvt(st, "mood"), true); assert.equal(st.q.l2[0], 1);
  assert.match(src("components/court/pages/Dungeon.tsx"), /setMood\(d, day, m\); if \(day === k\) questEvt\(d, "mood"\)/);
});

test("the weekly look-back reads moods from the journal record first", () => {
  const wk = "2026-11-09";
  const L = lookBack([{ day: wk, text: "x", mood: 1, tags: [], notes: [] }], { [wk]: { m: 5 } }, {}, K, 3, {});
  assert.equal(L.avgMood, 5);
});
