import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// One watering event per real tick (grid cell, ladder milestone, quest). on:false removes it, so undoing
// a tick takes the water back. Her session, so RLS applies. Quiet { setup: true } before migration 0004.
const SOURCES = new Set(["grid", "milestone", "quest", "anchors", "samsara"]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let b: { source?: unknown; ref?: unknown; weight?: unknown; on?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const source = String(b.source ?? ""), ref = String(b.ref ?? "");
  if (!SOURCES.has(source) || !/^[\w.:-]{1,80}$/.test(ref)) return NextResponse.json({ error: "Bad event" }, { status: 400 });
  const weight = typeof b.weight === "number" && b.weight > 0 && b.weight <= 10 ? b.weight : 1;
  const { error } = b.on === false
    ? await supabase.from("watering_events").delete().eq("user_id", user.id).eq("source", source).eq("ref", ref)
    : await supabase.from("watering_events").upsert({ user_id: user.id, source, ref, weight }, { onConflict: "user_id,source,ref", ignoreDuplicates: true });
  if (error && (error.code === "42P01" || error.code === "PGRST205")) return NextResponse.json({ setup: true });
  return error ? NextResponse.json({ error: "Could not save" }, { status: 500 }) : NextResponse.json({ ok: true });
}
