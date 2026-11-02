import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authUrl } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// "Connect Google Calendar" (Settings): sends a signed-in friend to Google's consent screen, read-only calendar
// access. A one-time state value in a short-lived cookie proves the answer that comes back is for this request.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const state = crypto.randomUUID();
  const url = authUrl(req.nextUrl.origin, state);
  if (!url) return NextResponse.redirect(new URL("/dashboard?gcal=unavailable#settings", req.url));
  const res = NextResponse.redirect(url);
  res.cookies.set("gcal_state", state, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/google", maxAge: 600 });
  return res;
}
