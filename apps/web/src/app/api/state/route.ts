import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OWNED_KEYS } from "@/lib/court/state";
import { mergePatch } from "@/lib/court/merge";

export const dynamic = "force-dynamic";

const OWNED = new Set<string>(OWNED_KEYS);
const MAX_BYTES = 600_000;

// Saves the keys the dashboard owns into her user_state document.
// Body: { version, patch: { key: value } }. Merges by key: keys not in the patch, and keys this UI
// does not own, are never touched. Runs with her session, so row-level security applies.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: { version?: unknown; patch?: unknown };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const patch = body.patch;
  const check = mergePatch({}, patch, OWNED);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  // Two tries: if another tab saved in between, merge onto the newer document and try again.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: row, error } = await supabase.from("user_state").select("data, version").eq("user_id", user.id).maybeSingle();
    if (error) return NextResponse.json({ error: "Could not read state" }, { status: 500 });

    if (!row) {
      const { error: insErr } = await supabase.from("user_state").insert({ user_id: user.id, data: patch, version: 1 });
      if (!insErr) return NextResponse.json({ ok: true, version: 1 });
      continue;
    }

    const m = mergePatch(row.data, patch, OWNED);
    if (!m.ok) return NextResponse.json({ error: m.error }, { status: 400 });
    const merged = m.merged;
    const next = row.version + 1;
    const { data: upd, error: upErr } = await supabase
      .from("user_state")
      .update({ data: merged, version: next, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("version", row.version)
      .select("version");
    if (upErr) return NextResponse.json({ error: "Could not save" }, { status: 500 });
    if (upd && upd.length) return NextResponse.json({ ok: true, version: next, stale: body.version !== row.version });
  }
  return NextResponse.json({ error: "Busy, try again" }, { status: 409 });
}
