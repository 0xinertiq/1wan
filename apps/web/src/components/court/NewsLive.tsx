"use client";

import { useEffect, useState } from "react";
import { ageText } from "@/lib/court/time";
import { COINGECKO_IDS } from "@/lib/prices";
import { NEWS_GROUPS, REGIONS } from "@/lib/newsFeeds";
import { headlineShown } from "@/lib/court/lenses";
import { cluster } from "@/lib/cluster";
import { briefing } from "@/lib/court/briefing";
import { useCourt } from "./CourtState";
import { useEcon } from "./live/EconLive";
import type { NewsResult } from "@/lib/news";

// Headlines window (v52 newsWin) from free RSS feeds. Works without Bigdata.

const ago = (iso: string | null) => (iso ? ageText(iso) : "");

type Tg = { items: { channel: string; title: string; at: string | null; text: string; link: string }[]; health: { handle: string; ok: boolean }[]; at: string };

// A story's topic comes from what it is about, not only from the feed it came through: a crypto headline on a
// general markets or world feed ("Crypto Markets Muted As FOMC Starts") files under Crypto; central-bank and
// inflation news on a world feed files under Macro.
const CRYPTO = /\b(crypto|bitcoin|btc|ether(?:eum)?|eth|stablecoins?|solana|xrp|defi|altcoins?|memecoins?|coinbase|binance|blockchain|tokens?)\b/i;
const MACRO = /\b(fed|fomc|federal reserve|cpi|inflation|interest rates?|rate (?:cut|hike|decision)|central bank|ecb|boj|bank of japan|bank of england|payrolls|treasur(?:y|ies)|bond yields?)\b/i;
// Round 7: technology stories on a world or markets feed file under Tech (a lens she can follow).
const TECH = /\b(ai|artificial intelligence|openai|anthropic|nvidia|chips?|chipmakers?|semiconductors?|apple|alphabet|google|microsoft|amazon|meta|tesla|start-?ups?|venture capital|software|smartphones?)\b/i;
export function topicOf(title: string, group: string, tech = false): string {
  if (CRYPTO.test(title)) return "Crypto";
  if (group === "World" && MACRO.test(title)) return "Macro";
  if (tech && (group === "World" || group === "Markets") && TECH.test(title)) return "Tech";
  return group;
}

// Stories that share most of their words with one of today's Top 5 headlines get a small tag.
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(" ").filter((w) => w.length > 3));
function inTop5(title: string, top5: string[]) {
  const a = words(title);
  return top5.some((t) => { const b = words(t); let n = 0; for (const w of b) if (a.has(w)) n++; return b.size > 0 && n >= Math.min(3, b.size); });
}

// follow: on the News tab the headlines follow her lenses (Settings); elsewhere every topic shows.
export function NewsLive({ top5 = [], follow = false }: { top5?: string[]; follow?: boolean }) {
  const [data, setData] = useState<NewsResult | null>(null);
  const [tg, setTg] = useState<Tg | null>(null);
  const [why, setWhy] = useState("");
  const { st, prices } = useCourt();
  const econ = useEcon();
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState("All");
  const [more, setMore] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/news");
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (alive) { setData(j); setFailed(false); }
      } catch { if (alive) setFailed(true); }
    }
    async function loadTg() {
      try { const j = await (await fetch("/api/telegram")).json(); if (alive && Array.isArray(j.items)) setTg(j); } catch {}
    }
    load(); loadTg();
    const t = window.setInterval(() => { load(); loadTg(); }, 5 * 60 * 1000);
    const focus = () => { if (document.visibilityState === "visible") { load(); loadTg(); } };
    document.addEventListener("visibilitychange", focus);
    return () => { alive = false; window.clearInterval(t); document.removeEventListener("visibilitychange", focus); };
  }, []);

  const tgItems = (tg?.items ?? []).map((m) => ({ title: m.text.split(String.fromCharCode(10))[0].slice(0, 220), source: m.title + " (Telegram)", group: "Telegram", region: "Global", tier: "social" as const, at: m.at, link: m.link }));
  const regions = st.news.regions.length ? st.news.regions : REGIONS;
  const rss = (data?.items ?? []).filter((h) => regions.includes(h.region)).map((h) => ({ ...h, group: topicOf(h.title, h.group, follow) }));
  const watch = (prices?.prices ?? []).flatMap((p) => [p.sym, (COINGECKO_IDS[p.sym] ?? "").split("-")[0]]).filter(Boolean);
  const clusters = cluster([...rss, ...tgItems], { watch, releases: (econ?.items ?? []).filter((e) => e.top).map((e) => e.title) });
  const seen = (c: (typeof clusters)[number]) => !follow || headlineShown(c.lead.group ?? "", st.lenses) || (!st.lenses.includes("off") && c.items.some((x) => x.group === "Telegram"));
  const items = clusters.filter(seen);
  const groups = [...NEWS_GROUPS, ...(follow ? ["Tech"] : [])].filter((g) => !follow || headlineShown(g, st.lenses));
  const lensOff = follow && st.lenses.includes("off");
  // A Telegram post that clustered with a news story still shows under the Telegram chip (never lost to topic filing).
  const list = tab === "All" ? items : tab === "Telegram" ? items.filter((c) => c.items.some((x) => x.group === "Telegram")) : items.filter((c) => c.lead.group === tab);
  const shown = list.slice(0, more ? 40 : 8);
  const down = (Array.isArray(data?.feeds) ? data.feeds : []).filter((f) => f && !f.ok).map((f) => f.name);

  // round 8: on the News tab, Today's briefing (rules only) sits above the headlines
  const brief = follow && data && !lensOff ? briefing(clusters, st.lenses) : null;
  return (
    <>
    {brief && (
      <section className="win kcard" id="briefingWin" aria-labelledby="bfT">
        <div className="win-title"><h2 id="bfT">Today&apos;s briefing</h2><span className="sub">Pip · by rules, from the headlines</span></div>
        <div className="win-body">
          {!brief.stories.length ? <p className="note">No stories in your lenses right now.</p> : (
            <ol className="kbrief">
              {brief.stories.map((x) => (
                <li key={x.link}>
                  <a href={x.link} target="_blank" rel="noopener noreferrer">{x.title}</a>
                  <span className="note">{x.source}{x.at ? " · " + ago(x.at) : ""}{x.also.length ? ` · also reported by ${x.also.slice(0, 3).join(", ")}${x.also.length > 3 ? ` and ${x.also.length - 3} more` : ""}` : ""}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="note">{brief.stories.length} {brief.stories.length === 1 ? "story" : "stories"} from {brief.headlines} headlines, ranked by score. Not advice.</p>
        </div>
      </section>
    )}
    <section className="win" id="newsWin" aria-labelledby="nwT">
      <div className="win-title"><h2 id="nwT">Headlines</h2><span className="sub">Pip {items.length > 0 && <span className="badge" id="newsCount">{items.length}</span>}</span></div>
      <div className="win-body">
        <div id="newsBox">
          {!data && !failed && <p className="note">Pip is fetching headlines...</p>}
          {failed && !data && <p className="note">Headlines are not reachable right now. I will try again shortly.</p>}
          {lensOff && <p className="note">Your news lens is off. Turn a lens on in Settings.</p>}
          {data && !lensOff && <>
            <div className="ntabs" role="group" aria-label="Headline topics">
              {["All", ...groups, ...(tgItems.length ? ["Telegram"] : [])].map((g) => (
                <button key={g} className="chipb" type="button" aria-pressed={tab === g} onClick={() => { setTab(g); setMore(false); }}>
                  {g} {g === "All" ? items.length : items.filter((c) => c.lead.group === g).length}
                </button>
              ))}
            </div>
            {shown.length ? (
              <ul className="evl">
                {shown.map((c) => (
                  <li key={c.lead.link}>
                    <time>{ago(c.lead.at)}</time>
                    <span className="t"><a href={c.lead.link} target="_blank" rel="noopener noreferrer">{c.lead.title}</a>{top5.length > 0 && inTop5(c.lead.title, top5) && <span className="intop5">In today&apos;s top 5</span>}</span>
                    <small>{c.lead.group} · {c.lead.source}{c.sources > 1 ? ` · ${c.sources} sources` : ""}{c.syndicated ? " · syndicated" : ""} · <button type="button" className="nhide" onClick={() => setWhy(why === c.lead.link ? "" : c.lead.link)}>score {c.score}</button></small>
                    {why === c.lead.link && <small className="why">{c.why.join(" · ")}{c.items.length > 1 && <> · also: {c.items.filter((x) => x !== c.lead).slice(0, 5).map((x, n) => <a key={n} href={x.link} target="_blank" rel="noopener noreferrer"> {x.source}</a>)}</>}</small>}
                  </li>
                ))}
              </ul>
            ) : <p className="note">Nothing in this topic right now.</p>}
            {list.length > 8 && <button className="btn sm ghost" type="button" id="newsMoreBtn" onClick={() => setMore(!more)}>{more ? "Fewer headlines" : "More headlines"}</button>}
            <p className="note">Updated {data ? ago(data.at) : ""}{tg?.health?.length ? ` · ${tg.health.filter((x) => x.ok).length} of ${tg.health.length} Telegram channels reachable` : ""}. Not real time.</p>
            <p className="note xd">Free RSS feeds, refreshed every 15 minutes. Headlines only; open the original to read more.{down.length ? ` Not reachable now: ${down.join(", ")}.` : ""}</p>
          </>}
        </div>
      </div>
    </section>
    </>
  );
}
