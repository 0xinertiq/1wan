"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/components/kumo/useUi";
import { useReview } from "@/components/kumo/reviewRead";
import { useCourt } from "./CourtState";

// Main tabs: bottom bar on phone, left rail on desktop. Every panel stays mounted so nothing she typed is lost
// when she switches; the open tab lives in the address (#garden) so reload and back keep her place.
// Classic: the five v52 tabs. New look: Trades, News and Observatory join the rail; on the phone the bar is
// Home, Calendar, Hub, Dungeon and More (More holds Garden, Observatory, Trades, News and Settings).

export const TABS = ["court", "calendar", "garden", "diary", "life"] as const;
const EXTRA = ["trades", "news", "observatory"] as const;
export type TabId = (typeof TABS)[number];
type ExtraId = (typeof EXTRA)[number];
type PageId = TabId | ExtraId;
const LABEL: Record<PageId, string> = { court: "Court", calendar: "Calendar", garden: "Garden", diary: "Dungeon", life: "Life", trades: "Trades", news: "News", observatory: "Observatory" };
const PHONE_BAR: PageId[] = ["court", "calendar", "life", "diary"];

// 9x8 pixel icons: X outline, o fill, g gold accent, p blossom pink.
const ICONS: Record<PageId | "more", string[]> = {
  court: ["....gg...", "....X....", "X.X.X.X.X", "XXXXXXXXX", ".XoooooX.", ".XooXooX.", ".XoXXXoX.", ".XXXXXXX."],
  calendar: [".X.....X.", "XXXXXXXXX", "XgggggggX", "XXXXXXXXX", "XoXoXoXoX", "XoooooooX", "XoXoXoXoX", "XXXXXXXXX"],
  garden: ["...ppp...", "..ppgpp..", "...ppp...", "....X....", ".XX.X....", "..XXX.XX.", "....XXX..", "....X...."],
  diary: ["..XXXX..X", ".XooooX.p", "XooooooX.", "XoogooX..", "XoooXooX.", "XoooXooX.", "XooooooX.", "XXXXXXXX."],
  life: [".XX...XX.", "XppX.XppX", "XpppXpppX", "XpppppppX", ".XpppppX.", "..XpppX..", "...XpX...", "....X...."],
  trades: ["........g", ".......X.", "......X..", ".X...X...", "X.X.X....", "X..X.....", "X........", "XXXXXXXXX"],
  news: ["XXXXXXXX.", "XooooooXX", "XoXXXXoXX", "XooooooXX", "XoXXoXoXX", "XooooooXX", "XoXXXgoXX", "XXXXXXXX."],
  observatory: ["......g..", "....XX...", "...XooX..", "..XoooX..", ".XoooX...", "X.XXX....", "..X.X....", ".X...X..."],
  more: [".........", ".........", ".........", "XX.XX.XX.", "XX.XX.XX.", ".........", ".........", "........."],
};
// pixel-art palette (nav icons, Classic). The New look colours the same rects through tokens by class
// (ic-X outline, ic-o fill), so they stay visible at night and the active tab turns sakura. pixel-art
const FILL: Record<string, string> = { X: "var(--line)", o: "var(--win-hi)", g: "#FFD95E", p: "#FFB3D1" };

function Icon({ id }: { id: PageId | "more" }) {
  return (
    <svg viewBox="0 0 9 8" shapeRendering="crispEdges" aria-hidden="true">
      {ICONS[id].flatMap((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} className={"ic-" + c} x={x} y={y} width="1" height="1" fill={FILL[c]} />)))}
    </svg>
  );
}

const fromHash = (): PageId => {
  const h = window.location.hash.slice(1);
  return ([...TABS, ...EXTRA] as readonly string[]).includes(h) ? (h as PageId) : "court";
};

export function AppTabs({ panels, extra = {} }: { panels: Record<TabId, React.ReactNode>; extra?: Partial<Record<ExtraId, React.ReactNode>> }) {
  const [tab, setTab] = useState<PageId>("court");
  const [more, setMore] = useState(false);
  const ui = useUi();
  const { openSheet } = useCourt();
  // A small dot on News while Kumo's newest weekly review is unread (New look).
  const review = useReview(null);
  const dot = (id: PageId) => (ui === "new" && id === "news" && review.unread ? <i className="nav-dot" aria-label="new weekly review" /> : null);

  useEffect(() => {
    setTab(fromHash());
    const on = () => { setTab(fromHash()); setMore(false); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  function go(id: PageId) {
    setMore(false);
    if (id === tab) return;
    setTab(id);
    history.pushState(null, "", id === "court" ? window.location.pathname : "#" + id);
    window.scrollTo({ top: 0 });
  }

  const nav: PageId[] = ui === "new" ? [...TABS, ...EXTRA.filter((id) => extra[id])] : [...TABS];
  const inMore = nav.filter((id) => !PHONE_BAR.includes(id));
  return (
    <>
      <nav className={"tabnav" + (ui === "new" ? " tabnav-new" : "")} aria-label="Main">
        {nav.map((id) => (
          <button key={id} type="button" className={ui === "new" && !PHONE_BAR.includes(id) ? "nav-more-item" : undefined} aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon id={id} />{dot(id)}
            <span>{ui === "new" && id === "life" ? <><span className="nl-desk">Life</span><span className="nl-phone">Hub</span></> : LABEL[id]}</span>
          </button>
        ))}
        {ui === "new" && (
          <button type="button" className="nav-more" aria-expanded={more} aria-current={inMore.includes(tab) ? "page" : undefined} onClick={() => setMore(!more)}>
            <Icon id="more" />{inMore.includes("news") && dot("news")}<span>More</span>
          </button>
        )}
        {ui === "new" && more && (
          <div className="nav-sheet" role="menu">
            {inMore.map((id) => <button key={id} type="button" role="menuitem" aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}><Icon id={id} />{dot(id)}<span>{LABEL[id]}</span></button>)}
            <button type="button" role="menuitem" onClick={() => { setMore(false); openSheet({ kind: "settings" }); }}><Icon id="more" /><span>Settings</span></button>
          </div>
        )}
      </nav>
      {TABS.map((id) => (
        <div key={id} className={`tabpanel tp-${id}`} id={`tab-${id}`} hidden={tab !== id} aria-label={LABEL[id]}>
          {panels[id]}
        </div>
      ))}
      {EXTRA.filter((id) => extra[id]).map((id) => (
        <div key={id} className={`tabpanel tp-${id}`} id={`tab-${id}`} hidden={tab !== id} aria-label={LABEL[id]}>
          {extra[id]}
        </div>
      ))}
    </>
  );
}
