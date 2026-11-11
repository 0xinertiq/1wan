// Foundations F2: the game day changes at 4am in the account's own time zone; the streak counts done days (all 3
// core quests ticked); her current number carries over on the switch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, rollover } from "../src/lib/court/state.ts";
import { bootState, completeQuest } from "../src/lib/court/actions.ts";
import { QUESTS } from "../src/lib/court/quests.ts";
import { gameKey, validTz } from "../src/lib/court/time.ts";
import { coreDoneOn, streakNow } from "../src/lib/court/questList.ts";

const Y = "2026-11-10", K = "2026-11-11";
const CORE = { core: ["h:h1", "a:a1", "a:a2"], auto: false };
const st0 = (extra = {}) => normalize({
  day: Y, streak: 5,
  defs: { swins: { phases: [{ id: "d", title: "Daily", when: "", why: "", daily: true, items: [["a1", "Wake by 7", ""], ["a2", "Water first", ""]] }] } },
  hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: {} },
  ql: { ...CORE, sv: 1 }, ...extra,
}, Y);
const allDone = (d) => ({ swins: { done: {}, log: { [d]: ["a1", "a2"] } }, hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: { [d]: ["h1"] } } });

test("game day: changes at 4am in Singapore; other time zones follow their own clock; a bad zone falls back", () => {
  assert.equal(gameKey(new Date("2026-11-10T19:59:00Z")), "2026-11-10", "03:59 SGT still counts for the day before");
  assert.equal(gameKey(new Date("2026-11-10T20:00:00Z")), "2026-11-11", "04:00 SGT starts the new day");
  assert.equal(gameKey(new Date("2026-11-11T03:30:00Z"), "Europe/London"), "2026-11-10", "03:30 in London");
  assert.equal(gameKey(new Date("2026-11-11T04:00:00Z"), "Europe/London"), "2026-11-11");
  assert.equal(validTz("Not/AZone"), "Asia/Singapore");
  assert.equal(gameKey(new Date("x")), "");
});

test("a done day (3 core ticked) adds one; a missed day resets to 0, XP kept; a rest day keeps it", () => {
  const done = rollover(st0(allDone(Y)), K).st;
  assert.equal(done.streak, 6);
  const missed = rollover(st0({ xp: 77 }), K);
  assert.equal(missed.st.streak, 0); assert.equal(missed.st.xp, 77); assert.equal(missed.recap.lost, true);
  assert.equal(rollover(st0({ restDay: Y }), K).st.streak, 5);
  assert.equal(rollover(st0({ restWeek: "2026-11-09" }), K).st.streak, 5, "rest week");
});

test("two of three core quests is not a done day", () => {
  const st = st0({ swins: { done: {}, log: { [Y]: ["a1", "a2"] } } });
  assert.equal(coreDoneOn(st, Y, Y), false);
  assert.equal(rollover(st, K).st.streak, 0);
});

test("days with the app closed in between reset the streak, unless they were rest days", () => {
  const st = st0({ ...allDone("2026-11-08"), day: "2026-11-08" });
  assert.equal(rollover(st, K).st.streak, 0);
  const rested = st0({ ...allDone("2026-11-08"), day: "2026-11-08", restWeek: "2026-11-02" });   // Sun 8 Nov is in the week of 2 Nov
  assert.equal(rollover(rested, "2026-11-09").st.streak, 6);
});

test("her number carries over: the first rollover after the change uses the old morning-brief rule once", () => {
  const legacy = normalize({ day: Y, streak: 9, q: { m1: [1, 1] } }, Y);   // no ql.sv yet
  const r = rollover(legacy, K).st;
  assert.equal(r.streak, 9, "morning brief opened yesterday: kept, not reset by the new rule");
  assert.equal(r.ql.sv, 1);
  assert.equal(rollover(normalize({ day: Y, streak: 9 }, Y), K).st.streak, 0, "old rule: no brief, reset");
});

test("first load on the same day: today's morning-brief count comes off, so today counts once via the core quests", () => {
  const b = bootState(normalize({ day: K, streak: 9, q: { m1: [1, 1] } }, K), K);
  assert.equal(b.st.streak, 8); assert.equal(b.st.ql.sv, 1);
  assert.ok(b.dirty.includes("streak") && b.dirty.includes("ql"));
  const again = bootState(normalize({ day: K, streak: 8, q: { m1: [1, 1] }, ql: { sv: 1 } }, K), K);
  assert.equal(again.st.streak, 8, "applied once only");
  assert.equal(bootState(normalize({ day: K, streak: 0, q: { m1: [1, 1] } }, K), K).st.streak, 0, "never below 0");
});

test("ticking a quest no longer moves the streak; today shows +1 once all 3 core are ticked", () => {
  const st = st0({ day: K });
  completeQuest(st, QUESTS.find((q) => q.id === "m1"));
  assert.equal(st.streak, 5);
  assert.equal(streakNow(st, K), 5);
  const done = st0({ day: K, ...allDone(K) });
  assert.equal(streakNow(done, K), 6);
});
