import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveFromCode } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// Google sends the friend back here after the consent screen. Declined, a mismatched state or a failed exchange
// all return to Settings with a friendly message (?gcal=…); the tokens are saved on the server only.
export async function GET(req: NextRequest) {
  const back = (gcal: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard?gcal=${gcal}#settings`, req.url));
    res.cookies.delete({ name: "gcal_state", path: "/api/google" });
    return res;
  };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const q = req.nextUrl.searchParams;
  if (q.get("error")) return back(q.get("error") === "access_denied" ? "declined" : "failed");
  const state = req.cookies.get("gcal_state")?.value;
  if (!state || state !== q.get("state") || !q.get("code")) return back("failed");
  return back(await saveFromCode(user.id, q.get("code")!, req.nextUrl.origin));
}
