// Brief readers for the New-look Court (components/kumo/briefParse.ts). Made-up brief text, not real briefs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { topFive, todaysPlan, isNoMovers, reviewParts, cleanSources } from "../src/components/kumo/briefParse.ts";

const intel = "# Daily Intelligence\n## Top 5 headlines\n1. **Fed holds rates** — markets expect a cut in March. [Reuters](https://r.example/a)\n2. **ETF inflows rise** — third week in a row. [CoinDesk](https://c.example/b)\n- **Yen slips**: BoJ stays put\n## Macro\nCPI on Thursday.";

test("Top 5 comes from its own section with bold headline, why and links", () => {
  const t = topFive(intel);
  assert.equal(t.fromSection, true);
  assert.equal(t.items.length, 3);
  assert.deepEqual(t.items[0], { title: "Fed holds rates", why: "markets expect a cut in March. Reuters", links: [{ text: "Reuters", url: "https://r.example/a" }] });
  assert.equal(t.items[2].title, "Yen slips");
  assert.equal(t.items[2].why, "BoJ stays put");
});

test("older briefs fall back to the first line of each block", () => {
  const t = topFive("# Brief\n## Macro\n- Fed speakers at 2pm\n## Crypto\nBTC range holds");
  assert.equal(t.fromSection, false);
  assert.deepEqual(t.items.map((x) => x.title + ": " + x.why), ["Macro: Fed speakers at 2pm", "Crypto: BTC range holds"]);
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
  assert.equal(cleanSources("Bigdata unavailable, used web search and RSS"), "used web search and RSS");
  assert.equal(cleanSources("RSS; Bigdata.com"), "RSS");
});
