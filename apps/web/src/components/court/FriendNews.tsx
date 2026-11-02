"use client";

import { useEffect, useState } from "react";
import { ageText } from "@/lib/court/time";
import { CAT_LABEL, NEWS_CATS, forCats, type Item, type NewsCat } from "@/lib/newsCats";
import { useCourt } from "./CourtState";

// Round 22: a friend's News, from the one shared feed (/api/news/shared): their chosen categories with filter chips.
// Never blank: the last good headlines are kept on this device and shown when the feed is briefly unavailable, and
// if nothing new is in their categories the latest from every category shows instead. Headline, publisher, time,
// category and a link to the original only.
type Feed = { at: string | null; items: Item[]; failed: string[] };
const KEEP = "1wan.v2.friendnews";
const ok = (j: unknown): j is Feed => !!j && typeof j === "object" && Array.isArray((j as Feed).items);
const readKept = (): Feed | null => { try { const j = JSON.parse(localStorage.getItem(KEEP) ?? "null"); return ok(j) ? j : null; } catch { return null; } };

export function FriendNews({ compact = false }: { compact?: boolean }) {
  const { st } = useCourt();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [down, setDown] = useState(false);
  const [chip, setChip] = useState<NewsCat | "all">("all");
  const [more, setMore] = useState(false);
  useEffect(() => {
    let alive = true;
    const kept = readKept();
    if (kept) setFeed(kept);
    async function load() {
      try {
        const r = await fetch("/api/news/shared");
        const j = await r.json();
        if (!r.ok || !ok(j) || !j.items.length) throw new Error("no feed");
        if (!alive) return;
        setFeed(j); setDown(false);
        try { localStorage.setItem(KEEP, JSON.stringify({ ...j, items: j.items.slice(0, 300) })); } catch {}
      } catch { if (alive) setDown(true); }
    }
    load();
    const t = window.setInterval(load, 15 * 60e3);
    const back = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", back);
    return () => { alive = false; window.clearInterval(t); document.removeEventListener("visibilitychange", back); };
  }, []);

  const all = feed?.items ?? [];
  const mine = forCats(all, st.lenses);
  const fallback = !!all.length && !mine.length; // nothing new in their categories: show every category
  const base = fallback ? all : mine;
  const cats = NEWS_CATS.filter((c) => base.some((x) => x.category === c));
  const list = chip === "all" ? base : base.filter((x) => x.category === chip);
  const cap = compact ? 6 : 12, shown = more ? list : list.slice(0, cap);
  return (
    <section className="win kcard" id="newsWin" aria-labelledby="fnT">
      <div className="win-title"><h2 id="fnT">Headlines</h2><span className="sub">Pip · your categories{base.length > 0 && <> <span className="badge">{base.length}</span></>}</span></div>
      <div className="win-body">
        {!feed && !down && <p className="note">Pip is fetching headlines…</p>}
        {!feed && down && <p className="note">Headlines are warming up. They appear here in a minute.</p>}
        {feed && down && <p className="note">News is briefly unavailable, so these are the last headlines we had. Trying again shortly.</p>}
        {fallback && <p className="note">Nothing new in your categories right now, so here is the latest from every category.</p>}
        {feed && <>
          {!compact && cats.length > 1 && (
            <div className="ntabs" role="group" aria-label="Headline categories">
              {(["all", ...cats] as const).map((c) => (
                <button key={c} className="chipb" type="button" aria-pressed={chip === c} onClick={() => { setChip(c); setMore(false); }}>
                  {c === "all" ? "All" : CAT_LABEL[c]} {c === "all" ? base.length : base.filter((x) => x.category === c).length}
                </button>
              ))}
            </div>
          )}
          <ul className="evl">
            {shown.map((x) => (
              <li key={x.id}>
                <time>{x.published_at ? ageText(x.published_at) : ""}</time>
                <span className="t"><a href={x.link} target="_blank" rel="noopener noreferrer">{x.title}</a></span>
                <small>{CAT_LABEL[x.category] ?? ""} · {x.publisher}</small>
              </li>
            ))}
          </ul>
          {list.length > cap && <button className="btn sm ghost" type="button" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Collapse" : "More headlines"}</button>}
          {!compact && <p className="note xd">Headlines from public news feeds, refreshed every few hours. Open the original to read more.{feed.failed.length ? ` Not reachable now: ${feed.failed.join(", ")}.` : ""}</p>}
        </>}
      </div>
    </section>
  );
}
