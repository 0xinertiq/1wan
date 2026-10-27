"use client";

import { useEffect, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { DecorSprite } from "@/components/kumo/DecorSprite";
import { PaintedBanner } from "@/components/kumo/PaintedBanner";
import { ADDITIONS, CREW_AT, kingdomCrops, stageFor } from "@/components/kumo/kingdom";
import type { BriefKind } from "@/lib/briefKinds";
import { crewDuty } from "@/lib/court/duty";
import type { WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";
import { useCourt } from "../CourtState";

// The Living Kingdom card (New look; replaces the Cloud Court scene there, Classic keeps the Cloud Court).
// Same live data as the Cloud Court: crew at work (lib/court/duty.ts, read-only) as small sprites at their
// places, BTC and SOL in Kumo's speech bubble. Places are links to their tabs. The scene follows her level,
// read-only; nothing here writes. It also carries the level-up banner the Cloud Court used to show.

const fmt = (n: number) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n >= 1 ? n.toFixed(2) : n.toPrecision(3));
const pct = (c: number | null) => (c == null ? "" : (c >= 0 ? "+" : "") + c.toFixed(1) + "%");
const MOBILE_OX = 40;
const NIGHT_STARS: [number, number][] = [[300, 30], [640, 40], [700, 110], [560, 18], [90, 120], [250, 110]];

export function LivingKingdom({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  const { st, k, nm, prices } = useCourt();
  const [water, setWater] = useState<WaterEvt[]>([]);
  useEffect(() => { getOnce<{ events?: WaterEvt[] }>("/api/water?days=1").then((j) => setWater(Array.isArray(j.events) ? j.events : [])).catch(() => {}); }, []);
  const duty = crewDuty({ k, filed, water, st, sky: true });
  const at = Object.entries(duty).filter(([, d]) => d.on).length;
  const stage = stageFor(st.lvl);
  const night = nm >= 19 * 60 || nm < 6 * 60;

  const crew = (place: string) => {
    const on = (CREW_AT[place] ?? []).filter((id) => duty[id]?.on);
    return on.length ? <span className="lk-crew">{on.map((id) => <span key={id} title={`${id}: ${duty[id].why}`}><PixelSprite name={id as SpriteName} /></span>)}</span> : null;
  };
  const place = (id: string, href: string | null, label: React.ReactNode) => (
    <>
      {href ? <a className="pb-chip lk-chip" href={href}>{label}</a> : <span className="pb-chip lk-chip">{label}</span>}
      {crew(id)}
    </>
  );
  const pick = ["BTC", "SOL"].map((s) => prices?.prices.find((p) => p.sym === s)).filter((p) => !!p);
  const bubble = (
    <span className="pb-bubble lk-bubble" aria-label="Live prices">
      {pick.length ? pick.map((p) => <span key={p!.sym}>{p!.sym} {fmt(p!.usd)} <i className={p!.ch24 != null && p!.ch24 < 0 ? "dn" : "up"}>{pct(p!.ch24)}</i></span>) : <span>Prices loading…</span>}
      {prices?.stale && <span className="note">stale</span>}
    </span>
  );
  const fill = {
    title: <div className="pb-greet lk-title"><h2>{stage.name}</h2><p>Level {st.lvl} · {at} crew at work</p></div>,
    castle: place("castle", null, <><span>The Castle</span><span>Lv {st.lvl}</span></>),
    clock: place("clock", "#calendar", "Clock Tower"),
    obs: place("obs", "#observatory", "Observatory"),
    garden: place("garden", "#garden", "Sakura Garden"),
    life: place("life", "#life", "Life Hub"),
    diary: place("diary", "#diary", "Fox Diary"),
    bubble,
  };
  // Stages 3-5: code-drawn additions on the Growing scene (prototype), and night stars after 19:00 SGT.
  const extra = (which: "d" | "m") => {
    const crop = kingdomCrops(stage.scene)[which === "m" ? "mobile" : "desktop"];
    const ox = which === "m" ? MOBILE_OX : 0, W = crop.w, H = crop.h;
    return (
      <>
        {ADDITIONS.filter(([n]) => stage.n >= n).map(([, id, x, y, size], i) => (
          <DecorSprite key={i} id={id} className="lk-add" style={{ left: ((x - ox - size / 2) / W) * 100 + "%", top: ((y - size * 0.92) / H) * 100 + "%", width: (size / W) * 100 + "%" }} />
        ))}
        {night && NIGHT_STARS.map(([x, y], i) => <DecorSprite key={"s" + i} id="star" className="lk-star" style={{ left: ((x - ox) / W) * 100 + "%", top: (y / H) * 100 + "%", animationDelay: (i % 3) * 0.8 + "s" }} />)}
      </>
    );
  };
  return (
    <section className="win lk" aria-labelledby="lkT">
      <div className="win-title"><h2 id="lkT">Living Kingdom</h2><span className="sub">{stage.name.replace(" Kingdom", "")}</span></div>
      <PaintedBanner set={kingdomCrops(stage.scene)} label="Your kingdom" className={"lkscene lk-" + stage.scene + (night ? " lk-night" : "")} fill={fill} extra={extra}>
        <div className="lvl" id="lvlBanner" hidden><b id="lvlTxt">LEVEL UP</b><span id="lvlSub"></span></div>
      </PaintedBanner>
    </section>
  );
}
