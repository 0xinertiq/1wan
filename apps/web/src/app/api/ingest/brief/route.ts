import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { canonKind } from "@/lib/briefKinds";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/ingest/brief  (add ?dryRun=1 to validate without writing)
// For her scheduled tasks. Auth: header "Authorization: Bearer <INGEST_SECRET>".
// Writes one shared brief (user_id NULL) with the service role key, which never leaves the server.
// Exact JSON is documented in prompts/INGEST.md.

const MAX_BYTES = 200_000;
const ALLOWED = new Set(["kind", "title", "body", "meta", "at"]);

// Light rate limit: 20 requests per 10 minutes per address (per server instance).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) ?? []).filter((t) => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 20;
}

function authorised(req: Request, secret: string) {
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = createHash("sha256").update(got).digest(), b = createHash("sha256").update(secret).digest();
  return got.length > 0 && timingSafeEqual(a, b);
}

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const secret = process.env.INGEST_SECRET ?? "";
  if (secret.length < 32) return bad("Ingest is not set up yet (INGEST_SECRET missing or shorter than 32 characters).", 503);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return bad("Too many requests. Try again in a few minutes.", 429);
  if (!authorised(req, secret)) return bad("Not authorised.", 401);

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return bad("Too large (max 200 KB).", 413);
  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return bad("Body is not valid JSON."); }
  if (!b || typeof b !== "object" || Array.isArray(b)) return bad("Body must be a JSON object.");

  const extra = Object.keys(b).filter((k) => !ALLOWED.has(k));
  if (extra.length) return bad("Unknown fields: " + extra.join(", "));
  const kind = canonKind(b.kind);
  if (!kind) return bad("kind must be one of: pulse, intel, scan, movers, review (or weekday, weekend, daily).");
  if (typeof b.title !== "string" || !b.title.trim() || b.title.length > 200) return bad("title must be text, 1 to 200 characters.");
  if (typeof b.body !== "string" || !b.body.trim() || b.body.length > 100_000) return bad("body must be text, 1 to 100,000 characters.");
  let meta: Record<string, unknown> | null = null;
  if (b.meta != null) {
    if (typeof b.meta !== "object" || Array.isArray(b.meta)) return bad("meta must be an object.");
    if (JSON.stringify(b.meta).length > 4000) return bad("meta is too large (max 4,000 characters).");
    const s = (b.meta as Record<string, unknown>).sources;
    if (s != null && typeof s !== "string" && !(Array.isArray(s) && s.every((x) => typeof x === "string"))) return bad("meta.sources must be text or a list of text.");
    meta = b.meta as Record<string, unknown>;
  }
  let at = new Date().toISOString();
  if (b.at != null) {
    const t = typeof b.at === "string" ? Date.parse(b.at) : NaN;
    if (isNaN(t) || Math.abs(t - Date.now()) > 2 * 86400000) return bad("at must be an ISO time within 2 days of now, or left out.");
    at = new Date(t).toISOString();
  }
  const row = { user_id: null, kind, title: b.title.trim(), body: b.body, at };

  if (new URL(req.url).searchParams.get("dryRun") === "1")
    return NextResponse.json({ ok: true, dryRun: true, would_write: { kind, title: row.title, at, body_chars: row.body.length, meta: meta ?? null } });

  const db = createAdminClient();
  if (!db) return bad("Server is missing its Supabase settings.", 503);
  let res = await db.from("briefs").insert({ ...row, meta }).select("id").single();
  if (res.error && /meta/i.test(res.error.message)) {
    // Migration 0003 not run yet: keep the sources by putting them in the body instead.
    const src = meta?.sources;
    const body = src ? `${row.body}\n\nSources: ${Array.isArray(src) ? src.join(", ") : src}` : row.body;
    res = await db.from("briefs").insert({ ...row, body }).select("id").single();
  }
  if (res.error) return bad("Could not save the brief.", 500);
  return NextResponse.json({ ok: true, id: res.data.id, kind, at });
}
