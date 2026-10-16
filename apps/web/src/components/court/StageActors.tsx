"use client";

import { useEffect, useRef } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { AGENTS, NODES } from "./agents";

// Walking crew from dashboard-v52 (bfs over the platform graph, walk and hop segments, palace rest).
// Change from v52: the crew rests in the palace when she has been away for a while, not on a per-agent timer,
// and walks back out on her next tap, key or scroll.

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
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// How long without a tap, key or scroll before the crew goes inside to rest.
const IDLE_MS = 2 * 60 * 1000;

type Seg = { x0: number; y0: number; x1: number; y1: number; type: "w" | "h"; dur: number; t: number; to: Node; arc: number };
type Actor = {
  id: string; work: Node; hello: string;
  el: HTMLButtonElement; flip: HTMLElement; bubble: HTMLElement;
  node: Node; x: number; y: number; seg: Seg | null; path: Node[]; goal: Node | null;
  cb: (() => void) | null; replan: boolean; mode: "idle" | "rest" | "inside"; wait: number; inside: boolean; bt?: number;
};

export function StageActors() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const RM = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const actors: Actor[] = [];
    root.querySelectorAll<HTMLButtonElement>(".agent:not(.boss)").forEach((el) => {
      const def = AGENTS.find((a) => a.id === el.dataset.id);
      if (!def?.work) return;
      const [x, y] = NODES[def.work];
      actors.push({
        id: def.id, work: def.work, hello: def.hello, el,
        flip: el.querySelector(".flip")!, bubble: el.querySelector(".bubble")!,
        node: def.work, x, y, seg: null, path: [], goal: null, cb: null, replan: false,
        mode: "idle", wait: rnd(1, 4), inside: false,
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
      if (chip) chip.textContent = n ? `${n} RESTING` : "ALL IDLE";
    }
    function arrived(a: Actor) { const cb = a.cb; a.cb = null; a.goal = null; if (cb) cb(); else a.wait = rnd(1, 3); }
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
    function deskMode(a: Actor) { a.el.classList.add("desk"); a.wait = rnd(3, 6); }
    function goRest(a: Actor) {
      if (a.inside || a.mode === "rest") return;
      a.mode = "rest"; a.el.classList.remove("desk");
      goTo(a, "pal", () => {
        a.inside = true; a.mode = "inside"; a.el.classList.add("inside"); a.bubble.classList.remove("on");
        palZ();
      });
    }
    function wake(a: Actor, delay: number) {
      if (!a.inside && a.mode !== "rest") return;
      a.inside = false; a.mode = "idle"; a.el.classList.remove("inside");
      a.wait = 9999;
      palZ();
      window.setTimeout(() => goTo(a, a.work, () => { a.mode = "idle"; deskMode(a); }), RM ? 0 : delay);
    }
    function say(a: Actor, text: string) {
      a.bubble.textContent = text; a.bubble.classList.add("on");
      window.clearTimeout(a.bt); a.bt = window.setTimeout(() => a.bubble.classList.remove("on"), 3200);
    }
    function idleStep(a: Actor, dt: number) {
      a.wait -= dt; if (a.wait > 0) return;
      if (RM) { a.wait = 9999; return; }
      a.el.classList.remove("desk");
      let target: Node | undefined;
      if (Math.random() < 0.5) target = a.work;
      else {
        const near = (Object.keys(NODES) as Node[]).filter((n) => n !== a.node && n !== "pal" && bfs(a.node, n).length <= 3);
        target = near[Math.floor(Math.random() * near.length)];
      }
      if (!target) return;
      if (target === a.node) { deskMode(a); return; }
      goTo(a, target, () => { if (target === a.work) deskMode(a); else a.wait = rnd(1, 3); });
    }

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
        if (a.mode === "idle") idleStep(a, dt);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame((ts) => { last = ts; tick(ts); });

    // Away for a while: everyone walks into the palace. Back: they come out, one after another.
    let idleTimer = 0;
    const sleepAll = () => actors.forEach(goRest);
    function onActivity() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(sleepAll, IDLE_MS);
      actors.forEach((a, i) => wake(a, 150 + i * 260));
    }
    const evs = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    idleTimer = window.setTimeout(sleepAll, IDLE_MS);

    const clicks = actors.map((a) => {
      const h = () => say(a, a.hello);
      a.el.addEventListener("click", h);
      return () => a.el.removeEventListener("click", h);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      evs.forEach((e) => window.removeEventListener(e, onActivity));
      clicks.forEach((off) => off());
      actors.forEach((a) => window.clearTimeout(a.bt));
    };
  }, []);

  return (
    <div className="actors" id="actors" ref={rootRef}>
      {AGENTS.map((d, i) => {
        const [x, y] = d.id === "kumo" ? [50, 84] : NODES[d.work!];
        return (
          <button
            key={d.id}
            type="button"
            className={d.id === "kumo" ? "agent boss" : "agent desk"}
            data-id={d.id}
            aria-label={`${d.name}, ${d.role}. Select to meet.`}
            style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y * 10) }}
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
