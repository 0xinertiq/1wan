import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readShared, refreshShared } from "@/lib/sharedNews";

export const dynamic = "force-dynamic";

// The shared friend news feed (round 22). When the saved feed is over three hours old, a refresh runs on the server
// after this answer is sent (the two-hour lock keeps it to one, however many people open News).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const feed = await readShared(supabase);
    if (feed.stale) after(async () => { const db = createAdminClient(); if (db) await refreshShared(db).catch(() => {}); });
    return NextResponse.json({ at: feed.at, items: feed.items, failed: feed.failed }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "News is not reachable right now" }, { status: 503 });
  }
}
