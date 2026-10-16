import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadCalendars } from "@/lib/calendar";

export const dynamic = "force-dynamic";

// Her calendar events for the next month, merged from up to 5 calendars. Read-only.
// Returns names, colours and events only; the secret calendar addresses stay on the server.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    return NextResponse.json(await loadCalendars(), { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ state: "error", cals: [], events: [] });
  }
}
