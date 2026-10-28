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

const isRows = (v: unknown): v is VRow[] => Array.isArray(v) && v.every((r) => r && typeof r === "object" && typeof (r as VRow).id === "string");
// Not under the settings prefix on purpose: "Reset saved settings on this device" must never delete records.
const key = (t: Table) => "1wanvault.v1." + t;
function readDevice(t: Table): VRow[] {
  try { const v: unknown = JSON.parse(localStorage.getItem(key(t)) ?? "[]"); return isRows(v) ? v : []; } catch { return []; }
}
const MAX = 2000;
export const newId = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

// In-memory copy per table, shared by every card on the page; listeners re-render when a table changes.
const cache = new Map<Table, VRow[]>();
const subs = new Map<Table, Set<() => void>>();
const loading = new Map<Table, Promise<void>>();
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
      cache.set(t, error ? [] : (data ?? []).map(fromDb));
    } catch { cache.set(t, []); }
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

  return { rows: (cache.get(t) ?? []) as T[], ready: cache.has(t), status, put, remove, mode: vaultMode() };
}

/** For tests and "Reset saved settings": forget the in-memory copies. */
export const _resetVault = () => { cache.clear(); loading.clear(); };
