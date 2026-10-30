// Brief readers for the New-look Court (components/kumo/briefParse.ts). Made-up brief text, not real briefs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { briefSections, topFive, todaysPlan, isNoMovers, reviewParts, cleanSources } from "../src/components/kumo/briefParse.ts";

const intel = "# Daily Intelligence\n## Top 5 headlines\n1. **Fed holds rates** — markets expect a cut in March. [Reuters](https://r.example/a)\n2. **ETF inflows rise** — third week in a row. [CoinDesk](https://c.example/b)\n- **Yen slips**: BoJ stays put\n## Macro\nCPI on Thursday.";

test("Top 5 comes from its own section with bold headline, why and links", () => {
  const t = topFive(intel);
  assert.equal(t.fromSection, true);
  assert.equal(t.items.length, 3);
  assert.deepEqual(t.items[0], { title: "Fed holds rates", why: "markets expect a cut in March.", links: [{ text: "Reuters", url: "https://r.example/a" }] });
  assert.equal(t.items[2].title, "Yen slips");
  assert.equal(t.items[2].why, "BoJ stays put");
});

test("older briefs fall back to one line per section, with the section as a topic", () => {
  const t = topFive("# Brief\n## Macro\n- Fed speakers at 2pm\n## Crypto\nBTC range holds");
  assert.equal(t.fromSection, false);
  assert.deepEqual(t.items.map((x) => x.topic + ": " + x.title), ["Macro: Fed speakers at 2pm", "Crypto: BTC range holds"]);
});

// The stored Intel format (27 Oct): paragraphs with a bold lead, the why, then a " — [Source](url), [Source](url)" tail.
const stored = "Daily Intel Brief\n\n## Top 5 headlines\n\n" +
  [1, 2, 3, 4, 5].map((n) => `**Headline ${n} is the news.** Why ${n} matters. More detail ${n}. — [CNBC](https://a.example/${n}), [Kitco](https://b.example/${n})`).join("\n\n") +
  "\n\n## Asia\n\n**Asia item.** Asia why. — [AP](https://c.example)";

test("Top 5 in the stored paragraph format: five items, headline as title, one why line, sources only as links", () => {
  const t = topFive(stored);
  assert.equal(t.fromSection, true);
  assert.equal(t.items.length, 5);
  assert.deepEqual(t.items[0], { title: "Headline 1 is the news.", why: "Why 1 matters.", links: [{ text: "CNBC", url: "https://a.example/1" }, { text: "Kitco", url: "https://b.example/1" }] });
  assert.ok(t.items.every((h) => !/CNBC|Kitco|—/.test(h.why)));
});

test("whole brief as uniform sections", () => {
  const b = briefSections(stored);
  assert.equal(b.structured, true);
  assert.deepEqual(b.sections.map((s) => s.title + ":" + s.items.length), ["Top 5 headlines:5", "Asia:1"]);
  assert.equal(b.sections[0].items[1].why, "Why 2 matters. More detail 2.");
});

test("today's plan reads the read-through and the plan table", () => {
  const p = todaysPlan("**Read-through:** Majors hold support, alts lag.\n\n| Ticker | Grade | Entry | Stop | Target | R:R |\n|---|---|---|---|---|---|\n| SOL | A | 160 | 152 | 180 | 1:2.5 |\n");
  assert.equal(p.readThrough, "Majors hold support, alts lag.");
  assert.deepEqual(p.rows, [{ ticker: "SOL", grade: "A", entry: "160", stop: "152", target: "180", rr: "1:2.5" }]);
  assert.equal(p.noTrade, false);
  assert.equal(todaysPlan("No trade today: nothing meets the 1:2 rule.").noTrade, true);
});

test("movers, review and sources", () => {
  assert.equal(isNoMovers("No notable movers at 14:30."), true);
  assert.equal(isNoMovers("SOL +12% on volume"), false);
  const r = reviewParts("# Weekly review\n## Summary\nSteady week. Two plans written.\n## Suggestions\n- Write the Friday thesis\n- Sleep before midnight");
  assert.equal(r.summary, "Steady week. Two plans written.");
  assert.deepEqual(r.suggestions, ["Write the Friday thesis", "Sleep before midnight"]);
  const r2 = reviewParts("Chief Kumo weekly review\n\nA calm week overall.\n\nIntel: filed daily.\nScan: two setups.\n\n- Read the Fed notes\n- Sleep earlier");
  assert.deepEqual(r2.desks, ["Intel: filed daily.", "Scan: two setups."]);
  assert.deepEqual(r2.suggestions, ["Read the Fed notes", "Sleep earlier"]);
  assert.equal(cleanSources("Bigdata unavailable, used web search and RSS"), "used web search and RSS");
  assert.equal(cleanSources("RSS; Bigdata.com"), "RSS");
});

test("Crypto scan on the Court: read-through, Movers and the three strongest from the Style Map", async () => {
  const { scanCourt } = await import("../src/components/kumo/briefParse.ts");
  const body = "Crypto Watchlist Scan\n\nMajors hold, alts mixed.\n\n## Movers\n\n**ZRO +12% day, +20% week** unlock news.\n\n## Style Map\n\n| Bucket | Coins (score) |\n|---|---|\n| A Pullback now | ZRO 75, NEAR 75 |\n| B Breakout | none |\n| C Pullback wait | GRASS 65 |\n| T Testing EMA50 | UNI 50, SOL 35 |\n| E Skip | ENA (chop ADX 19) |\n\n## Trade Plan\n\n| Ticker | Grade |\n|---|---|\n| NEAR | Good |\n\n## Catalysts\n\nNone.";
  const s = scanCourt(body);
  assert.deepEqual(s.strongest, [{ ticker: "ZRO", score: 75, bucket: "Pullback now" }, { ticker: "NEAR", score: 75, bucket: "Pullback now" }, { ticker: "GRASS", score: 65, bucket: "Pullback wait" }]);
  assert.ok(s.md.includes("Majors hold") && s.md.includes("## Movers"));
  assert.ok(!/Style Map|Trade Plan|Catalysts/.test(s.md));
});
