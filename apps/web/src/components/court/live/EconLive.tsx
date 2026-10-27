"use client";

import { useEffect, useState } from "react";
import { getOnce } from "@/lib/court/once";
import type { EconEvent } from "@/lib/econ";

// Olli's economic calendar, next 7 days, Singapore time. US jobs, CPI, FOMC, GDP and PCE first.
export type EconRes = { items: EconEvent[]; ok: boolean; at: string; error?: string };
export const useEcon = () => {
  const [r, setR] = useState<EconRes | null>(null);
  useEffect(() => { getOnce<EconRes>("/api/econ?days=30").then((j) => setR(j.items ? j : { items: [], ok: false, at: "", error: "not reachable" })); }, []);
  return r;
};
export const sgtTime = (iso: string) => new Date(iso).toLocaleString("en-SG", { timeZone: "Asia/Singapore", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function EconLive() {
  const r = useEcon();
  const [all, setAll] = useState(false);
  const week = (r?.items ?? []).filter((e) => Date.parse(e.at) <= Date.now() + 7 * 86400e3);
  const top = week.filter((e) => e.top), rest = week.filter((e) => !e.top && e.impact === "High");
  const more = week.filter((e) => !e.top && e.impact !== "High");
  const Row = ({ e }: { e: EconEvent }) => (
    <div className="filed-row"><span className="note">{sgtTime(e.at)}</span><span>{e.top ? <b>{e.title}</b> : e.title} <span className="note">{e.country} · {e.impact}{e.forecast ? ` · forecast ${e.forecast}` : ""}{e.previous ? ` · previous ${e.previous}` : ""}{e.source === "Federal Reserve" ? " · Fed schedule" : ""}</span></span></div>
  );
  return (
    <section className="win" id="econWin" aria-labelledby="econT">
      <div className="win-title"><h2 id="econT">Economic calendar</h2><span className="sub">Olli · next 7 days</span></div>
      <div className="win-body">
        {!r ? <p className="note">Loading releases…</p> : <>
          {top.length > 0 && <><div className="sec-h">Jobs, CPI, FOMC, GDP, PCE</div>{top.map((e, i) => <Row e={e} key={"t" + i} />)}</>}
          {rest.length > 0 && <><div className="sec-h">Other high impact</div>{rest.slice(0, all ? 50 : 6).map((e, i) => <Row e={e} key={"h" + i} />)}</>}
          {all && more.length > 0 && <><div className="sec-h">Medium impact</div>{more.map((e, i) => <Row e={e} key={"m" + i} />)}</>}
          {!week.length && <p className="note">{r.ok ? "No high or medium impact releases in the next 7 days." : `Calendar not reachable (${r.error}).`}</p>}
          {(rest.length > 6 || more.length > 0) && <button className="btn sm ghost" type="button" onClick={() => setAll(!all)}>{all ? "Fewer" : "Show all"}</button>}
          <p className="note">Times in Singapore time. Source: an unofficial free calendar (forecast and previous only, no actuals); FOMC dates from the Federal Reserve. Check the official release before relying on it.</p>
        </>}
      </div>
    </section>
  );
}
