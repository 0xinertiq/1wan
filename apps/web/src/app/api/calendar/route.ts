import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerId } from "@/lib/usage";
import { loadCalendars } from "@/lib/calendar";

export const dynamic = "force-dynamic";

// Her calendar events for the next month, merged from up to 8 calendars. Read-only.
// Returns names, colours and events only; the secret calendar addresses stay on the server.
// The calendar addresses are hers (server settings), so only the owner (first account) gets them; every other
// signed-in user sees "not connected". If the owner cannot be confirmed, nobody gets them.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = createAdminClient();
  if (!db || user.id !== (await ownerId(db))) return NextResponse.json({ state: "off", cals: [], events: [] }, { headers: { "Cache-Control": "private, max-age=300" } });
  try {
    return NextResponse.json(await loadCalendars(), { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ state: "error", cals: [], events: [] });
  }
}
