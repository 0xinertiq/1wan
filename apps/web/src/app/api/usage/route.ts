import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

// POST /api/usage {feature, chars}: the signed-in user logs one run of an in-app feature that hands text
// to her own Claude (today only "weekly-packet:copy"). Writes go through the service role (usage has no
// insert policy); only her own user id and a fixed feature list are accepted.
const FEATURES = new Set(["weekly-packet:copy"]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  let b: { feature?: unknown; chars?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad body" }, { status: 400 }); }
  const feature = String(b.feature ?? "");
  if (!FEATURES.has(feature)) return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
  const chars = typeof b.chars === "number" && b.chars >= 0 ? Math.min(b.chars, 400_000) : 0;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  await logUsage(db, { userId: user.id, feature, input: Math.ceil(chars / 4) });
  return NextResponse.json({ ok: true });
}
