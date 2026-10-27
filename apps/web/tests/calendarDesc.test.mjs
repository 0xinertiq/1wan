// Astro description cleaner (lib/calendar.ts descText) and its path through the ICS parser. Made-up text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { descText, __test } from "../src/lib/calendar.ts";

test("ICS escapes become real line breaks and punctuation", () => {
  assert.equal(descText("Line one\\nLine two\\, with comma\\; and semicolon"), "Line one\nLine two, with comma; and semicolon");
});
test("Google HTML becomes plain text, links kept", () => {
  const html = 'Venus trine Jupiter.<br><br><b>Tip:</b> rest &amp; reflect.<br><a href="https://example.com/read">Read the post</a><ul><li>one</li><li>two</li></ul>';
  assert.equal(descText(html), "Venus trine Jupiter.\n\nTip: rest & reflect.\nRead the post (https://example.com/read)\n• one\n• two");
});
test("a bare link stays a bare link, blank runs collapse", () => {
  assert.equal(descText('<a href="https://example.com">https://example.com</a>\\n\\n\\n\\nEnd'), "https://example.com\n\nEnd");
});
test("descriptions reach astro events only", () => {
  const ics = ["BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:a1", "DTSTART;VALUE=DATE:20261028", "DTEND;VALUE=DATE:20261029",
    'SUMMARY:Moon enters Leo', 'DESCRIPTION:Say "hello": a quote and a colon\\nSecond line', "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const evs = __test.parseIcs(ics);
  const win = [Date.UTC(2026, 9, 1), Date.UTC(2026, 11, 1)];
  const astro = __test.occurrences(evs, "astro", "#fff", win[0], win[1]);
  assert.equal(astro[0].desc, 'Say "hello": a quote and a colon\nSecond line');
  assert.equal(__test.occurrences(evs, "work", "#fff", win[0], win[1])[0].desc, undefined);
});
