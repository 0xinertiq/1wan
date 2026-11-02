import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwner } from "@/lib/owner";
import { loadCalendars } from "@/lib/calendar";
import { loadGoogle } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// Calendar events for the next months, read-only. Returns names, colours and events only: the owner's secret
// calendar addresses and every Google token stay on the server.
// The owner keeps her calendars from the server settings. Everyone else sees only their own Google Calendar, once
// they connect it in Settings (round 22); until then "not connected". If the owner cannot be confirmed, nobody
// gets her calendars.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const headers = { "Cache-Control": "private, max-age=300" };
  try {
    if (await isOwner(user.id)) return NextResponse.json({ ...(await loadCalendars()), google: "owner" }, { headers });
    return NextResponse.json(await loadGoogle(user.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ state: "error", cals: [], events: [] });
  }
}
