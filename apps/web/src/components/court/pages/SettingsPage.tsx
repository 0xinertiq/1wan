"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { BirthForm, LookSwitch, NewsLens, NewsSettings, SourceHealth } from "../live/SettingsLive";
import { createClient } from "@/lib/supabase/client";
import { resetDevice } from "@/lib/court/store";
import { TABLES, VAULT_LABEL, vaultMode } from "@/lib/vault";
import type { Lens } from "@/lib/court/state";
import { INTERESTS } from "./Welcome";
import { Btn, Callout, Card, Chip, EmptyState, PageHead, SectionLabel } from "../ui";

// Settings (round 6): sections in a grid, never one long column. No place to paste keys or passwords: keys live in
// apps/web/.env.local and in Vercel. Friends join by invite only.

export const NOTIF = [
  ["morning", "One calm morning summary", true], ["briefs", "New briefs", false], ["review", "Kumo's weekly review", false],
  ["liquidity", "Big releases within 48 hours", false], ["routines", "Routines and tasks due", false], ["habits", "Habit reminders", false],
] as const;
export const notifOn = (pref: Record<string, boolean> | undefined, id: string) => pref?.[id] ?? NOTIF.find((n) => n[0] === id)?.[2] ?? false;

function Theme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);
  const pick = (d: boolean) => { const t = d ? "dark" : "light"; document.documentElement.setAttribute("data-theme", t); try { localStorage.setItem("kumo.theme", t); } catch {} setDark(d); };
  return (
    <div className="kchips" role="group" aria-label="Day or night">
      <button type="button" className="chipb" aria-pressed={!dark} onClick={() => pick(false)}>Day</button>
      <button type="button" className="chipb" aria-pressed={dark} onClick={() => pick(true)}>Night</button>
    </div>
  );
}

function Usage() {
  const [rows, setRows] = useState<{ feature: string; input_tokens: number; output_tokens: number; at: string }[] | null>(null);
  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86400e3).toISOString();
    (async () => {
      try { const { data, error } = await createClient().from("usage").select("feature, input_tokens, output_tokens, at").gte("at", since).limit(2000); setRows(error ? [] : data ?? []); } catch { setRows([]); }
    })();
  }, []);
  if (!rows) return <EmptyState kind="loading" who="kumo">Reading your usage…</EmptyState>;
  if (!rows.length) return <EmptyState who="kumo">No AI usage in the last 30 days.</EmptyState>;
  const by = new Map<string, { n: number; tok: number }>();
  for (const r of rows) { const x = by.get(r.feature) ?? { n: 0, tok: 0 }; x.n++; x.tok += (r.input_tokens ?? 0) + (r.output_tokens ?? 0); by.set(r.feature, x); }
  return <>{[...by.entries()].map(([f, x]) => <div className="krow" key={f}><span className="krow-main">{f}</span><span className="note">{x.n} run{x.n === 1 ? "" : "s"} · {x.tok.toLocaleString("en-SG")} tokens</span></div>)}<p className="note">Last 30 days, from the usage table.</p></>;
}

/** Download the records kept on this device in preview storage (journal, notes, goals…), as one JSON file. */
function downloadDevice() {
  const out: Record<string, unknown> = { app: "1wan", kind: "preview storage, this device only", exportedAt: new Date().toISOString() };
  for (const t of TABLES) { try { out[t] = JSON.parse(localStorage.getItem("1wanvault.v1." + t) ?? "[]"); } catch { out[t] = []; } }
  const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "1wan-device-records.json"; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsPage() {
  const { st, update, cal } = useCourt();
  const lens: Lens = st.prefs.lens ?? "trading";
  const setPrefs = (fn: (p: typeof st.prefs) => void) => update((d) => { const p = { ...d.prefs }; fn(p); d.prefs = p; }, ["prefs"]);
  const mode = vaultMode();
  return (
    <div className="kpage">
      <PageHead scene="castle" title="Settings" sub="Look, lens, connections, your data and notifications. Private to you." actions={<a className="btn sm ghost" href="#welcome">Replay the tour</a>} />
      <div className="kpg two">
        <div className="kcol">
          <Card title="Look"><LookSwitch /><SectionLabel>Day or night</SectionLabel><Theme /></Card>
          <Card title="Market lens" sub="what the markets parts of the app follow">
            <div className="kchips" role="group" aria-label="Market lens">
              {([["trading", "Trading"], ["local", "Local news"], ["any", "Any topic"], ["off", "Off"]] as const).map(([v, l]) => <button key={v} type="button" className="chipb" aria-pressed={lens === v} onClick={() => setPrefs((p) => { p.lens = v; })}>{l}</button>)}
            </div>
            <p className="note">Off hides the Saved and research strip in News. Trading is the default.</p>
          </Card>
          <Card title="Rooms" sub="what the kingdom helps with">
            <div className="kgrid-opts">{INTERESTS.map(([id, l]) => <label className="kcheck" key={id}><input type="checkbox" checked={st.prefs.rooms?.[id] !== false} onChange={(e) => setPrefs((p) => { p.rooms = { ...(p.rooms ?? {}), [id]: e.target.checked }; })} />{l}</label>)}</div>
            <p className="note">Switching a room off hides its tab (Garden, Dungeon, Trades and News); nothing is deleted.</p>
          </Card>
          <Card title="Connections" sub="read-only">
            <div className="krow"><span className="krow-main"><b>Google Calendar</b><br /><span className="note">One private calendar link, read-only. Nothing is ever written to Google.</span></span><Chip tone={cal.state === "live" ? "mint" : "peach"}>{cal.state === "live" ? "connected" : cal.state === "loading" ? "checking" : cal.state === "off" ? "not connected" : "not reachable"}</Chip></div>
            {cal.cals.length > 0 && <p className="note">{cal.cals.map((c) => c.name + (c.ok ? "" : " (not reachable)")).join(" · ")}</p>}
            <p className="note">More providers can join this list later. The calendar link is set by the owner in the server settings, not here.</p>
          </Card>
          <Card title="News and Telegram"><NewsSettings /><NewsLens /><SourceHealth /></Card>
        </div>
        <div className="kcol">
          <Card title="Your data" sub="private to you">
            <p className="note">Everything here is yours. Export my data includes your journal, trade log, research notes, goals, tasks, routines and finance entries once they are saved to your account.</p>
            <div className="kform-row"><a className="btn" href="/api/export">Export my data</a>{mode === "device" && <Btn kind="ghost" onClick={downloadDevice}>Download this device&apos;s preview records</Btn>}</div>
            <p className="kstore dev">{VAULT_LABEL[mode]}{mode === "device" ? ": journal pages, notes, goals, tasks, routines and budgets are kept in this browser until the new tables are switched on." : "."}</p>
            <Btn kind="sm ghost" onClick={() => { if (window.confirm("Reset look, folds, seen items and other saved settings on this device? Your data on the server and your preview records stay.")) { resetDevice(); window.location.reload(); } }}>Reset saved settings on this device</Btn>
          </Card>
          <Card title="Notifications" sub="quiet by default">
            {NOTIF.map(([id, label]) => <label className="kcheck" key={id}><input type="checkbox" checked={notifOn(st.prefs.notif, id)} onChange={(e) => setPrefs((p) => { p.notif = { ...(p.notif ?? {}), [id]: e.target.checked }; })} />{label}</label>)}
            <p className="note">These shape the bell and the inbox. No push notifications are sent.</p>
          </Card>
          <Card title="Usage and tokens"><Usage /></Card>
          <Card title="Luna's birth details" sub="private"><BirthForm /></Card>
          <Card title="Account">
            <Callout tone="lav">1(WAN) is invite-only. It never asks anyone for API keys or passwords; keys live in the server settings. It tracks and never advises.</Callout>
            <div className="kform-row"><a className="btn sm ghost" href="#kingdom">Kingdom Mode</a><a className="btn sm ghost" href="/progress">Progress</a></div>
            <form action="/auth/signout" method="post"><button className="btn ghost" type="submit">Sign out</button></form>
          </Card>
        </div>
      </div>
    </div>
  );
}
