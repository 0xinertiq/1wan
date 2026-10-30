# Round 5b

_Owner's prompt, copied verbatim from the saved session transcript. Not edited._

ROUND 5b (same branch, same preview; preview only, nothing to production until I say "ship it"). Small edits on top of Round 5; update COURT_SPEC.md and the "where each thing lives" map to match. Never repeat the same information in two places. Everything uses the shared tokens.

1. HIDE BIGDATA EVERYWHERE IN THE UI
Bigdata.com is permanently disconnected but its name still shows up (brief "sources" lines, Gaps lines, Kumo's review, "What this desk has learned"). Do NOT touch the protected ingest or export routes or the stored data. In the display layer, add one shared sanitising helper used by every place that renders a brief, review, desk note or meta/sources text (Briefs card, News, Kumo review, Trades, any tooltip): remove any sentence, list item, link chip or line that mentions Bigdata or Bigdata.com in any capitalisation, and any statement that a source is unavailable, missing or failed to load because of it. Add a test with sample text. List the places you covered in PROGRESS.md.

2. CRYPTO SCAN TAB: SNAPSHOT AND MOVERS ONLY
In the Briefs card, the Crypto scan tab keeps: the dated snapshot label ("Scan 05:35 SGT"), the read-through callout, and MOVERS, plus ONE compact line "Strongest now" with the top 3 coins by score from the Style Map (ticker, score, bucket) so I can see at a glance which watchlist coins are strong, and the "Open in Trades →" link. Remove from the Briefs card: the Style Map table, the Trade Plan table, "No trade today", also-on-watch, alerts and thesis log, Catalysts and Gaps. Do not delete any data: the full brief stays complete in News (full text and history), and write in COURT_SPEC.md that the Trades tab will later host the Style Map, Trade Plan and Catalysts (do not build that now). Keep the same uniform item style, small sources line and Show less / Show more.

3. NEEDS YOU NOW: ABOVE TODAY, ALIGNED, CLOSES WHEN DONE
- New right-column order: Needs you now, Today (Today | Week), Luna's card, Kumo's weekly review (only while unread).
- Fix the misaligned buttons (for example "Open" and "Seen" on "Dog grooming due Fri 30 Oct" have different heights and widths): every row uses the same button component, same height, same width pattern, right-aligned, vertically centred with the text, 44px tap target, consistent gaps; check each row and the grouped cards at phone and desktop width.
- When all tasks are done the card closes: it animates away and leaves no space (no "All clear" line, no empty card); it comes back when something new is due. Keep the rule: tasks, reminders and bookings due today or overdue, or due within 3 days, plus agents waiting on me; maximum 3 items then "+n more".

4. AUTO-PAID AND IMPORTANT FLAGS (APPROVED for this specific change only)
I approve adding two optional flags to life-admin items: "autoPaid" and "important". Keep it backwards compatible: add them as optional fields, make normalize() default them safely without altering any existing data, no migration, no data rewrite, no change to auth, RLS or any other state key; add tests for normalize and show me the exact diff of normalize() and OWNED_KEYS (if it needs touching) in the report. Until a stored value exists, derive defaults from the existing category or flags (GIRO, auto-deducted tax and subscriptions default to auto-paid). Court rule: hide autoPaid items; show an item when it is important or needs action within 3 days. Life Hub > Life admin keeps every item and gets two small toggles per item ("Auto-paid", "Important").

5. FOCUS SPRINT PAUSE (APPROVED)
Add pause and resume to the focus sprint icon timer: tap while running to pause (the ring shows a paused state and the remaining time), tap again to resume, a small stop option. Keep 25 minutes as the default and keep the existing behaviour otherwise; store the remaining time in the existing local state.

Not now (do not build): syncing the review's read state across devices (later), any paid AI rewrite of Luna's text (no), kingdom level thresholds (keep the placeholders).

Then run typecheck, tests and the overlap and contrast checks, screenshot desktop and phone yourself, fix obvious flaws, update PROGRESS.md, and give me the preview link. Report in five lines.
