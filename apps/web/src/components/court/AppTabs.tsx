"use client";

import { useEffect, useState } from "react";
import { useUi } from "@/components/kumo/useUi";
import { useReview } from "@/components/kumo/reviewRead";
import { Boundary } from "./Boundary";
import { useCourt } from "./CourtState";
import { hiddenTabs } from "./pages/Welcome";

// Main tabs: bottom bar on phone, left rail on desktop. Every panel stays mounted so nothing she typed is lost
// when she switches; the open tab lives in the address (#garden) so reload and back keep her place.
// Classic: the five v52 tabs. New look (round 6): Trades, News, Settings, Kingdom Mode and the welcome tour join
// the rail; on the phone the bar is Home, Calendar, Hub, Diary (the Dungeon) and More, which opens a sheet with the
// tabs that do not fit (Garden, Trades, News, Settings, Kingdom Mode). Round 7: the Notifications tab is retired
// (alert pop-ups on the agents replace it); #inbox and #notifications open the Court.
// There is no Observatory: old links (#observatory, #samsara, #money, #trade) are redirected (resolveHash).

export const TABS = ["court", "calendar", "garden", "diary", "life"] as const;
const EXTRA = ["trades", "news", "settings", "kingdom", "welcome"] as const;
export type TabId = (typeof TABS)[number];
type ExtraId = (typeof EXTRA)[number];
type PageId = TabId | ExtraId;
const LABEL: Record<PageId, string> = { court: "Court", calendar: "Calendar", garden: "Garden", diary: "Dungeon", life: "Life", trades: "Trades", news: "News", settings: "Settings", kingdom: "Kingdom Mode", welcome: "Welcome tour" };
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
  settings: ["...XXX...", ".X.XoX.X.", "XXXoooXXX", ".XoogooX.", ".XoooooX.", "XXXoooXXX", ".X.XoX.X.", "...XXX..."],
  kingdom: ["g.......g", "X...X...X", "XX.XoX.XX", "XoXXoXXoX", "XoooooooX", "XooXXXooX", "XooXoXooX", "XXXXXXXXX"],
  welcome: ["....g....", "...XXX...", "..XpppX..", ".XpppppX.", ".XpppppX.", "..XpppX..", "...XpX...", "....X...."],
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

// Old or retired places and where they live now.
// Cards on a page that links point to (their tab opens, then the page scrolls to them).
const ANCHOR: Record<string, PageId> = { "grid-wins": "life", "econ-cal": "calendar", "dungeon-week": "diary", tlog: "trades", "luna-card": "court", needWin: "court", "review-card": "settings" };
const ALIAS: Record<string, PageId> = { observatory: "court", sky: "court", samsara: "life", money: "life", trade: "trades", grid: "life", notifications: "court", inbox: "court", research: "news", more: "settings", onboarding: "welcome" };
/** The tab for an address hash, and whether the address should be rewritten (a retired link). */
export function resolveHash(h: string): { tab: PageId; rewrite: boolean } {
  if (([...TABS, ...EXTRA] as readonly string[]).includes(h)) return { tab: h as PageId, rewrite: false };
  if (h in ALIAS) return { tab: ALIAS[h], rewrite: true };
  if (h in ANCHOR) return { tab: ANCHOR[h], rewrite: false };
  return { tab: "court", rewrite: false };
}
const fromHash = (): PageId => {
  const h = window.location.hash.slice(1), r = resolveHash(h);
  if (r.rewrite) history.replaceState(null, "", window.location.pathname + window.location.search + (r.tab === "court" ? "" : "#" + r.tab));
  // a card on a page (for example #luna-card on the Court): show its tab, then scroll to it
  else if (h && !([...TABS, ...EXTRA] as readonly string[]).includes(h)) window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ block: "start" })));
  return r.tab;
};

export function AppTabs({ panels, extra = {} }: { panels: Record<TabId, React.ReactNode>; extra?: Partial<Record<ExtraId, React.ReactNode>> }) {
  const [tab, setTab] = useState<PageId>("court");
  const [more, setMore] = useState(false);
  const ui = useUi();
  const { st } = useCourt();
  const hide = hiddenTabs(st.prefs.rooms);
  // A small dot on Settings while Kumo's newest weekly review is unread (New look; the review card lives there).
  const review = useReview(null);
  const dot = (id: PageId) => (ui === "new" && id === "settings" && review.unread ? <i className="nav-dot" aria-label="new weekly review" /> : null);

  useEffect(() => {
    // A brand-new account (no history at all) starts on the welcome steps once; nobody else is redirected.
    if (!window.location.hash && !st.prefs.onboarded && !Object.keys(st.days).length && !st.life.length && !st.xp && document.documentElement.getAttribute("data-ui") !== "classic") history.replaceState(null, "", "#welcome");
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

  // New look: rooms she switched off in onboarding leave the nav (Settings can bring them back); the tour and
  // Kingdom Mode live under More and Settings rather than the rail.
  const nav: PageId[] = ui === "new" ? [...TABS, ...EXTRA.filter((id) => extra[id] && id !== "welcome")].filter((id) => !hide.includes(id)) : [...TABS];
  const inMore = nav.filter((id) => !PHONE_BAR.includes(id));
  return (
    <>
      <nav className={"tabnav" + (ui === "new" ? " tabnav-new" : "")} aria-label="Main">
        {nav.map((id) => (
          <button key={id} type="button" style={ui === "new" && PHONE_BAR.includes(id) ? ({ "--ord": PHONE_BAR.indexOf(id) } as React.CSSProperties) : undefined} className={ui === "new" && !PHONE_BAR.includes(id) ? "nav-more-item" : undefined} aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon id={id} />{dot(id)}
            <span>{ui === "new" && id === "life" ? <><span className="nl-desk">Life Hub</span><span className="nl-phone">Hub</span></> : ui === "new" && id === "diary" ? <><span className="nl-desk">Dungeon</span><span className="nl-phone">Diary</span></> : LABEL[id]}</span>
          </button>
        ))}
        {ui === "new" && (
          <button type="button" className="nav-more" aria-expanded={more} aria-current={inMore.includes(tab) ? "page" : undefined} onClick={() => setMore(!more)}>
            <Icon id="more" />{inMore.includes("settings") && dot("settings")}<span>More</span>
          </button>
        )}
        {ui === "new" && more && (
          <div className="nav-sheet" role="menu">
            {inMore.map((id) => <button key={id} type="button" role="menuitem" aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}><Icon id={id} />{dot(id)}<span>{LABEL[id]}</span></button>)}
          </div>
        )}
      </nav>
      {TABS.map((id) => (
        <div key={id} className={`tabpanel tp-${id}`} id={`tab-${id}`} hidden={tab !== id} aria-label={LABEL[id]}>
          <Boundary name={LABEL[id]}>{panels[id]}</Boundary>
        </div>
      ))}
      {EXTRA.filter((id) => extra[id]).map((id) => (
        <div key={id} className={`tabpanel tp-${id}`} id={`tab-${id}`} hidden={tab !== id} aria-label={LABEL[id]}>
          <Boundary name={LABEL[id]}>{extra[id]}</Boundary>
        </div>
      ))}
    </>
  );
}
