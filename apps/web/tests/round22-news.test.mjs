// Round 22: the shared friend news feed. Category filtering, de-duplication, expiry and the cap (lib/newsCats.ts),
// and the refresh (lib/sharedNews.ts) with a stand-in database and stand-in feeds: a failing source keeps its last
// good items, the two-hour lock holds, and before migration 0008 readers get the live feed instead of nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CAT_LABEL, NEWS_CATS, SOURCES, capPerCat, dedupe, expire, forCats, idOf, nextFeed } from "../src/lib/newsCats.ts";
import { FRIEND_LENSES, OWNER_LENSES } from "../src/lib/court/lenses.ts";
import { normLenses } from "../src/lib/court/state.ts";

const NOW = Date.parse("2026-11-02T12:00:00Z");
const ago = (h) => new Date(NOW - h * 3600e3).toISOString();
const it = (id, category, h, extra = {}) => ({ id, title: "Story " + id, publisher: "BBC", source: "bbc-world", category, link: "https://news.example/" + id, published_at: ago(h), fetched_at: ago(h), ...extra });

test("category filtering: chosen categories, Any topic, the tapped chip, and never nothing", () => {
  const items = [it("a", "crypto", 1), it("b", "health", 2), it("c", "science", 3), it("d", "local", 4)];
  assert.deepEqual(forCats(items, ["health", "science"]).map((x) => x.id), ["b", "c"]);
  assert.deepEqual(forCats(items, ["any"]).map((x) => x.id), ["a", "b", "c", "d"]);
  assert.deepEqual(forCats(items, ["health", "science"], "science").map((x) => x.id), ["c"]);
  assert.equal(forCats(items, ["off"]).length, 4, "no news category chosen (an old Off): everything, never empty");
  assert.equal(forCats(items, []).length, 4);
});

test("de-duplication: the same link however it is written, or the same headline from another source", () => {
  const a = it("a", "world", 1, { link: "https://news.example/story/1?utm=x" });
  const sameLink = it("b", "world", 2, { link: "http://NEWS.example/story/1/", title: "Different words" });
  const sameTitle = it("c", "world", 3, { link: "https://other.example/x", title: "  story A!! ", publisher: "DW" });
  const other = it("d", "world", 4);
  assert.deepEqual(dedupe([a, sameLink, sameTitle, other]).map((x) => x.id), ["a", "d"]);
  assert.equal(idOf("https://news.example/story/1?utm=x"), idOf("http://news.example/story/1/"), "one row id per story");
});

test("expiry: older than three days goes; an item without a time uses when it was fetched", () => {
  const kept = expire([it("new", "tech", 70), it("old", "tech", 73), it("nt", "tech", 1, { published_at: null, fetched_at: ago(80) })], NOW);
  assert.deepEqual(kept.map((x) => x.id), ["new"]);
});

test("a cap per category, newest first", () => {
  const many = Array.from({ length: 50 }, (_, i) => it("m" + i, "markets", i));
  const capped = capPerCat([...many, it("s", "science", 5)]);
  assert.equal(capped.filter((x) => x.category === "markets").length, 40);
  assert.equal(capped[0].id, "m0");
  assert.ok(capped.some((x) => x.id === "s"), "other categories keep their own room");
});

test("a source that failed this time keeps its last good items; fresh items join; expired ones leave", () => {
  const stored = [it("x1", "health", 5, { source: "npr-health" }), it("x2", "health", 80, { source: "npr-health" }), it("y1", "world", 6)];
  const fresh = [it("y2", "world", 0), it("y1", "world", 0)];
  assert.deepEqual(nextFeed(stored, fresh, NOW).map((x) => x.id).sort(), ["x1", "y1", "y2"]);
});

test("sources: every category covered, publishers' own names only, no memes, no internal provider names", () => {
  for (const c of NEWS_CATS) assert.ok(SOURCES.filter((s) => s.cat === c).length >= 2, c + " has at least two sources");
  assert.ok(!SOURCES.some((s) => /reddit|meme/i.test(s.id + s.publisher + s.url)));
  assert.ok(!SOURCES.some((s) => /bigdata|rss|feed|api/i.test(s.publisher)), "publisher names only");
  assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
  assert.ok(!("memes" in CAT_LABEL));
});

test("her own lens chips are unchanged; friends get the nine categories and Any topic, no Off", () => {
  assert.deepEqual(OWNER_LENSES, ["crypto", "macro", "markets", "world", "local", "tech", "any", "off"]);
  assert.deepEqual(FRIEND_LENSES, ["crypto", "macro", "markets", "world", "local", "tech", "politics", "health", "science", "any"]);
  assert.deepEqual(normLenses(undefined, "trading"), ["crypto", "macro", "markets"], "older documents read exactly as before");
  assert.deepEqual(normLenses(["health", "science", "nonsense"]), ["health", "science"]);
});

// The refresh, with a stand-in database (news_items, news_sources) and stand-in feeds.
const rss = (titles) => `<rss><channel>${titles.map((t, i) => `<item><title>${t}</title><link>https://feed.example/${encodeURIComponent(t)}</link><pubDate>${new Date(NOW - i * 3600e3).toUTCString()}</pubDate><description>Full article text that must never be kept.</description></item>`).join("")}</channel></rss>`;
function fakeDb(state) {
  return {
    from(t) {
      const q = { t, f: {}, op: "select", val: null };
      const run = () => {
        if (t === "news_sources" && q.op === "update") {
          if (!state.setUp) return { data: null, error: { message: "relation does not exist" } };
          const ok = Date.parse(state.run) < Date.parse(q.f.lt);
          if (ok) state.run = q.val.checked_at;
          return { data: ok ? [{ id: "_run" }] : [], error: null };
        }
        if (t === "news_sources" && q.op === "upsert") { state.sources = q.val; return { error: null }; }
        if (t === "news_items" && q.op === "select") return state.setUp ? { data: state.items, error: null } : { data: null, error: { message: "relation does not exist" } };
        if (t === "news_items" && q.op === "upsert") { state.items.push(...q.val); return { error: null }; }
        if (t === "news_items" && q.op === "delete") { state.items = state.items.filter((x) => !q.f.in.includes(x.id)); return { error: null }; }
        if (t === "news_sources" && q.op === "select") return { data: state.setUp ? (q.f.eq ? { checked_at: state.run } : []) : null, error: state.setUp ? null : { message: "missing" } };
        return { data: null, error: null };
      };
      Object.assign(q, {
        select() { if (q.op === "select") q.op = "select"; return q; },
        update(v) { q.op = "update"; q.val = v; return q; }, upsert(v) { q.op = "upsert"; q.val = v; return q; }, delete() { q.op = "delete"; return q; },
        eq(k, v) { q.f.eq = v; return q; }, neq() { return q; }, lt(k, v) { q.f.lt = v; return q; }, in(k, v) { q.f.in = v; return q; },
        order() { return q; }, limit() { return q; }, maybeSingle() { return Promise.resolve(run()); },
        then(res, rej) { return Promise.resolve(run()).then(res, rej); },
      });
      return q;
    },
  };
}
let down = new Set();
globalThis.fetch = async (u) => {
  const s = SOURCES.find((x) => x.url === String(u));
  if (!s || down.has(s.id)) return new Response("nope", { status: 503 });
  return new Response(rss([`${s.id} story one`, `${s.id} story two`]), { status: 200 });
};
const { refreshShared, readShared } = await import("../src/lib/sharedNews.ts");

test("refresh: saves headline, publisher, time, category and link only; a failing source keeps its items; the lock holds", async () => {
  const state = { setUp: true, run: "2000-01-01T00:00:00Z", items: [], sources: [] };
  const db = fakeDb(state);
  const r1 = await refreshShared(db, NOW);
  assert.equal(r1.ran, true);
  assert.equal(state.items.length, SOURCES.length * 2);
  assert.deepEqual(Object.keys(state.items[0]).sort(), ["category", "fetched_at", "id", "link", "published_at", "publisher", "source", "title"]);
  assert.ok(!JSON.stringify(state.items).includes("Full article text"), "no article text kept");
  const nprBefore = state.items.filter((x) => x.source === "npr-health").length;
  assert.equal((await refreshShared(db, NOW + 3600e3)).ran, false, "a second refresh within two hours is skipped");
  down = new Set(["npr-health"]);
  const r3 = await refreshShared(db, NOW + 3 * 3600e3);
  assert.equal(r3.ran, true);
  assert.deepEqual(r3.failed, ["npr-health"]);
  assert.equal(state.items.filter((x) => x.source === "npr-health").length, nprBefore, "its last good items stay");
  assert.equal(state.sources.find((s) => s.id === "npr-health").last_error, "status 503");
  down = new Set();
});

test("before migration 0008 (no tables yet) readers get the same sources live, never an empty feed", async () => {
  const feed = await readShared(fakeDb({ setUp: false, items: [] }), NOW);
  assert.equal(feed.from, "live");
  assert.ok(feed.items.length > 20);
  assert.equal(new Set(feed.items.map((x) => x.category)).size, NEWS_CATS.length);
});
