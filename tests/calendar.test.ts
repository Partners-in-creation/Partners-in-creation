import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, googleCalendarUrl } from "../src/lib/calendar.ts";

const ev = {
  uid: "abc@partners-in-creation",
  title: "Class, with commas; and semicolons",
  description: "Line one\nLine two",
  location: "",
  url: "https://example.com/classes/abc",
  start: new Date("2026-10-25T00:00:00Z"),
  end: new Date("2026-10-25T01:00:00Z"),
};

test("ics has escaped fields, UTC times and CRLF line endings", () => {
  const ics = buildIcs(ev, new Date("2026-10-01T00:00:00Z"));
  assert.match(ics, /DTSTART:20261025T000000Z\r\n/);
  assert.match(ics, /SUMMARY:Class\\, with commas\; and semicolons/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
  assert.doesNotMatch(ics, /LOCATION:/, "no location line when the address is hidden");
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
});

test("cancelled events are marked as such", () => {
  assert.match(buildIcs({ ...ev, cancelled: true }), /STATUS:CANCELLED/);
});

test("google link carries dates and title", () => {
  const url = new URL(googleCalendarUrl(ev));
  assert.equal(url.searchParams.get("dates"), "20261025T000000Z/20261025T010000Z");
  assert.equal(url.searchParams.get("text"), ev.title);
  assert.equal(url.searchParams.get("location"), null);
});
