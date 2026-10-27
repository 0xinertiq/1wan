import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Swing trade ledger (migration 0004): trades, plans, gamble, ledger_settings. Her session, so RLS applies.
// Until 0004 is run every call answers { setup: true }. Saving a trade or plan waters the garden.
const missing = (e: { code?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205");
const COLS: Record<string, string[]> = {
  trades: ["id", "date", "inst", "dir", "entry", "exit", "stop", "size", "lev", "pnl", "setup", "lesson", "tags", "rules", "checks", "plan_id", "at"],
  plans: ["id", "date", "inst", "dir", "entry", "stop", "target", "until", "thesis", "wrong", "narrative", "seen_where", "stage", "confidence", "lesson", "share_x", "checks", "triggered", "placed", "outcome", "at"],
  gamble: ["id", "date", "what", "pnl", "note", "at"],
};
const WATER: Record<string, string> = { trades: "trade", plans: "plan" };

async function session() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const [t, p, g, s] = await Promise.all([
    supabase.from("trades").select("*").eq("user_id", user.id).order("at", { ascending: false }).limit(1000),
    supabase.from("plans").select("*").eq("user_id", user.id).order("at", { ascending: false }).limit(500),
    supabase.from("gamble").select("*").eq("user_id", user.id).order("at", { ascending: false }).limit(500),
    supabase.from("ledger_settings").select("account, risk_pct, rules, wallets").eq("user_id", user.id).maybeSingle(),
  ]);
  if ([t, p, g, s].some((x) => missing(x.error))) return NextResponse.json({ setup: true });
  if ([t, g, s].some((x) => x.error)) return NextResponse.json({ error: "Could not read the ledger" }, { status: 500 });
  return NextResponse.json({ trades: t.data, plans: p.data ?? [], gamble: g.data, settings: s.data });
}

// POST { table, row } upserts one row (or { table: "ledger_settings", row: {account, risk_pct, rules} }).
export async function POST(req: Request) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let b: { table?: string; row?: Record<string, unknown> };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const row = b.row && typeof b.row === "object" ? b.row : null;
  if (!row) return NextResponse.json({ error: "Missing row" }, { status: 400 });

  if (b.table === "ledger_settings") {
    const rules = Array.isArray(row.rules) ? row.rules.filter((r) => typeof r === "string").slice(0, 3).map((r) => (r as string).slice(0, 140)) : [];
    const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
    const { error } = await supabase.from("ledger_settings").upsert({ user_id: user.id, account: n(row.account), risk_pct: n(row.risk_pct), rules, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (missing(error)) return NextResponse.json({ setup: true }, { status: 409 });
    return error ? NextResponse.json({ error: "Could not save" }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  const cols = COLS[b.table ?? ""];
  if (!cols) return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  if (typeof row.id !== "string" || !/^[\w-]{1,60}$/.test(row.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const clean: Record<string, unknown> = { user_id: user.id };
  for (const c of cols) if (c in row) clean[c] = row[c];
  const { data, error } = await supabase.from(b.table!).upsert(clean, { onConflict: "user_id,id" }).select("*").single();
  if (missing(error)) return NextResponse.json({ setup: true }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: error?.code === "PGRST204" ? "Run migration 0005 to save stops on plans" : "Could not save" }, { status: 500 });
  const src = WATER[b.table!];
  if (src) await supabase.from("watering_events").upsert({ user_id: user.id, at: data.at, source: src, ref: src + ":" + data.id, weight: 1 }, { onConflict: "user_id,source,ref", ignoreDuplicates: true });
  return NextResponse.json({ row: data });
}

// DELETE ?table=&id= removes the row and its watering event.
export async function DELETE(req: Request) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const u = new URL(req.url).searchParams;
  const table = u.get("table") ?? "", id = u.get("id") ?? "";
  if (!COLS[table] || !/^[\w-]{1,60}$/.test(id)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { error } = await supabase.from(table).delete().eq("user_id", user.id).eq("id", id);
  if (missing(error)) return NextResponse.json({ setup: true }, { status: 409 });
  if (error) return NextResponse.json({ error: "Could not remove" }, { status: 500 });
  const src = WATER[table];
  if (src) await supabase.from("watering_events").delete().eq("user_id", user.id).eq("source", src).eq("ref", src + ":" + id);
  return NextResponse.json({ ok: true });
}
