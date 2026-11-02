import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshShared } from "@/lib/sharedNews";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/news/refresh, for the schedule (.github/workflows/news-refresh.yml, every three hours).
// Auth: header "Authorization: Bearer <NEWS_REFRESH_SECRET>". Off until that secret is set. Signed-in readers also
// trigger a refresh when the feed is stale (/api/news/shared), so the schedule is a convenience, not a need.
export async function POST(req: Request) {
  const secret = process.env.NEWS_REFRESH_SECRET ?? "";
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got), b = Buffer.from(secret);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Not set up" }, { status: 503 });
  return NextResponse.json(await refreshShared(db));
}
