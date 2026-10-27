"use client";

import { useEffect, useRef, useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import type { BriefKind } from "@/lib/briefKinds";
import { crewDuty, type Duty } from "@/lib/court/duty";
import type { WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";
import { AGENTS, NODES } from "./agents";
import { useCourt } from "./CourtState";

// Walking crew from dashboard-v52 (bfs over the platform graph, walk and hop segments).
// Change from v52: positions follow real events only (lib/court/duty.ts). Everyone starts inside the palace;
// a crew member walks to their desk once their own work for today exists and stays there. No random wandering.

type Node = keyof typeof NODES;
type Edge = [Node, Node, "w" | "h"];

const EDGES: Edge[] = [
  ["g1", "g2", "w"], ["g2", "g3", "w"], ["g3", "g4", "h"], ["g4", "g5", "w"], ["g5", "g6", "w"],
  ["pl1", "pl2", "w"], ["pr1", "pr2", "w"], ["pt1", "pt2", "w"],
  ["g1", "pl1", "h"], ["g2", "pl2", "h"], ["g5", "pr1", "h"], ["g6", "pr2", "h"],
  ["pl2", "pt1", "h"], ["pr1", "pt2", "h"], ["pal", "pt1", "h"], ["pal", "pt2", "h"],
];
const ADJ = {} as Record<Node, [Node, "w" | "h"][]>;
for (const n of Object.keys(NODES) as Node[]) ADJ[n] = [];
for (const [a, b, t] of EDGES) { ADJ[a].push([b, t]); ADJ[b].push([a, t]); }

function bfs(from: Node, to: Node): Node[] {
  if (from === to) return [];
  const prev: Partial<Record<Node, Node | null>> = { [from]: null };
  const q: Node[] = [from];
  while (q.length) {
    const c = q.shift()!;
    if (c === to) break;
    for (const [n] of ADJ[c]) if (!(n in prev)) { prev[n] = c; q.push(n); }
  }
  const path: Node[] = [];
  let c: Node | null | undefined = to;
  while (c && c !== from) { path.unshift(c); c = prev[c]; }
  return path;
}
const edgeType = (a: Node, b: Node) => ADJ[a].find((x) => x[0] === b)?.[1] ?? "w";

type Seg = { x0: number; y0: number; x1: number; y1: number; type: "w" | "h"; dur: number; t: number; to: Node; arc: number };
type Actor = {
  id: string; work: Node; hello: string;
  el: HTMLButtonElement; flip: HTMLElement; bubble: HTMLElement;
  node: Node; x: number; y: number; seg: Seg | null; path: Node[]; goal: Node | null;
  cb: (() => void) | null; replan: boolean; inside: boolean; bt?: number; why: string;
};

export function StageActors({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { openSheet, st, k } = useCourt();
  const [water, setWater] = useState<WaterEvt[]>([]);
  const apply = useRef<((d: Record<string, Duty>) => void) | null>(null);
  useEffect(() => { getOnce<{ events?: WaterEvt[] }>("/api/water?days=1").then((j) => setWater(Array.isArray(j.events) ? j.events : [])); }, []);
  const duty = crewDuty({ k, filed, water, st, sky: true });
  const dutyKey = JSON.stringify(duty);
  const dutyRef = useRef(duty);
  dutyRef.current = duty;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const RM = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const actors: Actor[] = [];
    root.querySelectorAll<HTMLButtonElement>(".agent:not(.boss)").forEach((el) => {
      const def = AGENTS.find((a) => a.id === el.dataset.id);
      if (!def?.work) return;
      const [x, y] = NODES.pal;
      actors.push({
        id: def.id, work: def.work, hello: def.hello, el,
        flip: el.querySelector(".flip")!, bubble: el.querySelector(".bubble")!,
        node: "pal", x, y, seg: null, path: [], goal: null, cb: null, replan: false, inside: true, why: "",
      });
    });

    function setPos(a: Actor, x: number, y: number) {
      a.x = x; a.y = y;
      a.el.style.left = x + "%"; a.el.style.top = y + "%";
      a.el.style.zIndex = String(a.seg?.type === "h" ? 2000 : Math.round(y * 10));
    }
    function palZ() {
      const n = actors.filter((x) => x.inside).length;
      const z = document.getElementById("zz");
      if (z) { z.hidden = !n; z.textContent = n ? Array(Math.min(3, n) + 1).join("z ") : ""; }
      const chip = document.getElementById("crewChip");
      if (chip) chip.textContent = `${actors.length - n} AT WORK`;
    }
    function arrived(a: Actor) { const cb = a.cb; a.cb = null; a.goal = null; if (cb) cb(); }
    function startSeg(a: Actor, to: Node) {
      const [fx, fy] = NODES[a.node], [tx, ty] = NODES[to], type = edgeType(a.node, to);
      const dx = tx - fx, dy = ty - fy;
      a.flip.classList.toggle("left", dx < 0);
      if (RM) { a.node = to; setPos(a, tx, ty); a.seg = null; return; }
      const dur = type === "w" ? Math.max(0.5, Math.abs(dx) / 10) : 0.8 + Math.abs(dx) / 90;
      a.seg = { x0: fx, y0: fy, x1: tx, y1: ty, type, dur, t: 0, to, arc: type === "h" ? 9 + Math.abs(dy) * 0.35 : 0 };
      a.el.classList.toggle("walking", type === "w");
      a.el.classList.toggle("hopping", type === "h");
    }
    function nextSeg(a: Actor) {
      while (a.path.length) { startSeg(a, a.path.shift()!); if (a.seg) return; }
      a.seg = null; a.el.classList.remove("walking", "hopping");
      arrived(a);
    }
    function goTo(a: Actor, target: Node, cb?: () => void) {
      a.goal = target; a.cb = cb ?? null;
      if (!a.seg) { a.path = bfs(a.node, target); nextSeg(a); } else a.replan = true;
    }
    function say(a: Actor, text: string) {
      a.bubble.textContent = text; a.bubble.classList.add("on");
      window.clearTimeout(a.bt); a.bt = window.setTimeout(() => a.bubble.classList.remove("on"), 3200);
    }
    // Out to the desk when the work exists, back inside when it does not (a new day, a removed line).
    function goOut(a: Actor, delay: number) {
      if (!a.inside) return;
      a.inside = false; a.el.classList.remove("inside"); palZ();
      window.setTimeout(() => goTo(a, a.work, () => { a.el.classList.add("desk"); say(a, a.why); }), RM ? 0 : delay);
    }
    function goIn(a: Actor) {
      if (a.inside) return;
      a.el.classList.remove("desk");
      goTo(a, "pal", () => { a.inside = true; a.el.classList.add("inside"); a.bubble.classList.remove("on"); palZ(); });
    }
    apply.current = (d) => {
      let i = 0;
      for (const a of actors) {
        const x = d[a.id]; a.why = x?.why ?? "";
        a.el.setAttribute("aria-label", a.el.dataset.label + (a.why ? `. ${a.why}.` : ""));
        if (x?.on) goOut(a, 150 + i++ * 260); else goIn(a);
      }
    };
    actors.forEach((a) => setPos(a, a.x, a.y));
    palZ();

    let raf = 0, last = 0;
    function tick(ts: number) {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      for (const a of actors) {
        if (a.seg) {
          const s = a.seg; s.t += dt / s.dur; const t = Math.min(1, s.t);
          setPos(a, s.x0 + (s.x1 - s.x0) * t, s.y0 + (s.y1 - s.y0) * t - (s.arc ? s.arc * 4 * t * (1 - t) : 0));
          if (s.t >= 1) {
            a.node = s.to; a.seg = null; a.el.classList.remove("walking", "hopping");
            setPos(a, s.x1, s.y1);
            if (a.replan) { a.replan = false; a.path = bfs(a.node, a.goal ?? a.node); nextSeg(a); } else nextSeg(a);
          }
          continue;
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame((ts) => { last = ts; tick(ts); });

    apply.current(dutyRef.current);

    const clicks = actors.map((a) => {
      const h = () => say(a, a.why || a.hello);
      a.el.addEventListener("click", h);
      return () => a.el.removeEventListener("click", h);
    });

    return () => {
      cancelAnimationFrame(raf);
      apply.current = null;
      clicks.forEach((off) => off());
      actors.forEach((a) => window.clearTimeout(a.bt));
    };
  }, []);
  useEffect(() => { apply.current?.(dutyRef.current); }, [dutyKey]);

  return (
    <div className="actors" id="actors" ref={rootRef}>
      {AGENTS.map((d, i) => {
        const [x, y] = d.id === "kumo" ? [50, 84] : NODES.pal;
        return (
          <button
            key={d.id}
            type="button"
            className={d.id === "kumo" ? "agent boss" : "agent inside"}
            data-id={d.id}
            data-label={`${d.name}, ${d.role}. Select to meet`}
            aria-label={`${d.name}, ${d.role}. Select to meet.`}
            style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y * 10) }}
            onClick={() => openSheet({ kind: "crew", id: d.id })}
          >
            <span className="ring"></span>
            <span className="shadow"></span>
            <span className="flip">
              <span className="bob" style={{ animationDelay: `${-((i * 0.37) % 3).toFixed(2)}s` }}>
                <PixelSprite name={d.sprite} />
              </span>
            </span>
            <span className="prog"><i></i></span>
            <span className="emote"><b></b><b></b><b></b></span>
            <span className="bubble" aria-hidden="true"></span>
          </button>
        );
      })}
    </div>
  );
}
