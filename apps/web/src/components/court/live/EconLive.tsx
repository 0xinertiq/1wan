"use client";

import { useEffect, useState } from "react";
import { getOnce } from "@/lib/court/once";
import type { EconEvent } from "@/lib/econ";
import { liquidityList, nextLiquidity } from "@/lib/liquidity";
import { dayStamp, inText } from "@/lib/court/time";

// Olli's economic calendar, Singapore time: the canonical home of releases. By default the liquidity whitelist
// (lib/liquidity.ts), with an "All releases" toggle. The Court shows only the one "Next:" line.
export type EconRes = { items: EconEvent[]; ok: boolean; at: string; error?: string };
export const useEcon = () => {
  const [r, setR] = useState<EconRes | null>(null);
  useEffect(() => { getOnce<EconRes>("/api/econ?days=30").then((j) => setR(j.items ? j : { items: [], ok: false, at: "", error: "not reachable" })); }, []);
  return r;
};
export const sgtTime = (iso: string) => dayStamp(iso);

export function EconLive() {
  const r = useEcon();
  const [all, setAll] = useState(false);
  const now = Date.now(), from = now - 3 * 3600e3, to = now + 7 * 86400e3;
  const liq = liquidityList(r?.items ?? [], from, to);
  const rest = (r?.items ?? []).filter((e) => Date.parse(e.at) >= from && Date.parse(e.at) <= to && (e.impact === "High" || e.impact === "Medium"));
  const Row = ({ e }: { e: EconEvent }) => (
    <div className="filed-row"><time className="ts">{sgtTime(e.at)}</time><span>{e.title} <span className="note">{e.country} · {e.impact}{e.forecast ? ` · forecast ${e.forecast}` : ""}{e.previous ? ` · previous ${e.previous}` : ""}{e.source === "Federal Reserve" ? " · Fed schedule" : ""}</span></span></div>
  );
  return (
    <section className="win" id="econWin" aria-labelledby="econT">
      <div className="win-title"><h2 id="econT">Economic calendar</h2><span className="sub">Olli · next 7 days</span></div>
      <div className="win-body">
        {!r ? <p className="note">Loading releases…</p> : <>
          <div className="kseg" role="tablist" aria-label="Releases">
            <button type="button" role="tab" aria-selected={!all} className={!all ? "on" : ""} onClick={() => setAll(false)}>Moves liquidity</button>
            <button type="button" role="tab" aria-selected={all} className={all ? "on" : ""} onClick={() => setAll(true)}>All releases</button>
          </div>
          {!all
            ? liq.length ? liq.map((x) => (
              <div className="filed-row" key={x.at + x.name}><time className="ts">{dayStamp(x.at)}</time><span><b>{x.name}</b> <span className="note">{inText(x.at)}{x.titles.length > 1 ? ` · ${x.titles.join(", ")}` : ""}</span></span></div>
            )) : <p className="note">{r.ok ? "No liquidity releases in the next 7 days." : `Calendar not reachable (${r.error}).`}</p>
            : rest.length ? rest.map((e, i) => <Row e={e} key={i} />) : <p className="note">No high or medium impact releases in the next 7 days.</p>}
          <p className="note">Moves liquidity: FOMC decision, statement, press conference and minutes; US jobs, CPI, PPI, PCE and GDP; ECB, BoJ and BoE decisions; Treasury refunding; high impact only. Times in Singapore time. Source: an unofficial free calendar (forecast and previous only) plus the Federal Reserve&apos;s FOMC dates.</p>
        </>}
      </div>
    </section>
  );
}

// The one slim line on the Court under the prices: the next liquidity release within 48 hours, else nothing.
export function NextLiquidityLine() {
  const r = useEcon();
  const n = r ? nextLiquidity(r.items) : null;
  if (!n) return null;
  return <p className="knext"><b>Next:</b> {n.name} <time className="ts">{dayStamp(n.at)}</time> · {inText(n.at)}</p>;
}
