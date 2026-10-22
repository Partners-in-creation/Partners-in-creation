import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, utcToZonedInputs, weekdayOf, zonedToUtc } from "../src/lib/time.ts";

test("converts New York wall time to UTC in summer and winter", () => {
  assert.equal(zonedToUtc("2026-07-01", "20:00", "America/New_York").toISOString(), "2026-07-02T00:00:00.000Z");
  assert.equal(zonedToUtc("2026-12-01", "20:00", "America/New_York").toISOString(), "2026-12-02T01:00:00.000Z");
});

test("handles the days around daylight saving changes", () => {
  // US clocks go back on 2026-11-01.
  assert.equal(zonedToUtc("2026-10-31", "20:00", "America/New_York").toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(zonedToUtc("2026-11-01", "20:00", "America/New_York").toISOString(), "2026-11-02T01:00:00.000Z");
});

test("works for Jerusalem time", () => {
  assert.equal(zonedToUtc("2026-01-15", "19:30", "Asia/Jerusalem").toISOString(), "2026-01-15T17:30:00.000Z");
});

test("round trips back to the same wall time", () => {
  const d = zonedToUtc("2026-03-08", "20:15", "America/Los_Angeles");
  assert.deepEqual(utcToZonedInputs(d, "America/Los_Angeles"), { date: "2026-03-08", time: "20:15" });
});

test("date helpers", () => {
  assert.equal(weekdayOf("2026-10-25"), 0);
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});
