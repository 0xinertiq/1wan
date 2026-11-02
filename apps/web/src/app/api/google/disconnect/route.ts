import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disconnect } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// "Disconnect" (Settings, a form POST): forgets this account's Google tokens and asks Google to revoke them.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  await disconnect(user.id);
  return NextResponse.redirect(new URL("/dashboard?gcal=disconnected#settings", req.url), { status: 303 });
}
