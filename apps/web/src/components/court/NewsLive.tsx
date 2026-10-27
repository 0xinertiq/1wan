"use client";

import { useEffect, useState } from "react";
import { COINGECKO_IDS } from "@/lib/prices";
import { NEWS_GROUPS, REGIONS } from "@/lib/newsFeeds";
import { cluster } from "@/lib/cluster";
import { useCourt } from "./CourtState";
import { useEcon } from "./live/EconLive";
import type { NewsResult } from "@/lib/news";

// Headlines window (v52 newsWin) from free RSS feeds. Works without Bigdata.

function ago(iso: string | null) {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
}

type Tg = { items: { channel: string; title: string; at: string | null; text: string; link: string }[]; health: { handle: string; ok: boolean }[]; at: string };

export function NewsLive() {
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
  const rss = (data?.items ?? []).filter((h) => regions.includes(h.region));
  const watch = (prices?.prices ?? []).flatMap((p) => [p.sym, (COINGECKO_IDS[p.sym] ?? "").split("-")[0]]).filter(Boolean);
  const clusters = cluster([...rss, ...tgItems], { watch, releases: (econ?.items ?? []).filter((e) => e.top).map((e) => e.title) });
  const items = clusters;
  const list = tab === "All" ? items : items.filter((c) => c.lead.group === tab);
  const shown = list.slice(0, more ? 40 : 8);
  const down = data?.feeds.filter((f) => !f.ok).map((f) => f.name) ?? [];

  return (
    <section className="win" id="newsWin" aria-labelledby="nwT">
      <div className="win-title"><h2 id="nwT">Headlines</h2><span className="sub">Pip {items.length > 0 && <span className="badge" id="newsCount">{items.length}</span>}</span></div>
      <div className="win-body">
        <div id="newsBox">
          {!data && !failed && <p className="note">Pip is fetching headlines...</p>}
          {failed && !data && <p className="note">Headlines are not reachable right now. I will try again shortly.</p>}
          {data && <>
            <div className="ntabs" role="group" aria-label="Headline topics">
              {["All", ...NEWS_GROUPS, ...(tgItems.length ? ["Telegram"] : [])].map((g) => (
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
                    <span className="t"><a href={c.lead.link} target="_blank" rel="noopener noreferrer">{c.lead.title}</a></span>
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
  );
}
