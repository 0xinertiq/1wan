// Game loop G2: the day-complete sheet fires from the done-day bonus, which is given once per game day.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalize } from "../src/lib/court/state.ts";
import { awardDoneDay } from "../src/lib/court/actions.ts";
import { playDone } from "../src/lib/court/feel.ts";

const K = "2026-11-12";
const coreDone = { swins: { done: {}, log: { [K]: ["a1", "a2"] } }, hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: { [K]: ["h1"] } } };
const mk = () => normalize({ day: K, lvl: 5, ql: { core: ["h:h1", "a:a1", "a:a2"], auto: false, sv: 1 },
  defs: { swins: { phases: [{ id: "d", title: "Daily", when: "", why: "", daily: true, items: [["a1", "Wake", ""], ["a2", "Water", ""]] }] } },
  hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: {} } }, K);

test("the bonus (and so the sheet) comes once: not before the 3 are done, not again after", () => {
  const st = mk();
  assert.equal(awardDoneDay(st, K).xp, 0);
  Object.assign(st, structuredClone(coreDone));
  assert.ok(awardDoneDay(st, K).xp > 0);
  assert.equal(awardDoneDay(st, K).xp, 0);
});

test("the sheet is wired to that bonus, only after a touch, and is mounted once", () => {
  const cs = fs.readFileSync(new URL("../src/components/court/CourtState.tsx", import.meta.url), "utf8");
  assert.match(cs, /if \(a\.xp\)/);
  assert.match(cs, /isRecent\(touch\.current\.t, Date\.now\(\)\)\) fireDayDone/);
  assert.equal((cs.match(/<DayComplete \/>/g) ?? []).length, 1);
});

test("the sheet is a dialog with a close button and no missed-day wording", () => {
  const src = fs.readFileSync(new URL("../src/components/court/DayComplete.tsx", import.meta.url), "utf8");
  assert.match(src, /role="dialog"/); assert.match(src, /Continue/); assert.match(src, /Escape/);
  assert.doesNotMatch(src, /miss|lost|fail|broke/i);
});

test("done sound is safe without a browser", () => { assert.doesNotThrow(() => playDone(false)); assert.doesNotThrow(() => playDone(true)); });
