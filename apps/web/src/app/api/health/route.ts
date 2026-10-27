import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadNews } from "@/lib/news";
import { loadEcon } from "@/lib/econ";
import { candles } from "@/lib/candles";
import { loadDerivs } from "@/lib/derivs";
import { HANDLE, fetchChannel } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Source health (docs/build-intel.md D): one status per source. Uses the same caches as the cards,
// so opening this does not hammer anyone.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: row } = await supabase.from("user_state").select("data").eq("user_id", user.id).maybeSingle();
  const chans = ((row?.data as { tg?: { channels?: { handle: string; enabled: boolean }[] } } | null)?.tg?.channels ?? []).filter((c) => c.enabled && HANDLE.test(c.handle));
  const [news, econ, btc, der, tg] = await Promise.all([loadNews(), loadEcon(), candles("BTC", "1h"), loadDerivs(["BTC"]), Promise.all(chans.map((c) => fetchChannel(c.handle)))]);
  const now = new Date().toISOString();
  const rows = [
    ...news.feeds.map((f) => ({ group: "News", name: f.name, status: f.status, lastOk: f.lastOk, note: f.error ?? (f.newest ? "newest item " + f.newest : "") })),
    ...tg.map((t) => ({ group: "Telegram", name: "@" + t.health.handle, status: t.health.ok ? "ok" : "failed", lastOk: t.health.ok ? t.health.at : null, note: t.health.error ?? `${t.health.items} posts` })),
    { group: "Calendar", name: "Economic calendar (unofficial)", status: econ.ok ? "ok" : "failed", lastOk: econ.ok ? econ.at : null, note: econ.error ?? `${econ.items.length} events` },
    { group: "Market data", name: "Crypto.com candles", status: btc ? "ok" : "failed", lastOk: btc ? new Date(btc.fetched).toISOString() : null, note: btc ? `BTC 1h, ${btc.cs.length} candles` : "not reachable" },
    { group: "Market data", name: "Funding and open interest", status: der.items[0]?.ok ? "ok" : "failed", lastOk: der.items[0]?.ok ? der.at : null, note: der.items[0]?.ok ? "via " + der.items[0].source : der.items[0]?.reason ?? "" },
  ];
  return NextResponse.json({ at: now, rows });
}
