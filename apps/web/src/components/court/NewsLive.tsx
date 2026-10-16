"use client";

import { useEffect, useState } from "react";
import { NEWS_GROUPS } from "@/lib/newsFeeds";
import type { NewsResult } from "@/lib/news";

// Headlines window (v52 newsWin) from free RSS feeds. Works without Bigdata.

function ago(iso: string | null) {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
}

export function NewsLive() {
  const [data, setData] = useState<NewsResult | null>(null);
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
    load();
    const t = window.setInterval(load, 15 * 60 * 1000);
    return () => { alive = false; window.clearInterval(t); };
  }, []);

  const items = data?.items ?? [];
  const list = tab === "All" ? items : items.filter((h) => h.group === tab);
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
              {["All", ...NEWS_GROUPS].map((g) => (
                <button key={g} className="chipb" type="button" aria-pressed={tab === g} onClick={() => { setTab(g); setMore(false); }}>
                  {g} {g === "All" ? items.length : items.filter((h) => h.group === g).length}
                </button>
              ))}
            </div>
            {shown.length ? (
              <ul className="evl">
                {shown.map((h) => (
                  <li key={h.link}>
                    <time>{ago(h.at)}</time>
                    <span className="t"><a href={h.link} target="_blank" rel="noopener noreferrer">{h.title}</a></span>
                    <small>{h.group} · {h.source}</small>
                  </li>
                ))}
              </ul>
            ) : <p className="note">Nothing in this topic right now.</p>}
            {list.length > 8 && <button className="btn sm ghost" type="button" id="newsMoreBtn" onClick={() => setMore(!more)}>{more ? "Fewer headlines" : "More headlines"}</button>}
            <p className="note xd">Free RSS feeds, refreshed every 15 minutes. Headlines only; open the original to read more.{down.length ? ` Not reachable now: ${down.join(", ")}.` : ""}</p>
          </>}
        </div>
      </div>
    </section>
  );
}
