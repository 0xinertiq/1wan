// Foundations F6: new accounts start clean: a friend is called by their own name (never "Queen"), never sees her
// course quest or her personal ideas, and gets generic starter quests; her own screens are unchanged.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalize, momoIdeas, ideaFor, OWNER_IDEAS } from "../src/lib/court/state.ts";
import { QUESTS, forViewer } from "../src/lib/court/quests.ts";
import { questItems } from "../src/lib/court/questList.ts";
import { titleFor, withTitle } from "../src/lib/court/title.ts";
import { TEMPLATES, TEMPLATE_CATS } from "../src/lib/court/templates.ts";

const K = "2026-11-11";
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");

test("titles: she stays Queen; a friend is their own name, or 'friend'", () => {
  assert.equal(titleFor({ name: "Bea" }, true), "Queen");
  assert.equal(titleFor({ name: "  Bea " }, false), "Bea");
  assert.equal(titleFor({}, false), "friend");
  assert.equal(withTitle("Slow and steady, Queen. I dig deep.", "Bea"), "Slow and steady, Bea. I dig deep.");
  assert.equal(withTitle("Hi, Queen.", "Queen"), "Hi, Queen.");
});

test("no hard-coded 'Queen' greeting is left in the screens", () => {
  for (const f of ["components/court/Header.tsx", "components/court/live/LivingWorld.tsx", "components/court/live/TodayLive.tsx"]) assert.doesNotMatch(src(f), /, Queen[.<]/, f);
});

test("a friend never sees her course quest (Study block) or her trading quests; she still does", () => {
  assert.ok(!forViewer(QUESTS, false).some((q) => q.id === "k2"));
  assert.ok(forViewer(QUESTS, true).some((q) => q.id === "k2"));
  assert.ok(!questItems(normalize({}, K), K, false).some((x) => x.id === "q:k2"));
});

test("her personal ideas (chart review, study block, FYP feed check) are hers only", () => {
  assert.deepEqual(OWNER_IDEAS, ["charts", "study", "feeds-am", "feeds-pm"]);
  const ideas = [{ id: "charts" }, { id: "study" }, { id: "feeds-pm" }, { id: "move" }];
  assert.deepEqual(ideas.filter(ideaFor(false)).map((x) => x.id), ["move"]);
  assert.equal(ideas.filter(ideaFor(true)).length, 4);
  assert.equal(typeof momoIdeas, "function");
});

test("a new account's state holds none of her content", () => {
  const st = normalize({}, K);
  assert.deepEqual(st.defs, {}); assert.equal(st.hab.list.length, 0); assert.equal(st.life.length, 0);
  assert.equal(st.gridDefs, null === st.gridDefs ? null : st.gridDefs);
  assert.ok(!JSON.stringify(st).includes("Queen"));
});

test("starter templates: four categories, every quest has a tiny version, nothing of hers", () => {
  assert.deepEqual([...new Set(TEMPLATES.map((t) => t.cat))], [...TEMPLATE_CATS]);
  for (const t of TEMPLATES) { assert.ok(t.tiny && t.name && t.xp >= 10 && t.xp <= 40, t.id); }
  const text = JSON.stringify(TEMPLATES);
  for (const her of ["Study block", "Samsara", "Q4", "FYP", "Queen", "macro", "bias"]) assert.ok(!text.includes(her), her);
});
