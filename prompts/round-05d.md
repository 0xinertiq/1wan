# Round 5d

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 5d (same branch, same preview; preview only, nothing to production until I say "ship it"). Three small edits on top of Rounds 5, 5b and 5c; update COURT_SPEC.md. Never repeat the same information in two places; everything uses the shared tokens.

1. SOURCES: LINKS ONLY, NO LABEL
Remove the word "Sources:" everywhere (briefs, News, Kumo review, Trades, the Intel Top 5, every card). Under each item show only the source names as small links separated by a middle dot, for example: TechCrunch · DealStreetAsia. Same muted style as now (one step smaller than the body text, deep sakura pink with underline, no pills or boxes), same spacing everywhere. If an item has no sources show nothing, no empty line. Check the sanitiser (Bigdata) still runs on these lines.

2. BRIEFS: ONE FONT SIZE UP
Increase the reading size in every brief by one step on the token type scale: body text one step up (if it is currently below 17px, make it 18px), headline lead lines and section titles one step up (section titles about 22px), uppercase section labels and the sources line one step up (about 13px), keep the line height about 1.65 and the line length comfortable. Apply it to the Briefs card (Pulse, Intelligence, Crypto scan), the News brief pages and Kumo's review. Re-run the overlap check, confirm nothing overflows or forces horizontal scrolling at phone, tablet and desktop widths, and confirm night-mode contrast is still 7:1 for brief body text.

3. ONE PIXEL DATE AND TIME STYLE, EVERYWHERE (24-hour, Singapore time)
- Header: replace the separate date text ("Wed 28 Oct") and the clock chip with ONE pixel badge: the pixel clock icon, then the date and time together, for example "WED 28 OCT · 10:12 SGT", in the Silkscreen pixel font (allowed for tiny labels), pill with stepped pixel-style corners, plum outline, one gold accent on the clock, blinking colon (still under reduced motion), same size and vertical alignment as the neighbouring level, streak and star chips. Day and night variants, readable (4.5:1 or better), no overlap with other header items.
- One shared formatter used for EVERY date and time in the app (brief titles and ages, "as of", the "Next:" liquidity line, events in Today and Week, Needs you now, News, Trades, Calendar, review dates). Standard wording: "Today 05:40 SGT" for today, "27 Oct 07:45 SGT" otherwise, relative age after it in the same small style "· 3h ago", times always 24-hour with a leading zero, "SGT" tag, weekday shortened to three letters with the date ("Thu 29 Oct"), the same separators everywhere. Show these timestamps in the pixel font at 12px or larger (tabular digits) as small labels; running text stays in Nunito. Replace all ad-hoc date formatting with the formatter and add a test (and extend the check script) that fails if any component formats dates or times by hand.
- Check that every timestamp is readable in day and night and does not overlap its neighbours.

Then run typecheck, tests and the overlap, contrast and token checks, screenshot desktop and phone yourself, fix obvious flaws, update PROGRESS.md, and give me the preview link. Report in five lines.
