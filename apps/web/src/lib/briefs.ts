import type { SupabaseClient } from "@supabase/supabase-js";
import { BRIEF_KINDS, KIND_ORDER, canonKind, type BriefKind } from "./briefKinds";

// Brief loading for the dashboard: newest brief per kind, with its source-status line and her vote.

export type BriefRow = { kind: BriefKind; title: string; body: string; at: string; sources: string | null };
export type Vote = { vote: "up" | "down"; note: string } | null;

// "Sources" line: from meta.sources (string or list), or a "Sources: ..." line in the body.
export function sourcesOf(body: string, meta: unknown): string | null {
  const m = meta && typeof meta === "object" ? (meta as Record<string, unknown>).sources : null;
  if (typeof m === "string" && m.trim()) return m.trim().slice(0, 300);
  if (Array.isArray(m) && m.length) return m.filter((x) => typeof x === "string").join(", ").slice(0, 300);
  const line = body.match(/^\s*(?:[*_#>\s]*)sources?(?:[*_]*)\s*[:：]\s*(.+)$/im);
  return line ? line[1].replace(/[*_]+/g, "").trim().slice(0, 300) : null;
}

export async function loadBriefs(supabase: SupabaseClient, userId: string) {
  // `meta` arrives with migration 0003; until then read without it.
  let res = await supabase.from("briefs").select("kind, title, body, at, meta").order("at", { ascending: false }).limit(200);
  if (res.error) res = (await supabase.from("briefs").select("kind, title, body, at").order("at", { ascending: false }).limit(200)) as typeof res;
  const latest = new Map<BriefKind, BriefRow>();
  const all: BriefRow[] = [];   // every row read above, newest first (the News tab's history)
  for (const r of (res.data ?? []) as { kind: string; title: string; body: string; at: string; meta?: unknown }[]) {
    const k = canonKind(r.kind);
    if (!k) continue;
    const row = { kind: k, title: r.title, body: r.body, at: r.at, sources: sourcesOf(r.body ?? "", r.meta) };
    all.push(row);
    if (!latest.has(k)) latest.set(k, row);
  }
  const rows = KIND_ORDER.filter((k) => latest.has(k)).map((k) => latest.get(k)!);
  const freshest = [...latest.values()].sort((a, b) => b.at.localeCompare(a.at))[0]?.kind ?? "";

  const votes: Record<string, Vote> = {};
  const { data: fb } = await supabase.from("feedback").select("brief_kind, items").eq("user_id", userId);
  for (const f of fb ?? []) {
    const items = Array.isArray(f.items) ? (f.items as { at: string; vote: "up" | "down"; note?: string }[]) : [];
    for (const r of rows) if (r.kind === canonKind(f.brief_kind)) {
      const it = items.find((x) => x.at === r.at);
      if (it) votes[r.kind] = { vote: it.vote, note: it.note ?? "" };
    }
  }
  return { rows, freshest, votes, all };
}

export const kindLabel = (k: BriefKind) => BRIEF_KINDS[k].label;

// Friends read only the two shared briefs that are written for everyone (Pulse and Intelligence). The Crypto scan,
// movers and Kumo's weekly review stay hers: the filter is here AND in the database (migration 0009 keeps the other
// shared rows owner-only), and this read happens on the server with the service key, never in the browser.
export const FRIEND_KINDS: BriefKind[] = ["pulse", "intel"];
export function sharedRows(raw: { kind: string; title: string; body: string; at: string; meta?: unknown; user_id?: string | null }[]): BriefRow[] {
  const latest = new Map<BriefKind, BriefRow>();
  for (const r of raw) {
    const k = canonKind(r.kind);
    if (!k || !FRIEND_KINDS.includes(k) || r.user_id || latest.has(k)) continue;
    latest.set(k, { kind: k, title: r.title, body: r.body, at: r.at, sources: sourcesOf(r.body ?? "", r.meta) });
  }
  return FRIEND_KINDS.filter((k) => latest.has(k)).map((k) => latest.get(k)!);
}
export async function loadSharedBriefs(db: SupabaseClient, supabase: SupabaseClient, userId: string) {
  const { data } = await db.from("briefs").select("kind, title, body, at, meta, user_id").is("user_id", null).order("at", { ascending: false }).limit(60);
  const rows = sharedRows((data ?? []) as Parameters<typeof sharedRows>[0]);
  const votes: Record<string, Vote> = {};
  const { data: fb } = await supabase.from("feedback").select("brief_kind, items").eq("user_id", userId);
  for (const f of fb ?? []) {
    const items = Array.isArray(f.items) ? (f.items as { at: string; vote: "up" | "down"; note?: string }[]) : [];
    for (const r of rows) if (r.kind === canonKind(f.brief_kind)) { const it = items.find((x) => x.at === r.at); if (it) votes[r.kind] = { vote: it.vote, note: it.note ?? "" }; }
  }
  return { rows, votes };
}
