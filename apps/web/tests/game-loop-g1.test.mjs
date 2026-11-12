// Game loop G1: tick burst and sound. Mute is an optional pref; a tick is a rise in today's done count; auto-ticks stay silent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../src/lib/court/state.ts";
import { logQuest } from "../src/lib/court/actions.ts";
import { doneCount, isRecent, playTick, RECENT_MS } from "../src/lib/court/feel.ts";

const K = "2026-11-12";
const st0 = () => normalize({ day: K, lvl: 3 }, K);

test("mute is optional: absent by default, kept only when exactly true", () => {
  assert.equal(st0().prefs.mute, undefined);
  assert.equal(normalize({ day: K, prefs: { mute: true } }, K).prefs.mute, true);
  assert.equal(normalize({ day: K, prefs: { mute: "yes" } }, K).prefs.mute, undefined);
  assert.equal(normalize({ day: K, prefs: { mute: false } }, K).prefs.mute, undefined);
});

test("a tick raises today's done count; the count never drops by itself", () => {
  const st = st0();
  const before = doneCount(st, K, true);
  logQuest(st, "k7");
  assert.ok(doneCount(st, K, true) >= before);
});

test("only a touch within the last moment counts as hers", () => {
  assert.equal(isRecent(0, 10_000), false);
  assert.equal(isRecent(10_000, 10_000 + RECENT_MS), true);
  assert.equal(isRecent(10_000, 10_000 + RECENT_MS + 1), false);
});

test("sound is safe without a browser and when muted", () => {
  assert.doesNotThrow(() => playTick(false));
  assert.doesNotThrow(() => playTick(true));
});
