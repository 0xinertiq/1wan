// Luna's Court card parts (components/kumo/astroParts.ts). Made-up text in the calendar's format.
import { test } from "node:test";
import assert from "node:assert/strict";
import { astroParts, utcToSgt } from "../src/components/kumo/astroParts.ts";

const sample = "🔴 Tense · emotions active\n\n• Moon in Taurus\n• Moon Void-of-Course from 14:51 UTC (ends 01:01 UTC)\n\n✅ DO: Take a slow walk.\n🚫 DON'T: Don't start anything new before 20:30 UTC.\n\nApplies all day, wherever you are. © Example Astro";

test("transits, DO and DON'T come from the text as written", () => {
  const p = astroParts(sample);
  assert.deepEqual(p.transits, ["Moon in Taurus", "Moon Void-of-Course from 22:51 SGT (ends 09:01 SGT)"]);
  assert.equal(p.dos, "Take a slow walk.");
  assert.equal(p.donts, "Don't start anything new before 04:30 SGT (next day).");
  assert.equal(p.source, "Example Astro");
});

test("missing parts stay empty, nothing invented", () => {
  const p = astroParts("• Mars's Day");
  assert.equal(p.dos, null);
  assert.equal(p.donts, null);
  assert.deepEqual(astroParts(undefined).transits, []);
});

test("the boilerplate is dropped from the full text", () => {
  assert.ok(!/Applies all day/.test(astroParts(sample).full));
  assert.equal(utcToSgt("at 03:00 UTC"), "at 11:00 SGT");
});

test("energy line comes first as written; anything else is the Observatory's extra part", () => {
  const p = astroParts(sample + "\nA note from the astrologer.");
  assert.equal(p.energy, "🔴 Tense · emotions active");
  assert.equal(p.extra, "A note from the astrologer.");
  assert.equal(astroParts("🔴 Tense · x\n• Mars's Day\n✅ DO: Rest.").extra, "");
});
