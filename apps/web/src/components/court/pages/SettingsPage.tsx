"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { BirthForm, LookSwitch, NewsLens, NewsSettings, SourceHealth } from "../live/SettingsLive";
import { PacketLive } from "../live/PacketLive";
import { createClient } from "@/lib/supabase/client";
import { resetDevice } from "@/lib/court/store";
import { TABLES, VAULT_LABEL, vaultMode } from "@/lib/vault";
import { LENS_IDS } from "@/lib/court/state";
import { LENS_LABEL, toggleLens } from "@/lib/court/lenses";
import { INTERESTS } from "./Welcome";
import { Btn, Callout, Card, Chip, EmptyState, PageHead } from "../ui";

// Settings (round 8): two even columns. Left: look, market lens (several at once), rooms, connections, news and
// Telegram, account. Right: Kumo's weekly review with the packet (one card; the packet's own preview, sensitive-section
// switches and endpoint are unchanged), your data, usage and Luna's birth details. No place to paste
// keys or passwords: keys live in apps/web/.env.local and in Vercel. The Notifications card is retired (alert
// pop-ups on the agents replace it); her stored notification choices stay in her prefs, untouched.

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

export function SettingsPage({ review }: { review?: React.ReactNode }) {
  const { st, update, cal } = useCourt();
  const setPrefs = (fn: (p: typeof st.prefs) => void) => update((d) => { const p = { ...d.prefs }; fn(p); d.prefs = p; }, ["prefs"]);
  const mode = vaultMode();
  return (
    <div className="kpage">
      <PageHead scene="castle" title="Settings" sub="Look, lenses, connections, Kumo's weekly review and your data. Private to you." />
      <div className="kpg two even">
        <div className="kcol">
          <Card title="Look">
            {/* round 8: label left, buttons in a row, on one shared grid */}
            <div className="klook">
              <span className="klook-l">Version</span><LookSwitch bare />
              <span className="klook-l">Day or night</span><Theme />
            </div>
          </Card>
          <Card title="Market lens" sub="choose as many as you like">
            <div className="kchips" role="group" aria-label="News lenses">
              {LENS_IDS.map((id) => <button key={id} type="button" className="chipb" aria-pressed={st.lenses.includes(id)} onClick={() => update((d) => { d.lenses = toggleLens(d.lenses, id); }, ["lenses"])}>{LENS_LABEL[id]}</button>)}
            </div>
            <p className="note">Headlines and briefs on the News tab follow these. Any topic shows everything; Off hides them.</p>
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
          <Card title="Account">
            <Callout tone="lav">1(WAN) is invite-only. It never asks anyone for API keys or passwords; keys live in the server settings. It tracks and never advises.</Callout>
            <div className="kbtn-row">
              <a className="btn sm ghost" href="#kingdom">Kingdom Mode</a>
              <a className="btn sm ghost" href="/progress">Progress</a>
              <a className="btn sm ghost" href="#welcome">Replay the tour</a>
            </div>
            <form action="/auth/signout" method="post" className="kbtn-row"><button className="btn ghost" type="submit">Sign out</button></form>
          </Card>
        </div>
        <div className="kcol">
          <Card title="Kumo's weekly review" sub="the review, then the packet" id="review-card">
            {review}
            <div className="sec-h">The weekly packet</div>
            <details><summary className="btn sm ghost">Open the packet</summary><PacketLive /></details>
          </Card>
          <Card title="Your data" sub="private to you">
            <p className="note">Everything here is yours. Export my data includes your journal, trade log, research notes, goals, tasks, routines and finance entries once they are saved to your account.</p>
            <div className="kbtn-row">
              <a className="btn" href="/api/export">Export my data</a>
              {mode === "device" && <Btn kind="ghost" onClick={downloadDevice}>Download this device&apos;s preview records</Btn>}
            </div>
            <p className="kstore dev">{VAULT_LABEL[mode]}{mode === "device" ? ": journal pages, notes, goals, tasks, routines and budgets are kept in this browser until the new tables are switched on." : "."}</p>
            <div className="kbtn-row"><Btn kind="sm ghost" onClick={() => { if (window.confirm("Reset look, folds, seen items and other saved settings on this device? Your data on the server and your preview records stay.")) { resetDevice(); window.location.reload(); } }}>Reset saved settings on this device</Btn></div>
          </Card>
          <Card title="Usage and tokens"><Usage /></Card>
          <Card title="Luna's birth details" sub="private"><BirthForm /></Card>
        </div>
      </div>
    </div>
  );
}
