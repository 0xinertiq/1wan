// Round 9 checks: Calendar alignment, research notes, the hidden net worth, folding done items, loan and cash-flow
// maths, finance records that persist and export, the calculator's labels, and the briefing's dedupe by meaning.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { billsForMonth, cashflow, foldDone, hitsInMonth, isPaidNow, loanMath } from "../src/lib/court/finance.ts";
import { briefing, sameStory } from "../src/lib/court/briefing.ts";

const K = "2026-10-28", h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const ctx = (st) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const html = (el, st = normalize({}, K)) => renderToString(h(CourtCtx.Provider, { value: ctx(st) }, el)).replace(/<!-- -->/g, "");

test("Calendar: the Calendar and Economic calendar cards sit in one stack with the same width and edges", async () => {
  const { CalendarPage } = await import("../src/components/court/pages/CalendarPage.tsx");
  const out = html(h(CalendarPage, { main: h("section", { className: "win", id: "calWin" }, "CAL"), econ: h("section", { className: "win", id: "econWin" }, "ECON") }));
  assert.match(out, /<div class="kcal-stack"><section class="win" id="calWin">CAL<\/section><div id="econ-cal"><section class="win" id="econWin">ECON/);
  assert.match(css, /\.kcal-stack \.tabcol\{max-width:none;margin:0;width:100%\}/, "the old 900px centred column no longer narrows the Calendar card");
});

test("research notes: the New note form makes a note, it lists, attaches and exports", async () => {
  const { noteFromForm } = await import("../src/components/court/pages/Dungeon.tsx");
  assert.equal(noteFromForm({ title: " ", text: "", url: "", tag: "" }), null);
  const n = noteFromForm({ title: "SOL unlock", text: "Unlock on the 12th", url: "https://example.com/a", tag: "#SOL" });
  assert.deepEqual(n, { kind: "note", title: "SOL unlock", text: "Unlock on the 12th", url: "https://example.com/a", tags: ["sol"] });
  assert.equal(noteFromForm({ title: "x", text: "", url: "javascript:alert(1)", tag: "" }).url, undefined);
  const { cleanRows } = await import("../src/lib/vault.ts");
  const kept = cleanRows("research_notes", [{ id: "n1", at: "a", up: "a", ...n }]);
  assert.equal(kept[0].title, "SOL unlock"); assert.equal(kept[0].kind, "note"); assert.deepEqual(kept[0].tags, ["sol"]);
  const d = src("components/court/pages/Dungeon.tsx");
  assert.match(d, /<NewNote onSave=\{\(n\) => notes\.put\(n as Partial<Note>\)\} \/>/);
  assert.match(d, /notes: on \? cur\.notes\.filter\(\(x\) => x !== n\.id\) : \[\.\.\.\(cur\.notes \?\? \[\]\), n\.id\]/, "attach still links the note from the page");
  assert.ok(!/Save them in News/.test(d));
  assert.match(src("app/api/export/route.ts"), /research_notes/);
});

test("net worth shows 'hidden' until hovered or tapped; the Show net worth button is gone from the New look", async () => {
  const { Reveal, FinanceTracker } = await import("../src/components/court/live/FinanceTracker.tsx");
  const r = html(h(Reveal, { value: "S$12,345", label: "Net worth" }));
  assert.match(r, /class="kreveal" aria-pressed="false"/);
  assert.match(r, /<span class="kreveal-h" aria-hidden="true">hidden<\/span><span class="kreveal-v" aria-hidden="true">S\$12,345<\/span>/);
  assert.match(css, /@media \(hover:hover\)\{[^}]*\.kreveal:is\(:hover,:focus-visible\) \.kreveal-v\{display:inline\}/);
  assert.match(css, /\.kreveal\.on \.kreveal-v\{display:inline\}/, "a tap shows it, another tap hides it");
  const st = normalize({ defs: { money: { asOf: "2026-10-01", phases: [], routines: [], open: [], cash: [["Salary", "", 5000], ["Rent", "", -2000]], steps: [], up: [], funds: [["f1", "Car", 1000, null, 100, ""]], nw: [["n1", "Savings", "", 20000, 1]], k: null } } }, K);
  const out = html(h(FinanceTracker, { d: st.defs.money }), st);
  assert.ok(!/Show net worth|Hide net worth/.test(out));
  assert.match(out, /Net worth/); assert.match(out, /hidden/);
});

test("done items fold away without losing anything; ticks and ids unchanged", async () => {
  const items = [{ id: "a", d: true }, { id: "b", d: false }, { id: "c", d: true }];
  const f = foldDone(items, (x) => x.d);
  assert.deepEqual([...f.open, ...f.done].map((x) => x.id).sort(), ["a", "b", "c"]);
  assert.deepEqual(f.done.map((x) => x.id), ["a", "c"], "done items keep their order");
  assert.ok(isPaidNow({ rule: { type: "dom", d: 5 } }, true, K), "auto-paid folds");
  assert.ok(isPaidNow({ rule: { type: "once", date: "2026-10-01" }, paid: 1 }, false, K));
  assert.ok(isPaidNow({ rule: { type: "dom", d: 5 }, paid: "2026-10-05" }, false, K), "paid this month");
  assert.ok(!isPaidNow({ rule: { type: "dom", d: 5 }, paid: "2026-09-05" }, false, K), "paid last month is open again");
  const { SamsaraLive } = await import("../src/components/court/live/SamsaraLive.tsx");
  const st = normalize({ samsara: { done: { a1: true, a2: true, b1: true } }, defs: { samsara: { phases: [
    { id: "p1", title: "Phase one", when: "Nov", why: "", items: [["a1", "First", ""], ["a2", "Second", ""]] },
    { id: "p2", title: "Phase two", when: "Dec", why: "", items: [["b1", "Ticked one", ""], ["b2", "Open one", ""]] }] } } }, K);
  const out = html(h(SamsaraLive, { onWriteThesis() {} }), st);
  assert.match(out, /Show done \(1\)/);
  assert.ok(out.indexOf("Open one") < out.indexOf("Ticked one"), "a ticked milestone sorts below the open one");
  assert.ok(out.indexOf("Phase two") < out.indexOf("Phase one"), "the fully ticked group sits under Show done");
  assert.deepEqual(st.samsara.done, { a1: true, a2: true, b1: true });
});

test("loans owed to me: lent, repaid, written off and still expected (the S$9,000 example)", () => {
  assert.deepEqual(loanMath({ lent: 9000, repaid: [{ date: "2026-03-01", amt: 2000 }, { date: "2026-05-01", amt: 1500 }], off: 5500 }), { lent: 9000, repaid: 3500, off: 5500, expected: 0 });
  assert.equal(loanMath({ lent: 9000, repaid: [{ date: "2026-03-01", amt: 2000 }], off: 0 }).expected, 7000);
  assert.equal(loanMath({ lent: 9000, repaid: [], off: 10000 }).expected, 0, "never below zero");
  assert.match(src("components/court/live/FinanceTracker.tsx"), /\+ loanExpected;/, "net worth adds only what is still expected");
});

test("monthly cash flow pulls each Life admin bill once, from the bills themselves", () => {
  const life = [
    { id: "r", name: "Rent", cat: "bill", amt: 2000, rule: { type: "dom", d: 1 }, lead: 0 },
    { id: "g", name: "Gym", cat: "bill", amt: 10, rule: { type: "wk", days: [1] }, lead: 0 },            // Mondays
    { id: "i", name: "Insurance", cat: "bill", amt: 300, rule: { type: "once", date: "2026-12-01" }, lead: 0 },
    { id: "v", name: "Vet", cat: "pet", amt: 80, rule: { type: "dom", d: 3 }, lead: 0 },
    { id: "n", name: "No amount", cat: "bill", amt: null, rule: { type: "dom", d: 9 }, lead: 0 },
  ];
  assert.equal(hitsInMonth({ type: "wk", days: [1] }, "2026-10"), 4);
  const b = billsForMonth(life, "2026-10");
  assert.deepEqual(b.rows.map((x) => [x.id, x.n]), [["r", 1], ["g", 4]]);
  assert.equal(b.total, 2040);
  assert.deepEqual(cashflow({ income: 5000, bills: 2040, sinking: 300, spending: 410 }).left, 2250);
});

test("finance records persist through a reload, keep no account numbers, and are in Export my data", async () => {
  const { cleanRows } = await import("../src/lib/vault.ts");
  const rows = cleanRows("finance_entries", [
    { id: "l1", at: "a", up: "a", kind: "loan", name: "Loan to a friend 1234 5678 9012", lent: 9000, repaid: [{ date: "2026-03-01", amt: 2000 }, { date: "bad", amt: 5 }], off: 7000 },
    { id: "i1", at: "a", up: "a", kind: "income", month: "2026-10", amt: 5200 },
    { id: "e1", at: "a", up: "a", kind: "edit", fig: "t.ef", label: "Emergency fund", from: 1000, to: 1500 },
    { id: "b1", at: "a", up: "a", kind: "budget", cat: "food", amt: 400 },
    { id: "x", at: "a", up: "a", kind: "income", month: "October", amt: 1 },
  ]);
  assert.deepEqual(rows.map((r) => r.kind), ["loan", "income", "edit", "budget"]);
  assert.equal(rows[0].name, "Loan to a friend •••");
  assert.deepEqual(rows[0].repaid, [{ date: "2026-03-01", amt: 2000 }]);
  assert.deepEqual({ from: rows[2].from, to: rows[2].to }, { from: 1000, to: 1500 });
  assert.deepEqual(cleanRows("finance_entries", JSON.parse(JSON.stringify(rows))), rows, "stable through a save and reload");
  assert.match(src("app/api/export/route.ts"), /finance_entries/);
  assert.match(src("components/court/live/FinanceTracker.tsx"), /x\.money\[g\] = \{ \.\.\.x\.money\[g\], \[id\]: Math\.max\(0, val\) \}/, "balances keep living in user_state money");
});

test("position size calculator: every field labelled with a hint, no bare pre-filled numbers, plain checks", async () => {
  const { SIZER_FIELDS, sizeCheck } = await import("../src/components/court/pages/TradesPage.tsx");
  assert.deepEqual(SIZER_FIELDS.map((f) => f[1]), ["Account equity", "Risk per trade %", "Entry price", "Stop price", "Target price (optional)"]);
  assert.ok(SIZER_FIELDS.every((f) => f[2].length > 10));
  const t = src("components/court/pages/TradesPage.tsx");
  assert.match(t, /Works out how many coins to buy so a stopped-out trade loses only the % you choose\./);
  assert.match(t, /useState\(\{ dir: "long" as "long" \| "short", equity: "", risk: "", entry: "", stop: "", target: "" \}\)/);
  assert.match(t, /position size \(coins\)[\s\S]*amount at risk[\s\S]*risk : reward/);
  assert.equal(sizeCheck("long", 1000, 1, 100, 110), "Enter a stop below your entry for a long.");
  assert.equal(sizeCheck("long", 1000, 0, 100, 90), "Enter a risk percent between 0 and 100.");
});

test("Today's briefing never repeats a story: same subject in other words becomes one line, 'also reported by'", () => {
  assert.ok(sameStory("Bitcoin rebounds above $60,000 after selloff", "BTC bounces back to 60K as traders return"));
  assert.ok(sameStory("Bitcoin rebounds as ETF inflows return", "Bitcoin rebounds, crypto market recovers"));
  assert.ok(sameStory("Fed holds rates steady", "FOMC keeps interest rates unchanged, Powell says"));
  assert.ok(!sameStory("Bitcoin ETF outflows hit record", "Bitcoin rebounds above 60k"), "same coin, different story");
  assert.ok(!sameStory("Fed holds rates steady", "ECB cuts rates by 0.25%"));
  const it = (title, source, score, group = "Crypto") => ({ lead: { title, source, group, at: "2026-10-28T01:00:00Z", link: "https://x/" + encodeURIComponent(source + title), tier: "media" }, items: [{ title, source, group, at: "2026-10-28T01:00:00Z", link: "https://x/" + encodeURIComponent(source), tier: "media" }], sources: 1, independent: 1, syndicated: false, score, why: [] });
  const b = briefing([it("Bitcoin rebounds above $60,000", "CoinDesk", 70), it("BTC bounces back to 60K", "The Block", 90), it("Bitcoin rebounds, crypto market recovers", "Decrypt", 60), it("Solana ETF filing", "Reuters", 50)], ["any"]);
  assert.equal(b.stories.length, 2);
  assert.equal(b.stories[0].title, "BTC bounces back to 60K", "the best-scored headline stays");
  assert.deepEqual(b.stories[0].also.sort(), ["CoinDesk", "Decrypt"]);
  assert.equal(b.headlines, 4);
});
