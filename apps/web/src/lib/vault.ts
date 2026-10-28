"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// One storage layer for the round 6 records, two backends behind one interface:
// - "db": the real Supabase tables from migration 0006 (owner-only RLS), used when NEXT_PUBLIC_1WAN_TABLES=on.
// - "device": per-device preview storage (localStorage, versioned and validated), clearly labelled
//   "Preview storage, this device only", so every feature can be used on the preview before the migration.
// Rows are { id, at (created), up (updated), ...fields }. A row that fails to save keeps the honest status "error".

export const TABLES = ["journal_entries", "goals", "finance_entries", "research_notes", "longterm_watchlist", "tasks", "routines"] as const;
export type Table = (typeof TABLES)[number];
export type VRow = { id: string; at: string; up: string; [k: string]: unknown };
export type VStatus = "idle" | "saving" | "saved" | "error";

export const vaultMode = (): "db" | "device" => (process.env.NEXT_PUBLIC_1WAN_TABLES === "on" ? "db" : "device");
export const VAULT_LABEL = { db: "Saved to your account", device: "Preview storage, this device only" } as const;

// Every row is cleaned on read, per table: odd or missing fields get safe defaults and a row that cannot be
// understood is dropped, so an old or broken record can never break a card.
type Raw = Record<string, unknown>;
const S = (v: unknown, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");
const OS = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const SL = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const N = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
// Never keep anything that looks like an account or card number (8 or more digits, spaces or dashes allowed).
export const NOACC = (s: string) => s.replace(/\d[\d -]{6,}\d/g, "•••");
const CLEAN: Record<Table, (r: Raw) => Raw | null> = {
  journal_entries: (r) => (typeof r.day === "string" && DAY.test(r.day) ? { day: r.day, text: S(r.text), tags: SL(r.tags), notes: SL(r.notes), mood: N(r.mood) != null && (r.mood as number) >= 1 && (r.mood as number) <= 5 ? r.mood : undefined, plan: S(r.plan, 1000), feel: S(r.feel, 1000), change: S(r.change, 1000), tradeId: OS(r.tradeId) } : null),
  goals: (r) => ({ title: S(r.title, 80) || "Untitled goal", why: S(r.why, 300), target: typeof r.target === "string" && DAY.test(r.target) ? r.target : "", ms: (Array.isArray(r.ms) ? r.ms : []).filter((m) => m && typeof m === "object" && typeof (m as Raw).id === "string").map((m) => ({ id: (m as Raw).id as string, t: S((m as Raw).t, 100), done: (m as Raw).done === true })) }),
  finance_entries: (r) => {
    // round 9: loans owed to her, income typed once a month, and a small history of figure edits
    if (r.kind === "loan") return typeof r.name === "string" && r.name && N(r.lent) != null ? { kind: "loan", name: NOACC(S(r.name, 60)), lent: Math.max(0, N(r.lent) as number), date: typeof r.date === "string" && DAY.test(r.date) ? r.date : undefined,
      repaid: (Array.isArray(r.repaid) ? r.repaid : []).filter((x) => x && typeof x === "object" && DAY.test(String((x as Raw).date)) && (N((x as Raw).amt) ?? 0) > 0).map((x) => ({ date: (x as Raw).date as string, amt: N((x as Raw).amt) as number })),
      off: Math.max(0, N(r.off) ?? 0), note: NOACC(S(r.note, 120)) } : null;
    if (r.kind === "income") return typeof r.month === "string" && /^\d{4}-\d{2}$/.test(r.month) && N(r.amt) != null ? { kind: "income", month: r.month, amt: Math.max(0, N(r.amt) as number) } : null;
    if (r.kind === "edit") return typeof r.fig === "string" && N(r.to) != null ? { kind: "edit", fig: S(r.fig, 60), label: NOACC(S(r.label, 60)), from: N(r.from) ?? 0, to: N(r.to), undo: OS(r.undo) } : null;
    return (r.kind !== "budget" && r.kind !== "entry") || N(r.amt) == null ? null : { kind: r.kind, cat: S(r.cat, 30) || "other", amt: N(r.amt), date: typeof r.date === "string" && DAY.test(r.date) ? r.date : undefined, type: r.type === "in" ? "in" : "out", note: NOACC(S(r.note, 120)) };
  },
  research_notes: (r) => ({ kind: r.kind === "macro" ? "macro" : "note", title: S(r.title, 120), text: S(r.text, 4000), tags: SL(r.tags), url: typeof r.url === "string" && /^https?:\/\//.test(r.url) ? r.url : undefined, pinned: r.pinned === true, lens: r.lens === "local" || r.lens === "any" ? r.lens : r.lens === "trading" ? "trading" : undefined, watch: OS(r.watch), week: OS(r.week) }),
  longterm_watchlist: (r) => (typeof r.name === "string" && r.name ? { name: S(r.name, 60), sector: S(r.sector, 60), thesis: S(r.thesis, 1000), catalysts: S(r.catalysts, 300), status: r.status === "watching" || r.status === "owned" ? r.status : "studying", notes: S(r.notes, 500), links: S(r.links, 500) } : null),
  tasks: (r) => (typeof r.title === "string" && r.title ? { title: S(r.title, 120), due: typeof r.due === "string" && DAY.test(r.due) ? r.due : undefined, pri: r.pri === "high" || r.pri === "low" ? r.pri : "normal", done: r.done === true } : null),
  routines: (r) => (typeof r.name === "string" && r.name ? { name: S(r.name, 60), kind: r.kind === "pet" || r.kind === "self" ? r.kind : "custom", every: N(r.every) && (r.every as number) > 0 ? Math.round(r.every as number) : 7, last: typeof r.last === "string" && DAY.test(r.last) ? r.last : undefined, start: typeof r.start === "string" && DAY.test(r.start) ? r.start : undefined, paused: r.paused === true } : null),
};
export function cleanRows(t: Table, rows: unknown): VRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((r) => {
    if (!r || typeof r !== "object" || typeof (r as Raw).id !== "string") return [];
    const x = r as Raw, c = CLEAN[t](x);
    return c ? [{ ...c, id: x.id as string, at: S(x.at, 40), up: S(x.up, 40) } as VRow] : [];
  });
}
// Not under the settings prefix on purpose: "Reset saved settings on this device" must never delete records.
const key = (t: Table) => "1wanvault.v1." + t;
function readDevice(t: Table): VRow[] {
  try { return cleanRows(t, JSON.parse(localStorage.getItem(key(t)) ?? "[]")); } catch { return []; }
}
const MAX = 2000;
export const newId = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

// In-memory copy per table, shared by every card on the page; listeners re-render when a table changes.
const cache = new Map<Table, VRow[]>();
const subs = new Map<Table, Set<() => void>>();
const loading = new Map<Table, Promise<void>>();
const failed = new Set<Table>();
const ping = (t: Table) => subs.get(t)?.forEach((f) => f());

// Real columns kept alongside data (see 0006): research_notes.kind, journal_entries.day.
function toDb(t: Table, r: VRow) {
  const { id, at, up, ...data } = r;
  return { id, data, created_at: at, updated_at: up, ...(t === "research_notes" ? { kind: data.kind === "macro" ? "macro" : "note" } : {}), ...(t === "journal_entries" ? { day: typeof data.day === "string" ? data.day : null } : {}) };
}
function fromDb(x: { id: string; data: Record<string, unknown> | null; created_at: string; updated_at: string; kind?: string }): VRow {
  return { ...(x.data ?? {}), ...(x.kind ? { kind: x.kind } : {}), id: x.id, at: x.created_at, up: x.updated_at };
}

function load(t: Table): Promise<void> {
  if (cache.has(t)) return Promise.resolve();
  if (loading.has(t)) return loading.get(t)!;
  const p = (async () => {
    if (vaultMode() === "device") { cache.set(t, readDevice(t)); return; }
    try {
      const { data, error } = await createClient().from(t).select("*").order("updated_at", { ascending: false }).limit(MAX);
      if (error) failed.add(t); else failed.delete(t);
      cache.set(t, error ? [] : cleanRows(t, (data ?? []).map(fromDb)));
    } catch { failed.add(t); cache.set(t, []); }
  })().finally(() => { loading.delete(t); ping(t); });
  loading.set(t, p);
  return p;
}

async function persist(t: Table, rows: VRow[], changed: VRow | null, removed: string | null): Promise<boolean> {
  if (vaultMode() === "device") {
    try { localStorage.setItem(key(t), JSON.stringify(rows.slice(0, MAX))); return true; } catch { return false; }
  }
  try {
    const db = createClient().from(t);
    const { error } = removed ? await db.delete().eq("id", removed) : await db.upsert(toDb(t, changed!), { onConflict: "user_id,id" });
    return !error;
  } catch { return false; }
}

/** All rows of one table (newest first) and the ways to change them. */
export function useVault<T extends VRow = VRow>(t: Table) {
  const [, force] = useState(0);
  const [status, setStatus] = useState<VStatus>("idle");
  useEffect(() => {
    const f = () => force((n) => n + 1);
    if (!subs.has(t)) subs.set(t, new Set());
    subs.get(t)!.add(f);
    load(t);
    // another tab of the browser changed the device copy
    const onStore = (e: StorageEvent) => { if (vaultMode() === "device" && e.key === key(t)) { cache.delete(t); load(t); } };
    window.addEventListener("storage", onStore);
    return () => { subs.get(t)?.delete(f); window.removeEventListener("storage", onStore); };
  }, [t]);

  const put = useCallback((fields: Partial<T> & { id?: string }): T => {
    const now = new Date().toISOString();
    const list = cache.get(t) ?? [];
    const old = fields.id ? list.find((r) => r.id === fields.id) : undefined;
    const row = { ...(old ?? {}), ...fields, id: fields.id ?? newId(t.slice(0, 2)), at: old?.at ?? now, up: now } as T;
    const next = [row, ...list.filter((r) => r.id !== row.id)];
    cache.set(t, next); ping(t);
    setStatus("saving");
    persist(t, next, row, null).then((ok) => setStatus(ok ? "saved" : "error"));
    return row;
  }, [t]);

  const remove = useCallback((id: string) => {
    const next = (cache.get(t) ?? []).filter((r) => r.id !== id);
    cache.set(t, next); ping(t);
    setStatus("saving");
    persist(t, next, null, id).then((ok) => setStatus(ok ? "saved" : "error"));
  }, [t]);

  return { rows: (cache.get(t) ?? []) as T[], ready: cache.has(t), failed: failed.has(t), status, put, remove, mode: vaultMode() };
}

/** For tests and "Reset saved settings": forget the in-memory copies. */
export const _resetVault = () => { cache.clear(); loading.clear(); };
