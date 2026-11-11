// Foundations F5: one Home list built from tasks, routines and life admin (nothing copied or moved); the money
// tracker already reads one set of sources on the New look; her Classic-look money figures hold nothing to move.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { homeFilter, homeItems } from "../src/lib/court/homeList.ts";

const K = "2026-11-11";
const tasks = [{ id: "1", title: "Book the vet", due: "2026-11-13", pri: "high" }, { id: "2", title: "Done one", done: true }, { id: "3", title: "Today to-do", todo: true }, { id: "4", title: "Someday" }];
const routines = [{ id: "r", name: "Walk the dog", every: 1, last: "2026-11-10" }, { id: "p", name: "Paused", every: 7, paused: true }];
const life = [{ id: "g", name: "Dog grooming", cat: "pet", amt: 60, rule: { type: "dom", d: 29 }, lead: 3 }];

test("one Home list from the three places, soonest first, undated last; done, paused and Today to-dos stay out", () => {
  const items = homeItems(tasks, routines, life, K);
  assert.deepEqual(items.map((x) => x.id), ["r:r", "t:1", "l:g", "t:4"]);
  assert.equal(items[0].due, K); assert.equal(items[1].high, true);
  assert.equal(items[2].due, "2026-11-29"); assert.equal(items[2].amt, 60);
});

test("filters for the phone sheet's chips", () => {
  const items = homeItems(tasks, routines, life, K);
  assert.equal(homeFilter(items, "all").length, 4);
  assert.deepEqual(homeFilter(items, "admin").map((x) => x.ref), ["g"]);
});

test("nothing is copied: the inputs are unchanged", () => {
  const before = JSON.stringify([tasks, routines, life]); homeItems(tasks, routines, life, K);
  assert.equal(JSON.stringify([tasks, routines, life]), before);
});

test("the New-look money card already reads one set of sources (balances, spending, income, loans, bills)", () => {
  const src = fs.readFileSync(path.resolve(import.meta.dirname, "../src/components/court/live/FinanceTracker.tsx"), "utf8");
  assert.match(src, /\/api\/spending/); assert.match(src, /finance_entries/);
});
