// Grid dates layer parser (lib/court/gridDates.ts). Made-up item text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { datesIn } from "../src/lib/court/gridDates.ts";

const today = "2026-10-27";
test("full dates are found", () => {
  assert.deepEqual(datesIn("Submit by 2026-11-15", today), ["2026-11-15"]);
  assert.deepEqual(datesIn("Exam 3 Dec 2026", today), ["2026-12-03"]);
  assert.deepEqual(datesIn("Course starts Nov 4th", today), ["2026-11-04"]);
});
test("no year: next such day", () => assert.deepEqual(datesIn("Renew on 2 Feb", today), ["2027-02-02"]));
test("month-only, weekdays and rhythms are not dates", () => {
  for (const t of ["by end of Nov", "every Monday", "weekly", "Q4", "3 times a week", "30 min a day", "May be later"]) assert.deepEqual(datesIn(t, today), [], t);
});
test("impossible dates are dropped", () => assert.deepEqual(datesIn("31 Nov", today), []));
