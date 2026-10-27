"use client";

import { useEffect, useMemo, useState } from "react";
import { useCourt } from "../CourtState";
import { PACKET_DEFAULT, PACKET_LABELS, buildPacket, type PacketOpts } from "@/lib/court/packet";
import { weekKey } from "@/lib/court/time";
import { getOnce } from "@/lib/court/once";
import { skyEvents } from "@/lib/sky";
import type { WaterEvt } from "@/lib/court/garden";
import kumoPrompt from "../../../../../../crew/kumo.md";

// Kumo weekly review (step 14): preview exactly what would be sent, choose sensitive sections (all off by
// default), then "Copy for Claude" puts the prompt and packet on the clipboard and opens claude.ai.
type Row = Record<string, unknown>;

export function PacketLive() {
  const { st, k, events, update } = useCourt();
  const opts: PacketOpts = { ...PACKET_DEFAULT, ...st.packet };
  const wk = weekKey(k);
  const [ledger, setLedger] = useState<{ trades: Row[]; plans: Row[] } | null>(null);
  const [water, setWater] = useState<WaterEvt[] | null>(null);
  const [spend, setSpend] = useState<{ at: string; amount: number; category: string }[] | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    getOnce<{ trades?: Row[]; plans?: Row[] }>("/api/ledger").then((j) => setLedger({ trades: j.trades ?? [], plans: j.plans ?? [] }));
    getOnce<{ events?: WaterEvt[] }>("/api/water?days=30").then((j) => setWater(j.events ?? []));
    fetch("/api/spending?from=" + wk).then((r) => r.json()).then((j) => setSpend(j.lines ?? [])).catch(() => setSpend([]));
  }, [wk]);
  const sky = useMemo(() => skyEvents(new Date(wk + "T00:00:00+08:00"), 14), [wk]);
  const ready = ledger && water && spend;
  const text = ready ? buildPacket({ st, k, events, trades: ledger.trades, plans: ledger.plans, water, spending: spend, sky, opts }) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(kumoPrompt.trim() + "\n\n---\n\n" + text);
      window.open("https://claude.ai/new", "_blank", "noopener");
      setMsg("Copied. In the Claude tab, paste (Ctrl+V) and send.");
    } catch { setMsg("Could not copy here. Select the text below and copy it by hand."); }
  }

  return (
    <div className="detail packet">
      <b id="sheetT">Kumo&apos;s weekly review</b>
      <p className="note">Built from your own records for this week. Nothing leaves the app until you copy it. Turn on only what you want Kumo to see.</p>
      {(Object.keys(PACKET_LABELS) as (keyof PacketOpts)[]).map((key) => (
        <label className="filed-row" key={key}><input type="checkbox" checked={opts[key]} onChange={(e) => update((d) => { d.packet = { ...PACKET_DEFAULT, ...d.packet, [key]: e.target.checked }; }, ["packet"])} /> <span>{PACKET_LABELS[key]} <span className="note">{opts[key] ? "included" : "off"}</span></span></label>
      ))}
      <div className="rep-act"><button className="btn" type="button" disabled={!ready} onClick={copy}>Copy for Claude</button></div>
      {msg && <p className="note" role="status">{msg}</p>}
      <div className="sec-h">Preview: exactly what will be sent</div>
      {ready ? <pre className="pkt">{text}</pre> : <p className="note">Gathering this week…</p>}
      <details><summary className="note">Kumo&apos;s review instructions (crew spec v1)</summary><pre className="pkt">{kumoPrompt.trim()}</pre></details>
    </div>
  );
}
