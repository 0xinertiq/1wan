// Clustering and scoring tests (docs/build-intel.md C, I). Mocked headlines, not live data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cluster, isSpam, norm } from "../src/lib/cluster.ts";

const now = Date.parse("2026-10-27T12:00:00Z");
const at = (h) => new Date(now - h * 3600e3).toISOString();
const it = (title, source, tier, h) => ({ title, source, tier, at: at(h), link: "https://x/" + encodeURIComponent(title + source) });

test("near-duplicates cluster, unrelated stay apart", () => {
  const cs = cluster([
    it("Fed holds interest rates steady, signals patience", "Reuters", "wire", 1),
    it("Federal Reserve holds rates steady and signals patience", "BBC", "wire", 2),
    it("Bitcoin ETF sees record inflows", "CoinDesk", "media", 1),
  ], { now });
  assert.equal(cs.length, 2);
  assert.equal(cs.find((c) => c.items.length === 2).sources, 2);
});

test("identical wording across sources is flagged as syndicated and counted once", () => {
  const cs = cluster([it("Oil jumps 3% on supply fears", "Wire A", "wire", 1), it("Oil jumps 3% on supply fears", "Paper B", "media", 1)], { now });
  assert.equal(cs.length, 1); assert.equal(cs[0].syndicated, true); assert.equal(cs[0].independent, 1);
});

test("score rewards primary source, recency, watchlist and independent sources", () => {
  const [a] = cluster([it("ECB raises rates as SOL rallies", "ECB", "primary", 0.5), it("European Central Bank lifts rates; SOL rallies", "BBC", "wire", 0.5)], { now, watch: ["sol"] });
  const [b] = cluster([it("Celebrity buys a yacht", "Blog", "social", 30)], { now });
  assert.ok(a.score > b.score); assert.ok(a.why.some((w) => w.includes("watchlist")));
  assert.ok(a.score <= 100 && b.score >= 0);
});

test("spam is dropped and normalisation strips stop words", () => {
  assert.ok(isSpam("Sponsored: the next 100x coin"));
  assert.equal(norm("The Fed and the ECB!"), "fed ecb");
  assert.equal(cluster([it("Use my link for a promo code", "TG", "social", 1)], { now }).length, 0);
});
