// The one date and time formatter (lib/court/time.ts, round 5d).
import { test } from "node:test";
import assert from "node:assert/strict";
import { stamp, dayStamp, ageText, inText, stampAge, badgeParts, sgtKeyOf, clock, monthTitle } from "../src/lib/court/time.ts";

const now = "2026-10-28T02:12:00Z"; // 10:12 SGT, Wed 28 Oct
test("Singapore time, 24-hour, leading zero, SGT tag", () => {
  assert.equal(clock("2026-10-27T21:40:00Z"), "05:40");
  assert.equal(stamp("2026-10-27T21:40:00Z", now), "Today 05:40 SGT");
  assert.equal(stamp("2026-10-26T23:45:00Z", now), "27 Oct 07:45 SGT");
  assert.equal(dayStamp("2026-10-28T18:00:00Z"), "Thu 29 Oct 02:00 SGT");
  assert.equal(sgtKeyOf("2026-10-28T17:30:00Z"), "2026-10-29");
});
test("ages and countdowns", () => {
  assert.equal(ageText("2026-10-27T23:12:00Z", now), "3h ago");
  assert.equal(ageText("2026-10-28T02:00:00Z", now), "12 min ago");
  assert.equal(inText("2026-10-28T18:00:00Z", now), "in 16h");
  assert.equal(stampAge("2026-10-27T23:12:00Z", now), "Today 07:12 SGT · 3h ago");
});
test("the header badge and month titles", () => {
  assert.deepEqual(badgeParts(now), { day: "WED 28 OCT", hh: "10", mm: "12" });
  assert.equal(monthTitle("2026-10-01"), "October 2026");
});
