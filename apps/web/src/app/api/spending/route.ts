import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Coco's spending log (migration 0004). Runs with her session, so row-level security applies.
// If 0004 has not been run yet, every call answers { setup: true } instead of failing.
const missing = (e: { code?: string } | null) => !!e && (e.code === "42P01" || e.code === "PGRST205");
const CATS = new Set(["food", "transport", "home", "bills", "health", "pets", "fun", "shopping", "gifts", "other"]);

async function session() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET ?from=YYYY-MM-DD : her lines from that SGT day on (default: last 62 days).
export async function GET(req: Request) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const from = new URL(req.url).searchParams.get("from");
  const since = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from + "T00:00:00+08:00" : new Date(Date.now() - 62 * 86400000).toISOString();
  const { data, error } = await supabase.from("spending").select("id, at, amount, category, note").eq("user_id", user.id).gte("at", since).order("at", { ascending: false }).limit(500);
  if (missing(error)) return NextResponse.json({ setup: true, lines: [] });
  if (error) return NextResponse.json({ error: "Could not read spending" }, { status: 500 });
  return NextResponse.json({ lines: data });
}

// POST { amount, category, note? } : one line, plus its watering event for the garden.
export async function POST(req: Request) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let b: { amount?: unknown; category?: unknown; note?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const amount = typeof b.amount === "number" ? Math.round(b.amount * 100) / 100 : NaN;
  if (!(amount > 0 && amount < 1_000_000)) return NextResponse.json({ error: "Amount must be above 0" }, { status: 400 });
  const category = typeof b.category === "string" && CATS.has(b.category) ? b.category : "other";
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 80) || null : null;
  const { data, error } = await supabase.from("spending").insert({ user_id: user.id, amount, category, note }).select("id, at, amount, category, note").single();
  if (missing(error)) return NextResponse.json({ setup: true }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  await supabase.from("watering_events").upsert({ user_id: user.id, at: data.at, source: "spending", ref: "spending:" + data.id, weight: 1 }, { onConflict: "user_id,source,ref", ignoreDuplicates: true });
  return NextResponse.json({ line: data });
}

// DELETE ?id= : removes the line and its watering event (undo removes the water too).
export async function DELETE(req: Request) {
  const { supabase, user } = await session();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { error } = await supabase.from("spending").delete().eq("user_id", user.id).eq("id", id);
  if (missing(error)) return NextResponse.json({ setup: true }, { status: 409 });
  if (error) return NextResponse.json({ error: "Could not remove" }, { status: 500 });
  await supabase.from("watering_events").delete().eq("user_id", user.id).eq("source", "spending").eq("ref", "spending:" + id);
  return NextResponse.json({ ok: true });
}
