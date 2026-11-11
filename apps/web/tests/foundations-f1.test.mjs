// Foundations F1: one Quests list built from the Habit Quests, the Daily anchors and My habits (nothing copied or
// moved), plus one new optional key, ql (core pick, pillar tags, tiny versions).
import { test } from "node:test";
import assert from "node:assert/strict";
import { OWNED_KEYS, normalize } from "../src/lib/court/state.ts";
import { autoCore, coreIds, doneOn, normQuestList, questItems } from "../src/lib/court/questList.ts";

const K = "2026-11-11";   // a Wednesday
const day = (n) => { const d = new Date(K + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const base = (extra = {}) => normalize({
  day: K,
  defs: { swins: { phases: [{ id: "d", title: "Daily", when: "", why: "", daily: true, items: [["a1", "Wake by 7", ""], ["a2", "Water first", ""], ["a3", "Make the bed", ""]] }] } },
  hab: { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }, { id: "h2", name: "Paused one", days: [3], paused: true, at: "" }], log: {} },
  ...extra,
}, K);

test("ql is a new optional saved key; absent or odd values read as the auto pick", () => {
  assert.ok(OWNED_KEYS.includes("ql"));
  assert.deepEqual(normalize({}, K).ql, { core: [], auto: true, meta: {} });
  const odd = normQuestList({ core: ["q:m1", 5, "bad id!", "q:m1"], auto: false, meta: { "q:m1": { pillar: 9, tiny: "  " }, "a:a1": { pillar: 2, tiny: "x".repeat(99) }, nope: { pillar: 1 } } });
  assert.deepEqual(odd.core, ["q:m1"]);
  assert.equal(odd.auto, true, "her own pick only counts with exactly 3 quests");
  assert.deepEqual(odd.meta, { "a:a1": { pillar: 2, tiny: "x".repeat(60) } });
  assert.equal(normQuestList({ core: ["q:m1", "a:a1", "h:h1"], auto: false }).auto, false);
});

test("one list from the three places: Habit Quests, anchors, habits; the Daily anchors group quest is left out", () => {
  const items = questItems(base(), K, true);
  const ids = items.map((x) => x.id);
  assert.ok(ids.includes("q:m1") && ids.includes("a:a1") && ids.includes("h:h1"));
  assert.ok(!ids.includes("q:k1"), "k1 only counted the anchors, which are in the list themselves");
  assert.ok(!ids.includes("h:h2"), "paused habits stay out");
  assert.equal(items.filter((x) => x.core).length, 3);
  assert.deepEqual(items.slice(0, 3).map((x) => x.core), [true, true, true], "core first");
  assert.equal(items.find((x) => x.id === "q:k7").tiny, "A 5-minute sprint");
  assert.equal(items.find((x) => x.id === "a:a1").tiny, null);
});

test("nothing is copied or changed: the source state is identical after building the list", () => {
  const st = base({ swins: { done: {}, log: { [K]: ["a1"] } }, q: { m1: [1, 1] } });
  const before = JSON.stringify(st);
  const items = questItems(st, K, true); autoCore(st, K, true); coreIds(st, K, true);
  assert.equal(JSON.stringify(st), before);
  assert.equal(items.find((x) => x.id === "a:a1").done, true);
  assert.equal(items.find((x) => x.id === "q:m1").done, true);
});

test("friends never see her trading quests; switched-off quests and hidden anchors stay out", () => {
  const friend = questItems(base(), K, false).map((x) => x.id);
  for (const id of ["q:o1", "q:f1", "q:o2"]) assert.ok(!friend.includes(id), id);
  const st = base({ questsOff: ["k7"], gedit: { anchors: { hidden: ["a2"] } } });
  const ids = questItems(st, K, true).map((x) => x.id);
  assert.ok(!ids.includes("q:k7") && !ids.includes("a:a2") && ids.includes("a:a3"));
});

test("auto core = her 3 most-ticked daily quests over 28 days; ties keep list order; weekly quests never", () => {
  const log = {}; for (let i = 0; i < 20; i++) log[day(i)] = ["a2", "a3"]; log[day(40)] = ["a1", "a1"];
  const hab = { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }], log: { [day(1)]: ["h1"], [day(2)]: ["h1"] } };
  const days = { [day(1)]: { d: 1, t: 5, n: ["Heavenly Tribulation: weekly review"] }, [day(3)]: { d: 1, t: 5, n: ["Heavenly Tribulation: weekly review"] }, [day(4)]: { d: 1, t: 5, n: ["Heavenly Tribulation: weekly review"] } };
  const st = base({ swins: { done: {}, log }, hab, days });
  assert.deepEqual(autoCore(st, K, true), ["a:a2", "a:a3", "h:h1"]);
});

test("her own pick wins while all 3 exist; if one disappears, the auto pick takes over", () => {
  const st = base({ ql: { core: ["h:h1", "a:a1", "q:m1"], auto: false } });
  assert.deepEqual(coreIds(st, K, true), ["h:h1", "a:a1", "q:m1"]);
  assert.deepEqual(questItems(st, K, true).slice(0, 3).map((x) => x.id), ["h:h1", "a:a1", "q:m1"]);
  const gone = base({ ql: { core: ["h:h9", "a:a1", "q:m1"], auto: false } });
  assert.notDeepEqual(coreIds(gone, K, true), ["h:h9", "a:a1", "q:m1"]);
});

test("doneOn reads each source's own history", () => {
  const st = base({ days: { [day(1)]: { d: 1, t: 5, n: ["Open the morning brief"] } }, swins: { done: {}, log: { [day(1)]: ["a1"] } }, hab: { list: [], log: { [day(1)]: ["h1"] } } });
  assert.equal(doneOn(st, { src: "quest", ref: "m1" }, day(1), K), true);
  assert.equal(doneOn(st, { src: "quest", ref: "k7" }, day(1), K), false);
  assert.equal(doneOn(st, { src: "anchor", ref: "a1" }, day(1), K), true);
  assert.equal(doneOn(st, { src: "habit", ref: "h1" }, day(1), K), true);
});
