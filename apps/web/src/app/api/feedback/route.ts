import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canonKind } from "@/lib/briefKinds";

export const dynamic = "force-dynamic";

// Useful / not useful on a brief. Saved per user and brief kind in `feedback.items` (newest first, last 60 kept).
// Body: { kind, at, vote: "up" | "down", note? }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let b: { kind?: unknown; at?: unknown; vote?: unknown; note?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const kind = canonKind(b.kind);
  const at = typeof b.at === "string" && !isNaN(Date.parse(b.at)) ? b.at : null;
  const vote = b.vote === "up" || b.vote === "down" ? b.vote : null;
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) : "";
  if (!kind || !at || !vote) return NextResponse.json({ error: "Need kind, at and vote" }, { status: 400 });

  const { data: row } = await supabase.from("feedback").select("items").eq("user_id", user.id).eq("brief_kind", kind).maybeSingle();
  const items = Array.isArray(row?.items) ? (row!.items as { at: string }[]).filter((x) => x.at !== at) : [];
  items.unshift({ at, vote, note, ts: new Date().toISOString() } as { at: string });
  const { error } = await supabase.from("feedback").upsert(
    { user_id: user.id, brief_kind: kind, items: items.slice(0, 60), updated_at: new Date().toISOString() },
    { onConflict: "user_id,brief_kind" }
  );
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
