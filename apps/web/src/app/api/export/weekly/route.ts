import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadCalendars } from "@/lib/calendar";
import { normalize } from "@/lib/court/state";
import { PACKET_DEFAULT, buildPacket } from "@/lib/court/packet";
import { sgt, weekKey } from "@/lib/court/time";
import { skyEvents } from "@/lib/sky";

export const dynamic = "force-dynamic";

// Read-only weekly packet for the Sunday Kumo review task (BUILD-ORDER step 14b). Auth: header
// "Authorization: Bearer <READ_SECRET>" (separate from INGEST_SECRET). Off until READ_SECRET is set.
// Returns the owner's packet (the first login created), with the same sections she chose in the app.
function ok(got: string, want: string) {
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.READ_SECRET ?? "";
  if (secret.length < 32) return NextResponse.json({ error: "Weekly export is not set up yet (READ_SECRET missing)." }, { status: 503 });
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!ok(got, secret)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Server not configured" }, { status: 503 });

  const { data: users } = await db.auth.admin.listUsers({ perPage: 50 });
  const owner = (users?.users ?? []).sort((x, y) => x.created_at.localeCompare(y.created_at))[0];
  if (!owner) return NextResponse.json({ error: "No user" }, { status: 404 });
  const k = sgt(new Date()).key, wk = weekKey(k);
  const [row, trades, plans, water, spend, cal] = await Promise.all([
    db.from("user_state").select("data").eq("user_id", owner.id).maybeSingle(),
    db.from("trades").select("date, inst, exit, pnl, rules, tags, lesson, at").eq("user_id", owner.id),
    db.from("plans").select("date, inst, thesis, triggered, placed").eq("user_id", owner.id),
    db.from("watering_events").select("at, source, ref, weight").eq("user_id", owner.id).gte("at", new Date(Date.now() - 30 * 86400000).toISOString()),
    db.from("spending").select("at, amount, category").eq("user_id", owner.id).gte("at", wk + "T00:00:00+08:00"),
    loadCalendars(),
  ]);
  const st = normalize(row.data?.data ?? {}, k);
  const text = buildPacket({ st, k, events: cal.events, trades: trades.data ?? [], plans: plans.data ?? [], water: water.data ?? [], spending: spend.data ?? [],
    sky: skyEvents(new Date(wk + "T00:00:00+08:00"), 14), opts: { ...PACKET_DEFAULT, ...st.packet } });
  return NextResponse.json({ week: wk, packet: text }, { headers: { "Cache-Control": "no-store" } });
}
