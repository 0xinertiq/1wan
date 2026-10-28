"use client";

import { useState } from "react";
import { BriefFeedback } from "./BriefFeedback";
import { SourcesLine, type BriefDoc } from "./BriefTabs";
import { briefSections, isNoMovers, reviewParts, scanCourt, type Headline } from "@/components/kumo/briefParse";
import { mdLite } from "./mdLite";
import { useReview } from "@/components/kumo/reviewRead";

// One uniform brief item, used by the Top 5 and by every block of a brief in News: bold numbered headline,
// the why, then one small "Sources: A · B" line (never also as a text tail).
function Items({ items }: { items: Headline[] }) {
  return (
    <ol className="bitems">
      {items.map((h, i) => (
        <li key={i}>
          {h.topic && <span className="bitem-topic">{h.topic}</span>}
          {h.title && <b className="bitem-t">{h.title}</b>}
          {h.why && <span className="bitem-w">{h.why}</span>}
          {h.links.length > 0 && <span className="brsrc-line">Sources: {h.links.map((l, j) => <span key={j}>{j > 0 && " · "}<a href={l.url} target="_blank" rel="noopener noreferrer">{l.text}</a></span>)}</span>}
        </li>
      ))}
    </ol>
  );
}

// The Briefs card on the New-look Court, in the old dashboard's full brief style: three pill tabs (Pulse |
// Intelligence | Crypto scan), each with its title, date and age, the summary as a soft pink callout, then the
// whole stored brief (uppercase section labels, dashed dividers, bold-lead items, tables, a small Sources line;
// the Intelligence Top 5 as a numbered list). Show more / Show less, then Useful / Needs work, the one-line
// change box and "What this desk has learned" (her agent memory, read-only). Midday movers live in Trades.
export type DeskMem = { lessons?: string[]; sourceNotes?: string[]; selfCheck?: string; stats?: { n?: number; up?: number; down?: number } };
const TABS = [{ key: "pulse", label: "Pulse" }, { key: "intel", label: "Intelligence" }, { key: "scan", label: "Crypto scan" }] as const;

export function BriefsBlock({ docs, mem }: { docs: Partial<Record<"pulse" | "intel" | "scan", BriefDoc | null>>; mem: Record<string, DeskMem> }) {
  const first = (["intel", "scan", "pulse"] as const).find((k) => docs[k]) ?? "intel";
  const [tab, setTab] = useState<"pulse" | "intel" | "scan">(first);
  const d = docs[tab] ?? null;
  return (
    <section className="win kbriefs" aria-labelledby="kbT">
      <div className="win-title"><h2 id="kbT">Briefs</h2><span className="sub">Your scheduled tasks</span></div>
      <div className="win-body">
        <div className="kseg pills" role="tablist" aria-label="Briefs">
          {TABS.map((t) => <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>
        {d ? <BriefPane key={d.key + d.at} d={d} mem={mem[tab]} /> : <p className="note">{tab === "scan" ? "No scan yet. The 03:50 scan lands here." : tab === "pulse" ? "No Pulse brief yet. It lands at 07:27." : "No intelligence brief yet. The 07:52 brief lands here."}</p>}
      </div>
    </section>
  );
}

function Head({ d }: { d: BriefDoc }) {
  return <p className="bhead"><b>{d.title}</b>{d.when && <span className="note"> · {d.when}</span>}</p>;
}

const hmSgt = (iso: string) => new Date(Date.parse(iso) + 8 * 3600e3).toISOString().slice(11, 16);

function BriefPane({ d, mem }: { d: BriefDoc; mem?: DeskMem }) {
  const [open, setOpen] = useState(false);
  // The Crypto scan shows only the read-through and Movers here, plus the three strongest coins; the full scan
  // (style map, trade plan, catalysts, gaps) stays in News.
  const scan = d.key === "scan" ? scanCourt(d.body ?? "") : null;
  const html = mdLite(scan ? scan.md : d.body ?? "", { srcLine: true, numberTop5: true });
  return (
    <div className="bpane">
      <Head d={d} />
      {scan && <p className="bsnap"><span>Snapshot · Scan {hmSgt(d.at)} SGT</span><a href="#trades">Open in Trades →</a></p>}
      {scan && scan.strongest.length > 0 && <p className="bstrong"><b>Strongest now:</b> {scan.strongest.map((x) => `${x.ticker} ${x.score} (${x.bucket})`).join(" · ")}</p>}
      <div className={"brb kbrb" + (open ? " open" : "")} dangerouslySetInnerHTML={{ __html: html }} />
      <button className="btn sm ghost" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Show more"}</button>
      <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
      <DeskLearned m={mem} />
    </div>
  );
}

function DeskLearned({ m }: { m?: DeskMem }) {
  const ls = (m?.lessons ?? []).slice(0, 8), sn = (m?.sourceNotes ?? []).slice(0, 5), st = m?.stats;
  if (!m || (!ls.length && !sn.length && !m.selfCheck && !st?.n)) return null;
  return (
    <details className="brmem">
      <summary>What this desk has learned</summary>
      {ls.length > 0 && <><p className="note">Your standing preferences</p><ul>{ls.map((x) => <li key={x}>{String(x).slice(0, 220)}</li>)}</ul></>}
      {sn.length > 0 && <><p className="note">Source notes</p><ul>{sn.map((x) => <li key={x}>{String(x).slice(0, 220)}</li>)}</ul></>}
      {m.selfCheck && <p className="note">Last run self-check: {String(m.selfCheck).slice(0, 260)}</p>}
      {st?.n ? <p className="note">Ratings: {st.up ?? 0} useful, {st.down ?? 0} needs work</p> : null}
    </details>
  );
}

// Chief Kumo's weekly review on the Court: only while unread ("New weekly review", Mark as read). Once read it
// lives in News (Kumo reviews). The summary shows once, then the per-desk lines and suggestions; Show more
// reveals the rest of them. Read state is per device (components/kumo/reviewRead.ts).
export function ReviewCard({ d }: { d: BriefDoc | null }) {
  const [open, setOpen] = useState(false);
  const { ready, unread, markRead } = useReview(d?.at ?? null);
  if (!d || !ready || !unread) return null;
  const r = reviewParts(d.body ?? "");
  const lines = [...r.desks, ...r.suggestions], shown = open ? lines : lines.slice(0, 3);
  return (
    <section className="win kreview" aria-labelledby="krvT">
      <div className="win-title"><h2 id="krvT">New weekly review</h2>{d.when && <span className="sub">{d.when.split(" (")[0]}</span>}</div>
      <div className="win-body">
        {r.summary && <p className="rv-sum">{r.summary}</p>}
        {shown.length > 0 && <ul className="rv-sug">{shown.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        <div className="rep-act">
          {lines.length > 3 && <button className="btn sm ghost" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Show more"}</button>}
          <button className="btn sm" type="button" onClick={() => markRead(d.at)}>Mark as read</button>
        </div>
        <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
      </div>
    </section>
  );
}

// "Mark as read" beside the newest review in News, while it is unread.
function ReviewRead({ at }: { at: string }) {
  const { unread, markRead } = useReview(null);
  return unread ? <button className="btn sm" type="button" onClick={() => markRead(at)}>Mark as read</button> : null;
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

// A brief written as bold-lead items (Intel and similar) reads as sections of uniform items, like the Top 5;
// anything else (scans with tables, older formats) shows its rendered text.
function BriefBody({ d }: { d: BriefDoc }) {
  const b = briefSections(d.body ?? "");
  if (!b.structured) return <article className="read" dangerouslySetInnerHTML={{ __html: d.html }} />;
  return (
    <article className="read">
      {b.intro && <p>{b.intro}</p>}
      {b.sections.map((s) => <section key={s.title}><h3>{s.title}</h3><Items items={s.items} /></section>)}
    </article>
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
              <BriefBody d={d} />
              <SourcesLine s={d.sources} />
              {i === 0 && d.key === "review" && <ReviewRead at={d.at} />}
              {i === 0 && <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />}
            </details>
          ))}
        </>}
      </div>
    </section>
  );
}
