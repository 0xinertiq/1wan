"use client";

import { useState } from "react";
import { BriefFeedback } from "./BriefFeedback";
import { SourcesLine, type BriefDoc } from "./BriefTabs";
import { isNoMovers, reviewParts, todaysPlan, topFive } from "@/components/kumo/briefParse";

// Briefs on the New-look Court and their homes elsewhere. One canonical home per item: the full text of every
// brief lives in News; the scan's prices, technicals and Movers live in Trades. The Court shows summaries
// (Top 5, Today's plan, the review's summary) with links to those homes, and the same feedback actions.

export function BriefsBlock({ intel, scan }: { intel: BriefDoc | null; scan: BriefDoc | null }) {
  const [tab, setTab] = useState<"intel" | "scan">("intel");
  return (
    <section className="win kbriefs" aria-labelledby="kbT">
      <div className="win-title"><h2 id="kbT">Briefs</h2><span className="sub">tracking only, never advice</span></div>
      <div className="win-body">
        <div className="kseg" role="tablist" aria-label="Briefs">
          {(["intel", "scan"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "intel" ? "Intel" : "Scan"}</button>
          ))}
        </div>
        {tab === "intel" ? <IntelPane d={intel} /> : <ScanPane d={scan} />}
      </div>
    </section>
  );
}

function Head({ d }: { d: BriefDoc }) {
  return <p className="bhead"><b>{d.title}</b>{d.when && <span className="note"> · {d.when}</span>}</p>;
}

function IntelPane({ d }: { d: BriefDoc | null }) {
  if (!d) return <p className="note">No intelligence brief yet. The 07:42 brief lands here.</p>;
  const t = topFive(d.body ?? "");
  return (
    <div className="bpane">
      <Head d={d} />
      <div className="bcall">
        <p className="bcall-h">{t.fromSection ? "Top 5 headlines" : "From this brief"}</p>
        {t.items.length ? (
          <ol className="top5">
            {t.items.map((h, i) => (
              <li key={i}>
                <b>{h.title}</b>{h.why && <span> {h.why}</span>}
                {h.links.length > 0 && <span className="top5-src">{h.links.map((l, j) => <a key={j} href={l.url} target="_blank" rel="noopener noreferrer">{l.text}</a>)}</span>}
              </li>
            ))}
          </ol>
        ) : <p className="note">This brief has no headlines section.</p>}
        <a className="blink" href="#news">Read the full brief in News →</a>
      </div>
      <SourcesLine s={d.sources} />
      <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
    </div>
  );
}

function ScanPane({ d }: { d: BriefDoc | null }) {
  if (!d) return <p className="note">No scan yet. The 03:50 scan lands here.</p>;
  const p = todaysPlan(d.body ?? "");
  return (
    <div className="bpane">
      <Head d={d} />
      <div className="bcall">
        <p className="bcall-h">Today&apos;s plan</p>
        {p.readThrough && <p className="bread">{p.readThrough}</p>}
        {p.rows.length ? (
          <table className="plan">
            <thead><tr><th>Ticker</th><th>Grade</th><th>Entry</th><th>Stop</th><th>Target</th><th>R:R</th></tr></thead>
            <tbody>{p.rows.map((r, i) => <tr key={i}><td><b>{r.ticker}</b></td><td>{r.grade || "–"}</td><td>{r.entry}</td><td>{r.stop}</td><td>{r.target || "–"}</td><td>{r.rr || "–"}</td></tr>)}</tbody>
          </table>
        ) : <p className="note">{p.noTrade ? "No trade today." : "This scan has no trade-plan table."}</p>}
        <a className="blink" href="#trades">Open in Trades →</a>
      </div>
      <SourcesLine s={d.sources} />
      <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
    </div>
  );
}

// Chief Kumo's weekly review, compact for the Court rail.
export function ReviewCard({ d }: { d: BriefDoc | null }) {
  const [open, setOpen] = useState(false);
  const r = d ? reviewParts(d.body ?? "") : null;
  return (
    <section className="win kreview" aria-labelledby="krvT">
      <div className="win-title"><h2 id="krvT">Kumo&apos;s weekly review</h2>{d?.when && <span className="sub">{d.when.split(" (")[0]}</span>}</div>
      <div className="win-body">
        {!d || !r ? <p className="note">No weekly review yet. Kumo files it on Sunday at 08:50.</p> : <>
          {r.summary && <p className="rv-sum">{r.summary}</p>}
          {r.suggestions.length > 0 && <ul className="rv-sug">{r.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>}
          {open && <div className="brb open" dangerouslySetInnerHTML={{ __html: d.html }} />}
          <button className="btn sm ghost" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>
          <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
        </>}
      </div>
    </section>
  );
}

// Midday Movers for Trades: the latest real alert, or the desk's "no movers" note with the age of the last
// real alert.
export function MoversCard({ list }: { list: BriefDoc[] }) {
  const [open, setOpen] = useState(false);
  const latest = list[0] ?? null;
  const quiet = latest ? isNoMovers(latest.body ?? "") : false;
  const lastReal = list.find((d) => !isNoMovers(d.body ?? ""));
  const daysAgo = (iso: string) => Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 86400000));
  const checked = latest ? new Date(Date.parse(latest.at) + 8 * 3600000).toISOString().slice(11, 16) : "";
  return (
    <section className="win kmovers" aria-labelledby="kmvT">
      <div className="win-title"><h2 id="kmvT">Midday movers</h2><span className="sub">Fenn</span></div>
      <div className="win-body">
        {!latest ? <p className="note">No movers note yet. The 14:30 run lands here.</p>
          : quiet ? <p>No movers today (checked {checked}).</p>
          : <><Head d={latest} />{open ? <div className="brb open" dangerouslySetInnerHTML={{ __html: latest.html }} /> : latest.top.length > 0 && <ul className="rv-sug">{latest.top.map((t) => <li key={t}>{t}</li>)}</ul>}
            <button className="btn sm ghost" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read the alert"}</button></>}
        {lastReal && (quiet || lastReal !== latest) && <p className="note">Last real alert: {daysAgo(lastReal.at) === 0 ? "today" : `${daysAgo(lastReal.at)} day${daysAgo(lastReal.at) === 1 ? "" : "s"} ago`}.</p>}
        {latest && <BriefFeedback key={latest.key + latest.at} kind={latest.key} at={latest.at} initial={latest.vote} />}
        <p className="note xd">Tracking only. The crew never places trades or tells you what to buy.</p>
      </div>
    </section>
  );
}

// News: the full text of every brief and scan, by desk, with history by date. Readable layout; sections fold.
const DESKS: { key: string; label: string }[] = [
  { key: "intel", label: "Intelligence" }, { key: "scan", label: "Watchlist scan" }, { key: "movers", label: "Midday movers" },
  { key: "review", label: "Kumo's weekly review" }, { key: "pulse", label: "Pulse (older)" },
];
export function BriefsLibrary({ history }: { history: BriefDoc[] }) {
  const desks = DESKS.filter((k) => history.some((d) => d.key === k.key));
  const [desk, setDesk] = useState(desks[0]?.key ?? "intel");
  const [all, setAll] = useState(false);
  const list = history.filter((d) => d.key === desk).slice(0, 14);
  return (
    <section className="win klib" aria-labelledby="klibT">
      <div className="win-title"><h2 id="klibT">Briefs and scans</h2><span className="sub">full text, newest first</span></div>
      <div className="win-body">
        {!desks.length ? <p className="note">Nothing filed yet.</p> : <>
          <div className="kseg" role="tablist" aria-label="Desks">
            {desks.map((k) => <button key={k.key} type="button" role="tab" aria-selected={desk === k.key} className={desk === k.key ? "on" : ""} onClick={() => setDesk(k.key)}>{k.label}</button>)}
          </div>
          <button className="btn sm ghost klib-all" type="button" onClick={() => setAll(!all)}>{all ? "Collapse all" : "Expand all"}</button>
          {list.map((d, i) => (
            <details key={d.at + all} className="klib-item" open={all || i === 0}>
              <summary><b>{d.title}</b> <span className="note">{d.when.split(" (")[0]}</span></summary>
              <article className="read" dangerouslySetInnerHTML={{ __html: d.html }} />
              <SourcesLine s={d.sources} />
              {i === 0 && <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />}
            </details>
          ))}
        </>}
      </div>
    </section>
  );
}
