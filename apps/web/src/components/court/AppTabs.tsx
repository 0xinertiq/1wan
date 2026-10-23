"use client";

import { useEffect, useState } from "react";

// Main tabs: bottom bar on phone, left rail on desktop. Every panel stays mounted so nothing she typed is lost
// when she switches; the open tab lives in the address (#garden) so reload and back keep her place.

export const TABS = ["court", "calendar", "garden", "diary", "life"] as const;
export type TabId = (typeof TABS)[number];
const LABEL: Record<TabId, string> = { court: "Court", calendar: "Calendar", garden: "Garden", diary: "Diary", life: "Life" };

// 9x8 pixel icons: X outline, o fill, g gold accent, p blossom pink.
const ICONS: Record<TabId, string[]> = {
  court: ["....gg...", "....X....", "X.X.X.X.X", "XXXXXXXXX", ".XoooooX.", ".XooXooX.", ".XoXXXoX.", ".XXXXXXX."],
  calendar: [".X.....X.", "XXXXXXXXX", "XgggggggX", "XXXXXXXXX", "XoXoXoXoX", "XoooooooX", "XoXoXoXoX", "XXXXXXXXX"],
  garden: ["...ppp...", "..ppgpp..", "...ppp...", "....X....", ".XX.X....", "..XXX.XX.", "....XXX..", "....X...."],
  diary: [".XXXXXXX.", ".XoooogX.", ".XoXXXgX.", ".XoooogX.", ".XoXXogX.", ".XoooogX.", ".XXXXXXX.", "........."],
  life: [".XX...XX.", "XppX.XppX", "XpppXpppX", "XpppppppX", ".XpppppX.", "..XpppX..", "...XpX...", "....X...."],
};
const FILL: Record<string, string> = { X: "var(--line)", o: "var(--win-hi)", g: "#FFD95E", p: "#FFB3D1" };

function Icon({ id }: { id: TabId }) {
  return (
    <svg viewBox="0 0 9 8" shapeRendering="crispEdges" aria-hidden="true">
      {ICONS[id].flatMap((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={FILL[c]} />)))}
    </svg>
  );
}

const fromHash = (): TabId => {
  const h = window.location.hash.slice(1);
  return (TABS as readonly string[]).includes(h) ? (h as TabId) : "court";
};

export function AppTabs({ panels }: { panels: Record<TabId, React.ReactNode> }) {
  const [tab, setTab] = useState<TabId>("court");

  useEffect(() => {
    setTab(fromHash());
    const on = () => setTab(fromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  function go(id: TabId) {
    if (id === tab) return;
    setTab(id);
    history.pushState(null, "", id === "court" ? window.location.pathname : "#" + id);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <nav className="tabnav" aria-label="Main">
        {TABS.map((id) => (
          <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon id={id} />
            <span>{LABEL[id]}</span>
          </button>
        ))}
      </nav>
      {TABS.map((id) => (
        <div key={id} className={`tabpanel tp-${id}`} id={`tab-${id}`} hidden={tab !== id} aria-label={LABEL[id]}>
          {panels[id]}
        </div>
      ))}
    </>
  );
}
