// Foundations F3: XP only (no new stars), streak bonus, done-day bonus once a day, comeback double, week-one double
// for new accounts; the level curve is unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalize } from "../src/lib/court/state.ts";
import { QUESTS, needFor } from "../src/lib/court/quests.ts";
import { addXP, awardDoneDay, bootState, completeQuest, questXP, streakMult } from "../src/lib/court/actions.ts";

const K = "2026-11-11";
const Q = (id) => QUESTS.find((q) => q.id === id);
const st0 = (extra = {}) => normalize({
  day: K, streak: 0, stars: 40, lvl: 11, xp: 0,
  defs: { swins: { phases: [{ id: "d", title: "Daily", when: "", why: "", daily: true, items: [["a1", "Wake by 7", ""], ["a2", "Water first", ""]] }] } },
  hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: {} },
  ql: { core: ["h:h1", "a:a1", "a:a2"], auto: false, sv: 1 }, ...extra,
}, K);
const coreDone = { swins: { done: {}, log: { [K]: ["a1", "a2"] } }, hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: { [K]: ["h1"] } } };

test("the level curve is unchanged: 60 + 20 x level", () => {
  assert.equal(needFor(5), 160); assert.equal(needFor(11), 280);
  const st = st0({ lvl: 1, xp: 70 }); assert.equal(addXP(st, 15), 2); assert.equal(st.xp, 5);
});

test("completing a quest gives XP only: stars stay at their saved number", () => {
  const st = st0();
  completeQuest(st, Q("k7"));
  assert.equal(st.stars, 40); assert.equal(st.xp, 25);
});

test("streak bonus on quest XP: +10% / 25% / 50% from 3 / 7 / 14 done days; a tiny version is half", () => {
  assert.deepEqual([0, 2, 3, 6, 7, 13, 14, 40].map(streakMult), [1, 1, 1.1, 1.1, 1.25, 1.25, 1.5, 1.5]);
  assert.equal(questXP(st0({ streak: 29 }), 25, K), 38);
  assert.equal(questXP(st0({ streak: 0 }), 30, K, true), 15);
});

test("done-day bonus: +10 once a day when all 3 core are ticked; nothing before that", () => {
  const not = st0({ swins: { done: {}, log: { [K]: ["a1"] } } });
  assert.equal(awardDoneDay(not, K).xp, 0);
  const st = st0(coreDone);
  assert.equal(awardDoneDay(st, K).xp, 10); assert.equal(st.xp, 10); assert.equal(st.ql.bd, K); assert.equal(st.ql.ld, K);
  assert.equal(awardDoneDay(st, K).xp, 0, "once a day");
  assert.equal(st.xp, 10);
});

test("comeback: the first done day after a break counts double (core quest XP again plus a second bonus)", () => {
  const st = st0({ ...coreDone, ql: { core: ["h:h1", "a:a1", "a:a2"], auto: false, sv: 1, ld: "2026-11-05" } });
  assert.equal(awardDoneDay(st, K).xp, 10 + 30 + 10);
  const steady = st0({ ...coreDone, ql: { core: ["h:h1", "a:a1", "a:a2"], auto: false, sv: 1, ld: "2026-11-10" } });
  assert.equal(awardDoneDay(steady, K).xp, 10, "yesterday was a done day: no comeback");
});

test("week-one double XP only for a brand-new account; an account with history never gets a start day", () => {
  const fresh = bootState(normalize({}, K), K);
  assert.equal(fresh.st.ql.start, K); assert.ok(fresh.dirty.includes("ql"));
  assert.equal(questXP(fresh.st, 20, K), 40);
  assert.equal(questXP(fresh.st, 20, "2026-11-18"), 20, "day 8: normal");
  const hers = bootState(normalize({ day: K, lvl: 11, xp: 100, days: { "2026-11-10": { d: 1, t: 5 } } }, K), K);
  assert.equal(hers.st.ql.start, undefined);
});

test("the tick path awards the done-day bonus, and quest rows show the XP she will really get", () => {
  const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
  assert.match(src("components/court/CourtState.tsx"), /awardDoneDay\(d, today, owner\)/);
  assert.match(src("components/court/live/GrowLive.tsx"), /questXP\(st, q\.xp, k\)/);
});
