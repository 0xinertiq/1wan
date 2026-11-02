import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFeed } from "@/lib/news";
import { PER_SOURCE, SOURCES, idOf, nextFeed, type Item, type Source } from "@/lib/newsCats";

// Server only. The shared friend news feed (round 22): fetched from free public RSS feeds (lib/newsCats.ts) at
// most every two hours, saved once in Supabase (news_items, migration 0008) and read by every friend. No paid API,
// no AI, nothing per user. Until 0008 is applied, readers get the same feed fetched live (cached in memory), so
// News is never empty.
const LOCK_MS = 2 * 3600e3, STALE_MS = 3 * 3600e3, LIVE_MS = 15 * 60e3;

async function fetchSource(s: Source, now: number): Promise<Item[]> {
  const r = await fetch(s.url, { cache: "no-store", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (compatible; 1wan-dashboard/1.0)", Accept: "application/rss+xml, application/xml, text/xml" } });
  if (!r.ok) throw new Error("status " + r.status);
  const got = parseFeed(await r.text(), { id: s.id, name: s.publisher, group: "World", url: s.url });
  if (!got.length) throw new Error("no items");
  const at = new Date(now).toISOString();
  // a time more than a day ahead is a feed mistake: treat it as "now"
  return got.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, PER_SOURCE)
    .map((h) => ({ id: idOf(h.link), title: h.title, publisher: s.publisher, source: s.id, category: s.cat, link: h.link, published_at: h.at && Date.parse(h.at) < now + 86400e3 ? h.at : at, fetched_at: at }));
}
async function fetchAll(now: number) {
  const res = await Promise.allSettled(SOURCES.map((s) => fetchSource(s, now)));
  const fresh: Item[] = [], failed: Source[] = [];
  res.forEach((r, i) => (r.status === "fulfilled" ? fresh.push(...r.value) : failed.push(SOURCES[i])));
  return { fresh, failed, res };
}

/** One refresh with the service role. Skips quietly when another refresh ran in the last two hours. */
export async function refreshShared(db: SupabaseClient, now = Date.now()): Promise<{ ran: boolean; added?: number; removed?: number; failed?: string[]; error?: string }> {
  const lock = await db.from("news_sources").update({ checked_at: new Date(now).toISOString() }).eq("id", "_run").lt("checked_at", new Date(now - LOCK_MS).toISOString()).select("id");
  if (lock.error) return { ran: false, error: "not set up" };
  if (!lock.data?.length) return { ran: false };
  const { fresh, failed, res } = await fetchAll(now);
  const iso = new Date(now).toISOString();
  await db.from("news_sources").upsert(SOURCES.map((s, i) => res[i].status === "fulfilled" ? { id: s.id, last_ok: iso, last_error: null, checked_at: iso } : { id: s.id, last_error: String((res[i] as PromiseRejectedResult).reason?.message ?? "failed").slice(0, 120), checked_at: iso }), { onConflict: "id", ignoreDuplicates: false });
  const { data: stored, error } = await db.from("news_items").select("*").limit(2000);
  if (error) return { ran: true, error: "could not read the feed" };
  const keep = nextFeed((stored ?? []) as Item[], fresh, now);
  const had = new Set((stored ?? []).map((x) => x.id as string)), want = new Set(keep.map((x) => x.id));
  const add = keep.filter((x) => !had.has(x.id)), drop = [...had].filter((id) => !want.has(id));
  if (add.length) await db.from("news_items").upsert(add, { onConflict: "id" });
  for (let i = 0; i < drop.length; i += 200) await db.from("news_items").delete().in("id", drop.slice(i, i + 200));
  return { ran: true, added: add.length, removed: drop.length, failed: failed.map((s) => s.id) };
}

let live: { at: number; items: Item[]; failed: string[] } | null = null;
export type SharedFeed = { at: string | null; items: Item[]; failed: string[]; from: "db" | "live"; stale: boolean };

/** The feed for a signed-in reader (their own session, so row-level security applies). */
export async function readShared(sb: SupabaseClient, now = Date.now()): Promise<SharedFeed> {
  const [items, run, src] = await Promise.all([
    sb.from("news_items").select("id, title, publisher, source, category, link, published_at, fetched_at").order("published_at", { ascending: false }).limit(400),
    sb.from("news_sources").select("checked_at").eq("id", "_run").maybeSingle(),
    sb.from("news_sources").select("id, last_ok, checked_at").neq("id", "_run"),
  ]);
  if (!items.error && items.data?.length) {
    const at = run.data?.checked_at ?? null;
    // a source whose last good fetch is older than its last try is down right now; its saved items still show
    const failed = (src.data ?? []).filter((s) => !s.last_ok || s.last_ok < s.checked_at).map((s) => SOURCES.find((x) => x.id === s.id)?.publisher ?? "").filter(Boolean);
    return { at, items: items.data as Item[], failed: [...new Set(failed)], from: "db", stale: !at || Date.parse(at) < now - STALE_MS };
  }
  // 0008 not applied yet, or the very first refresh has not run: the same sources, fetched live
  if (!live || now - live.at > LIVE_MS) {
    const { fresh, failed } = await fetchAll(now);
    live = { at: now, items: nextFeed(live?.items ?? [], fresh, now), failed: failed.map((s) => s.publisher) };
  }
  return { at: new Date(live.at).toISOString(), items: live.items, failed: [...new Set(live.failed)], from: "live", stale: !items.error };
}
