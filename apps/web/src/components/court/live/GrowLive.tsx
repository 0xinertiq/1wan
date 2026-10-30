"use client";

import { getOnce } from "@/lib/court/once";
import { useEffect, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { useCourt } from "../CourtState";
import { AGENTS } from "../agents";
import { logQuest } from "@/lib/court/actions";
import { QUESTS, needFor } from "@/lib/court/quests";
import {
  STAGES, activeQ, dayQ, eventsOn, gardenWeek, isDone, manualOpen, openQuests, progOf, qScore, seedInfo, weekHab, winTally,
  type CourtState, type SeedInfo,
} from "@/lib/court/state";
import { addDays, prettyDay, weekKey, dayIdx, sgtKeyOf, wdOf } from "@/lib/court/time";
import { branches, needsCare, type Branch, type WaterEvt } from "@/lib/court/garden";
import { DecorSprite } from "@/components/kumo/DecorSprite";
import { GardenTree } from "@/components/kumo/decor/GardenTree";
import { WILT_CAPTION, wiltOf } from "@/components/kumo/decor/treeArt";
import { DungeonIcon } from "@/components/kumo/DungeonIcon";
import { NUDGE } from "@/lib/gardenMap";
import { water } from "@/lib/court/water";
import { TAILS, earned } from "@/lib/court/tails";
import { useUi } from "@/components/kumo/useUi";
import { habitWeek, gardenStage, GROW_AT } from "@/lib/court/habits";
import { branchProgress, chartBranches } from "@/lib/court/branchChart";
import { anchorCount, anchorRows, ordered, questName } from "@/lib/court/gardenEdit";
import { Card as GCard } from "../ui";

// Growth column from dashboard-v52: Sakura Garden (with Habit Quests inside), Gratitude (round 11 name),
// Dungeon with the weekly recap, and the "You" status card. Everything saves to her state.

const short = (id: string) => AGENTS.find((a) => a.id === id)?.short ?? id;
const Mini = ({ name, sm }: { name: SpriteName; sm?: boolean }) => <span className={sm ? "mini sm" : "mini"}><PixelSprite name={name} /></span>;
const QKEYS = ["q", "stars", "streak", "xp", "lvl"] as const;
const gid = () => Math.random().toString(36).slice(2, 8);

/* ---------- Habit Quests ---------- */
export function QuestLive() {
  const { st, k, nm, events, update, levelUp } = useCourt();
  const [all, setAll] = useState(false);
  const [qf, setQf] = useState("all");
  // round 12: built-in quests she switched off are hidden here (display only; what quests award is unchanged)
  const aq = activeQ(st, k).filter((q) => !st.questsOff.includes(q.id)), done = aq.filter((q) => isDone(st, q.id)).length;
  const today = eventsOn(events, k);
  const calReady = (re?: RegExp) => !!re && today.some((e) => !e.allDay && re.test(e.t) && e.b <= nm);
  const log = (id: string) => update((d) => { const r = logQuest(d, id); if (r.leveled) levelUp(r.leveled); }, [...QKEYS]);

  let list;
  if (all) {
    const l = ordered(aq, (q) => q.id, st.gedit.quests.order).filter((q) => qf === "all" || q.crew === qf);
    list = l.filter((q) => !isDone(st, q.id)).concat(l.filter((q) => isDone(st, q.id)));
  } else list = openQuests(st, k, nm).filter((q) => !st.questsOff.includes(q.id) && qScore(q, k, nm) < 60 && (q.auto || q.cal || q.calCat)).slice(0, 3);
  const ck = manualOpen(st, k);
  // the Daily anchors quest shows today's live count and target (the same numbers as the Garden's anchors card)
  const anchorItems = st.defs.swins?.phases.find((p) => p.daily)?.items ?? [], k1 = anchorCount(anchorItems, st.gedit, wdOf(k), st.swins.log[k] || []);
  const k1Live = anchorItems.length > 0;

  return (
    <section className="win" id="questWin" aria-labelledby="qT">
      <div className="win-title"><h2 id="qT">Habit Quests</h2><span className="sub" id="qCount">{done}/{aq.length} done</span></div>
      <div className="win-body">
        <div className="qf" id="qf" role="group" aria-label="Filter quests by crew member" hidden={!all}>
          {[["all", "All"], ...["kumo", "olli", "fenn", "luna", "momo", "coco"].map((id) => [id, short(id)])].map(([id, n]) => (
            <button key={id} className="chipb" type="button" aria-pressed={qf === id} onClick={() => setQf(id)}>{n}</button>
          ))}
        </div>
        <div className="quests" id="quests">
          {list.length ? list.map((q) => {
            const live = q.id === "k1" && k1Live, isD = isDone(st, q.id), p = live ? k1.done : progOf(st, q.id), goal = live ? k1.target : q.goal;
            let right: React.ReactNode, cls = "";
            const btn = <button className="btn sm" type="button" onClick={() => log(q.id)}>{q.goal > 1 ? "Log +1" : "Log it"}</button>;
            if (isD) right = <span className="q-end">DONE</span>;
            else if (q.cal) {
              // Calendar quests: confirm once the matching block has ended (Step 4 feeds the events).
              if (calReady(q.cal)) { right = <button className="btn sm" type="button" onClick={() => log(q.id)}>Yes, did it</button>; cls = " ready"; }
              else right = <span className="q-end">AUTO</span>;
            } else if (q.auto) right = <span className="q-end">AUTO</span>;
            else right = btn;
            return (
              <div key={q.id} className={"quest" + (isD ? " done" : "") + cls}>
                <div className="q-ic">
                  <div className="mini"><PixelSprite name={q.crew} /></div>
                  {isD && <span className="ck"><svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>}
                </div>
                <div className="q-t">
                  <b>{questName(st.gedit, q)}</b>
                  <span><span className={q.cad === "Weekly" ? "q-tag wk" : "q-tag"}>{q.cad}</span>{short(q.crew)} · {live ? (k1.target ? `Your ${k1.target} Small Wins anchor${k1.target === 1 ? "" : "s"} for today, ticked in the Garden.` : "No anchors are due today.") : q.sub}{goal > 1 && !isD ? ` (${p}/${goal})` : ""}</span>
                  <span className="q-src">{isD ? (q.auto ? "Counted by Kumo" : "Logged") : live ? (k1.target ? `Counts your anchor ticks, n/${k1.target}` : "Nothing to count today") : q.ck}</span>
                </div>
                <div className="q-r"><span className="xp">+{q.xp} EXP</span>{right}</div>
              </div>
            );
          }) : <div className="empty">Today&apos;s habits are done. Lovely.</div>}
        </div>
        <details className="bdet" id="ckDet" open={nm >= 1200 && ck.length > 0 ? true : undefined}>
          <summary>Evening check-in {ck.length > 0 && <span className="badge" id="ckCount">{ck.length}</span>}</summary>
          <div id="ckBox">
            {ck.length ? <>
              {ck.map((q) => <div className="filed-row" key={q.id}><span>{questName(st.gedit, q)}</span><button className="btn sm" type="button" onClick={() => log(q.id)}>Yes</button></div>)}
              <p className="note">Three at most. The rest logs itself.</p>
            </> : <p className="note">All set for tonight.</p>}
          </div>
        </details>
        <button className="btn sm ghost qmore" type="button" id="qMore" onClick={() => setAll(!all)}>{all ? "Show today's top 3" : `Show all ${aq.length} quests`}</button>
      </div>
    </section>
  );
}

/* ---------- Sakura Garden (v52 bonsaiSvg, drawn the same way) ---------- */
const gslots = [[160, 36], [112, 50], [208, 50], [72, 84], [248, 84], [128, 80], [192, 80], [160, 68], [92, 118], [228, 118], [60, 122], [262, 122], [120, 24], [200, 24], [160, 104], [182, 98]];
const grn = (i: number, j: number) => { const x = Math.sin((i + 1) * 12.9898 + (j + 1) * 78.233) * 43758.5453; return x - Math.floor(x); };
const gcol = (m: string) => m === "wilting" ? { b: "#9C8A7A", p: ["#A58B7B", "#8F7A6B", "#B39A86"], d: 7 } : m === "thirsty" ? { b: "#EBD3D6", p: ["#E9C9CF", "#D9B9BA", "#EBD7CF"], d: 3 } : { b: "#FFC9E0", p: ["#FFB3D1", "#FF8FBF", "#FFD1E8"], d: 0 };

function bonsaiSvg(items: { f: SeedInfo }[], nroots: number) {
  const nodes = [[158, 128], [156, 104], [154, 86]];
  let wil = 0, thi = 0, br = "", cl = "", fl = "", wd = "";
  items.forEach((it) => { if (it.f.mood === "wilting") wil++; else if (it.f.mood === "thirsty") thi++; });
  items.forEach((it, i) => {
    const s = gslots[i % gslots.length], st = it.f.stage, m = it.f.mood, c = gcol(m), R = st === 0 ? 9 : 12 + st * 4, n = st === 0 ? 2 : 4 + st * 2;
    const nd = s[1] > 100 ? nodes[0] : s[1] > 60 ? nodes[1] : nodes[2];
    let g = "";
    br += `<path d="M${nd[0]} ${nd[1]} Q${Math.round((nd[0] + s[0]) / 2)} ${Math.min(nd[1], s[1]) - 10} ${s[0]} ${s[1] + c.d}" stroke="${wil > 2 ? "#6B4B3E" : "#8A5A44"}" stroke-width="${st > 1 ? 4 : 3}" fill="none" stroke-linecap="round"/>`;
    if (st > 0) g += `<circle r="${R}" fill="${c.b}" opacity=".6"/>`;
    for (let j = 0; j < n; j++) {
      const a = grn(i, j) * 6.283, rd = Math.sqrt(grn(j, i + 7)) * R * 0.85, x = Math.cos(a) * rd, y = Math.sin(a) * rd, r = st === 0 ? 3.4 : 3 + grn(i + 3, j) * 1.6;
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.p[j % 3]}"/>`;
      if (m === "ok" && st > 0 && j % 3 === 0) g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1" fill="#FFE27A"/>`;
    }
    if (m === "wilting") {
      for (let j = 0; j < 3; j++) g += `<circle cx="${((grn(i, j + 20) - 0.5) * R * 1.3).toFixed(1)}" cy="${((grn(j + 20, i) - 0.5) * R * 1.3).toFixed(1)}" r="2.4" fill="#7A8B52"/>`;
      g += `<circle cx="0" cy="${(R * 0.5).toFixed(1)}" r="2" fill="#5E5148"/>`;
    }
    cl += `<g transform="translate(${s[0]} ${s[1] + c.d})"><g class="${m === "ok" ? "sway" : ""}">${g}</g></g>`;
    if (m !== "ok") fl += `<ellipse cx="${Math.round(72 + grn(i, 40) * 176)}" cy="${238 + Math.round(grn(i, 41) * 4)}" rx="4" ry="2" fill="${c.p[0]}" transform="rotate(${Math.round(grn(i, 42) * 60 - 30)} 160 238)"/>`;
  });
  for (let i = 0; i < Math.min(nroots, 6); i++) { const wx = i < 3 ? 64 + i * 14 : 214 + (i - 3) * 14; wd += `<path d="M${wx} 238 q3 -10 -2 -17 M${wx} 238 q6 -8 6 -15" stroke="#5B4A55" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; }
  const mood = wil ? "sad" : thi ? "meh" : "happy", eye = "#6B4B6B";
  const face = `<circle cx="143" cy="215" r="2.4" fill="${eye}"/><circle cx="177" cy="215" r="2.4" fill="${eye}"/><ellipse cx="136" cy="221" rx="4" ry="2.4" fill="#FF8FBF" opacity=".6"/><ellipse cx="184" cy="221" rx="4" ry="2.4" fill="#FF8FBF" opacity=".6"/>` +
    (mood === "happy" ? `<path d="M152 220 q8 8 16 0" stroke="${eye}" stroke-width="2" fill="none" stroke-linecap="round"/>` : mood === "meh" ? `<path d="M153 224 h14" stroke="${eye}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M152 227 q8 -8 16 0" stroke="${eye}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  const trunk = wil > 2 ? "#6B4B3E" : "#8A5A44", mold = wil ? '<circle cx="153" cy="166" r="3" fill="#6F7F4A"/><circle cx="160" cy="150" r="2.2" fill="#5E5148"/><circle cx="156" cy="180" r="2.6" fill="#7A8B52"/>' : "";
  return `<svg class="bonsai" viewBox="0 0 320 250" role="img" aria-label="Sakura bonsai. ${items.length - wil - thi} habits blooming, ${thi} thirsty, ${wil} rotting."><ellipse cx="160" cy="241" rx="108" ry="6" fill="#8B6B5A" opacity=".3"/>${wd}` +
    `<path d="M154 194 C150 160 168 142 158 112 C154 98 150 92 155 80" stroke="${trunk}" stroke-width="12" fill="none" stroke-linecap="round"/>${mold}${br}${cl}` +
    `<ellipse cx="160" cy="193" rx="52" ry="5" fill="#8B6B5A"/><path d="M114 196 H206 L198 234 Q197 238 192 238 H128 Q123 238 122 234 Z" fill="#F4A6C6" stroke="#A34876" stroke-width="2.5" stroke-linejoin="round"/><rect x="108" y="190" width="104" height="12" rx="5" fill="#F8BDD6" stroke="#A34876" stroke-width="2.5"/>${face}${fl}</svg>`;
}

// Garden (docs/build-dashboard-v2.md section 4): eight branches = the eight grid pillars, trunk = daily
// anchors. Decay is computed from real watering events only; typed weeds and habits now live in the
// Diary archive. Tone is gentle: the tree reflects habits, never her worth.
const STAGE_TXT: Record<string, string> = { sprout: "sprout, waiting for its first activity", blooming: "blooming", thirsty: "thirsty", wilting: "wilting", withered: "withered", dead: "bare, ready to weed out" };

// extra: more segments for the New-look Garden page (wins ladder, her own habits, the week).
const STAGE_NAMES = ["Bare", "Sprout", "Leafy", "Blossoming", "Full bloom"];

/** One branch on the Branches card with its progress background (round 16: the share drives the fill width). */
export function BranchRow({ b, k, children }: { b: Branch & { seen?: string | null }; k: string; children?: React.ReactNode }) {
  const bp = branchProgress(b, k);
  return (
    <div className="gk" data-st={b.stage === "blooming" || b.stage === "sprout" ? "ok" : b.stage === "thirsty" ? "thirsty" : "wilting"} data-bp={bp.state} style={{ "--bp": Math.round(bp.share * 100) + "%" } as React.CSSProperties}>
      <span className="gnm"><b>{b.n}. {b.name}</b><small>{STAGE_TXT[b.stage]} · {b.blossoms}/8 blossoms{b.last ? ` · last ${prettyDay(b.last)}` : ""}</small></span>
      {children}
    </div>
  );
}

export function GardenLive({ slots = {} }: { slots?: { habits?: React.ReactNode; quests?: React.ReactNode; wins?: React.ReactNode; pick?: React.ReactNode } }) {
  const { st, k, update, levelUp } = useCourt();
  const [evs, setEvs] = useState<WaterEvt[] | null>(null);
  const [ledger, setLedger] = useState<{ trades: Record<string, unknown>[]; plans: Record<string, unknown>[] } | null>(null);
  const [arm, setArm] = useState("");
  const ui = useUi();
  useEffect(() => {
    getOnce<any>("/api/water?days=30").then((j) => setEvs(Array.isArray(j.events) ? j.events : [])).catch(() => setEvs([]));
    getOnce<any>("/api/ledger").then((j) => j.trades && setLedger(j)).catch(() => {});
  }, []);

  const { trunk, list: raw } = branches(st, k, evs ?? []);
  // round 12: Branches follow the chart she edits, for the year chosen on the Branches card
  const [byear, setByear] = useState<"2026" | "2027">("2026");
  const list = chartBranches(raw, st, byear, evs ?? []);
  const anchors = st.defs.swins?.phases.find((p) => p.daily)?.items ?? [];
  const todayA = st.swins.log[k] || [];
  const aCount = anchorCount(anchors, st.gedit, wdOf(k), todayA);
  // round 14: when Edit garden lowers today's target to what is already ticked, the quest finishes now (through
  // logQuest, as a tick would), not at the next tick
  useEffect(() => {
    if (anchors.length && aCount.target > 0 && aCount.done >= aCount.target && !isDone(st, "k1")) {
      update((d) => { if (isDone(d, "k1")) return; d.q.k1 = [0, (QUESTS.find((q) => q.id === "k1")?.goal ?? 8) - 1]; const r = logQuest(d, "k1"); if (r.leveled) levelUp(r.leveled); }, [...QKEYS]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aCount.done, aCount.target, k]);

  // Merged quests, AUTO from real records (docs/build-trackers.md, duplicates 1 to 3).
  useEffect(() => {
    if (!evs) return;
    const today = (src: string) => evs.some((e) => e.source === src && sgtKeyOf(e.at) === k);
    const wk = weekKey(k);
    const want: string[] = [];
    if (today("spending") && !isDone(st, "c1")) want.push("c1");
    if (st.money.done.r2 && st.money.upd === k && !isDone(st, "c2")) want.push("c2");
    if (ledger) {
      const nine = [...ledger.trades, ...ledger.plans].some((r) => r.date === k && (r.rules === 9 || (r.checks && typeof r.checks === "object" && Object.values(r.checks as object).filter(Boolean).length >= 9)));
      if (nine && !isDone(st, "f1")) want.push("f1");
      if (ledger.plans.some((p) => String(p.date ?? "") >= wk && p.thesis) && !isDone(st, "o2")) want.push("o2");
    }
    if (want.length) update((d) => { for (const id of want) { const r = logQuest(d, id); if (r.leveled) levelUp(r.leveled); } }, [...QKEYS]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evs, ledger, k]);

  const tickAnchor = (id: string, on: boolean) => {
    update((d) => {
      const cur = new Set(d.swins.log[k] || []);
      if (on) cur.add(id); else cur.delete(id);
      d.swins.log = { ...d.swins.log, [k]: [...cur] };
      // round 14: the target is the anchors scheduled and shown today (8 unless she hid or rescheduled some). Only
      // the count changes: finishing still goes through logQuest, so XP, stars and streak are awarded as before.
      if (!isDone(d, "k1")) {
        const c = anchorCount(anchors, d.gedit, wdOf(k), [...cur]), goal = QUESTS.find((q) => q.id === "k1")?.goal ?? 8;
        if (c.target > 0 && c.done >= c.target) { d.q.k1 = [0, goal - 1]; const r = logQuest(d, "k1"); if (r.leveled) levelUp(r.leveled); }
        else if (c.done > 0) d.q.k1 = [0, c.done]; else delete d.q.k1;
      }
    }, ["swins", ...QKEYS]);
    water("anchor", `anchor:${id}:${k}`, on);
    setEvs((e) => on ? [{ at: new Date().toISOString(), source: "anchor", ref: `anchor:${id}:${k}`, weight: 1 }, ...(e ?? [])] : (e ?? []).filter((x) => x.ref !== `anchor:${id}:${k}`));
  };
  const weedOut = (n: number) => {
    if (arm !== String(n)) { setArm(String(n)); window.setTimeout(() => setArm((a) => (a === String(n) ? "" : a)), 4000); return; }
    update((d) => { d.gd.weed = { ...(d.gd.weed ?? {}), [String(n)]: k }; }, ["gd"]);
  };

  // Reuse the v52 bonsai drawing: one cluster per branch, size from blossoms, colour from decay.
  const items = list.map((b) => ({ f: { n: 0, run: 0, pts: 0, wet: false, idle: b.idle, stage: Math.min(4, Math.ceil(b.blossoms / 2)), mood: (b.stage === "blooming" || b.stage === "sprout" ? "ok" : b.stage === "thirsty" ? "thirsty" : "wilting") as SeedInfo["mood"] } }));
  const care = [trunk, ...list].filter(needsCare);
  const blossoms = list.reduce((a, b) => a + b.blossoms, 0);
  const wkh = weekHab(st, k);
  const petals = ["swins", "money", "samsara"].reduce((a, key) => a + Object.values((st[key as "swins"]).done).filter(Boolean).length, 0);

  const head = <>
    <h3><Mini name="coco" />Sakura Garden <span className="cnj">灵园</span></h3>
    <p className="gtag">Eight branches, one per grid pillar. Real activity waters them; each ticked actionable opens a blossom that stays.</p>
    <div dangerouslySetInnerHTML={{ __html: bonsaiSvg(items, 0) }} />
    <p className="gsum"><b>{blossoms}</b> of 64 blossoms · <b>{petals}</b> golden petals from ladder milestones{trunk.resting ? " · resting today, decay paused" : ""}</p>
    {evs == null && <p className="note">Reading your activity…</p>}
  </>;
  // round 13: her names, order, times and days from Edit garden; folded-away anchors keep their ticks. Her own
  // anchors tick in gedit and award nothing; the imported ones tick exactly as before.
  const arows = anchorRows(anchors, st.gedit, wdOf(k)).shown, aToday = arows.filter((a) => a.on), aRest = arows.filter((a) => !a.on);
  const mineA = st.gedit.anchors.log[k] ?? [];
  const tickMine = (id: string, on: boolean) => update((d) => { const cur = new Set(d.gedit.anchors.log[k] ?? []); if (on) cur.add(id); else cur.delete(id); d.gedit = { ...d.gedit, anchors: { ...d.gedit.anchors, log: { ...d.gedit.anchors.log, [k]: [...cur] } } }; }, ["gedit"]);
  const anchorList = <>
    {aToday.length ? <div className="ganchors">{aToday.map((a) => (
      <label className="filed-row" key={a.id}><input type="checkbox" checked={a.mine ? mineA.includes(a.id) : todayA.includes(a.id)} onChange={(e) => (a.mine ? tickMine : tickAnchor)(a.id, e.target.checked)} /><span>{a.at && <span className="kanc-at">{a.at}</span>}{a.t} <span className="note">{a.d}</span></span></label>
    ))}</div> : <p className="note">{arows.length ? "No anchors set for today." : anchors.length ? "Your anchors are folded away; Edit garden brings them back." : "Your daily anchors arrive with the tracker import."}</p>}
    {aRest.length > 0 && <p className="note">Not today: {aRest.map((a) => a.t).join(" · ")}</p>}
    <p className="note">Trunk: {STAGE_TXT[trunk.stage]}{trunk.last ? `, last watered ${prettyDay(trunk.last)}` : ""}.</p>
  </>;
  // round 13/14: a progress background per branch (grey: never started, faint tint: quiet this week, green: active
  // this week, gold edge: done)
  const branchList = <div className="gbranches">{list.map((b) => (
    <BranchRow b={b} k={k} key={b.n}>
      {b.stage === "dead" && <button className="btn sm ghost gx" type="button" onClick={() => weedOut(b.n)}>{arm === String(b.n) ? "Yes, weed it out" : "Weed it out"}</button>}
    </BranchRow>
  ))}</div>;
  const nudge = care.length > 0 && <>
    <div className="sec-h">A gentle nudge</div>
    {care.slice(0, 3).map((b) => <p className="note" key={b.n}><Mini name={NUDGE[b.n].crew} sm /> {b.n ? b.name : "Trunk"}: {NUDGE[b.n].t}</p>)}
    <p className="note">Any real activity revives a branch at once. Weeding a bare branch regrows a sprout; blossoms and history are never lost.</p>
  </>;

  // New look (round 7, round 8: no banner; the garden sits straight on the page, no box) the pixel sakura garden is the hero, growing through the week from real activity (quests,
  // anchors and her own habits: more blossoms and petals as the week fills), with one line of this week's progress
  // and any gentle nudge under it. Below, two columns of cards: Daily anchors and My habits; Branches, Quests (with
  // Kumo's pick and her habits for today) and the Wins ladder. The tails live with the fox in the world.
  if (ui === "new") {
    const hw = habitWeek(st, k);
    // round 10 (D1): grow on real activity counted this week, not on a share of everything possible (which kept
    // the tree a seed in normal weeks): quests done, anchor ticks and her own habits ticked.
    const got = wkh.d + hw.done + hw.anchors;
    const stage = gardenStage(got), fill = Math.min(1, got / GROW_AT[4]);
    const wilt = evs == null ? 0 : wiltOf(trunk.idle);
    return (
      <div id="gardenBox" className="kgarden-page">
        {/* round 12: the pixel sakura bonsai is the centrepiece. Stage from this week's real ticks (round 10 rule),
            wilting drawn from the trunk's days without activity (decay rules unchanged), golden petals for milestones */}
        <section className="kgarden-hero" aria-label="Sakura garden">
          <GardenTree stage={stage} wilt={wilt} gold={petals} petals={Math.round(fill * 6)} label={`Sakura bonsai: ${STAGE_NAMES[stage].toLowerCase()} this week${wilt ? ", " + WILT_CAPTION[wilt].toLowerCase() : ""}`} />
          <p className="kgarden-line">This week: <b>{got}</b> tick{got === 1 ? "" : "s"} ({wkh.d} quests · {hw.anchors} anchors{hw.planned ? ` · ${hw.done} of your habits` : ""}) · {STAGE_NAMES[stage]}{stage < 4 ? <span className="note"> · next stage at {GROW_AT[stage + 1] - got} more tick{GROW_AT[stage + 1] - got === 1 ? "" : "s"}</span> : null}{trunk.resting ? " · resting today" : ""}</p>
          {wilt > 0 && <p className="note kgarden-cap">{WILT_CAPTION[wilt]}</p>}
          {evs == null && <p className="note">Reading your activity…</p>}
          {care.length > 0 && <div className="kgarden-nudge">{care.slice(0, 3).map((b) => <p className="note" key={b.n}><Mini name={NUDGE[b.n].crew} sm /> <span><b>{b.n ? b.name : "Trunk"}</b>: {NUDGE[b.n].t}</span></p>)}</div>}
        </section>
        {/* round 8: one grid, so cards in a row share their top, bottom and width (left: anchors, habits; right:
            branches, quests); the Wins ladder spans the width below */}
        <div className="kpg two kgarden-cards">
          <GCard title="Daily anchors" sub={`${aCount.done}/${anchors.length ? aCount.target : 8} today · waters the trunk`}>{anchorList}</GCard>
          <GCard title="Branches" sub={`${blossoms} of 64 blossoms`} actions={<div className="kseg" role="group" aria-label="Chart year">{(["2026", "2027"] as const).map((y) => <button key={y} type="button" aria-pressed={byear === y} className={byear === y ? "on" : ""} onClick={() => setByear(y)}>{y}</button>)}</div>}>{branchList}<p className="note">Any real activity revives a branch at once. Weeding a bare branch regrows a sprout; blossoms and history are never lost.</p></GCard>
          {slots.habits}
          <GCard title="Quests">{slots.pick}<div id="gQuestSlot"><QuestLive /></div>{slots.quests}</GCard>
          {slots.wins}
        </div>
      </div>
    );
  }
  return (
    <div id="gardenBox">
      <GardenScene list={list} />
      <div className="tcard garden">
        {head}
        <div className="sec-h">Daily anchors <span className="note">{aCount.done}/{anchors.length ? aCount.target : 8} today · waters the trunk</span></div>
        {anchorList}
        <div className="sec-h">Branches</div>
        {branchList}
        {nudge}
        <div id="gQuestSlot"><QuestLive /></div>
        <details className="pillar"><summary><b>Kumo&apos;s nine tails</b> <span className="note">{earned(st, k).filter(Boolean).length}/9</span></summary>
          {TAILS.map((t, i) => <div className="filed-row" key={t.n}><span>{earned(st, k)[i] ? "✓ " : ""}<b>{t.n}</b> <span className="note">{t.h}</span></span></div>)}
        </details>
      </div>
    </div>
  );
}

function winLines(st: CourtState, k: string) {
  const T = winTally(st, k), auto = dayQ(k).filter((q) => isDone(st, q.id)).map((q) => q.title), L: string[] = [];
  const C = ["You did something real today.", "That is progress, not luck.", "Showing up counts, and you showed up.", "You are building this one day at a time.", "Proud of you. Keep going.", "You are doing better than you think."];
  const c = C[dayIdx(k) % C.length];
  if (T.td > 0) L.push(`Today I finished ${T.td} of ${T.tt} daily quests: ${auto.slice(0, 3).join(", ")}${auto.length > 3 ? ` and ${auto.length - 3} more` : ""}. ${c}`);
  if (T.yd && T.yd.d > 0) L.push(`Yesterday I finished ${T.yd.d} of ${T.yd.t} daily quests.`);
  return L;
}

// Guided Gratitude sheet (v2 section 5; renamed in round 11): opens at 21:30 or on demand. Step 1 counts the
// same real events that water the garden; steps 2 and 3 are her own words, private, saved under wins (the same
// key, quest and XP behaviour as before; only the name changed). The Dungeon keeps them as the Gratitude log.
export function WinsLive({ onDone }: { onDone?: () => void }) {
  const { st, k, nm, update } = useCourt();
  const saved = st.wins[k] ?? {};
  const [w, setW] = useState(saved.w ?? "");
  const [g, setG] = useState(saved.g ?? "");
  const [n, setN] = useState(saved.n ?? "");
  const [step, setStep] = useState(0);
  const [evs, setEvs] = useState<WaterEvt[] | null>(null);
  useEffect(() => { fetch("/api/water?days=1").then((r) => r.json()).then((j) => setEvs(Array.isArray(j.events) ? j.events : [])).catch(() => setEvs([])); }, []);
  const late = nm >= 1080, T = winTally(st, k), sug = winLines(st, k);
  const today = (evs ?? []).filter((e) => sgtKeyOf(e.at) === k);
  const cnt = (src: string) => today.filter((e) => e.source === src).length;
  const rows: [string, string][] = [
    ["Daily quests", `${T.td} of ${T.tt}`],
    ["Daily anchors", (() => { const a = st.defs.swins?.phases.find((p) => p.daily)?.items ?? [], c = anchorCount(a, st.gedit, wdOf(k), st.swins.log[k] || []); return `${c.done} of ${a.length ? c.target : 8}`; })()],
    ["Grid actions ticked", String(cnt("grid"))],
    ["Milestones", String(cnt("milestone"))],
    ["Plans and trades logged", String(cnt("plan") + cnt("trade"))],
    ["Spending lines", String(cnt("spending"))],
    ["Posts this week", String(T.posts)],
    ["Streak", `${st.streak} day${st.streak === 1 ? "" : "s"}`],
  ];
  const save = () => { update((d) => { d.wins[k] = { ...d.wins[k], w: w.slice(0, 2000), g: g.slice(0, 2000), n: n.slice(0, 6000) }; }, ["wins"]); };
  return (
    <div id="winBox">
      <div className="tcard" id="winCard">
        <h3><Mini name="coco" />{late ? "Tonight's gratitude" : "Today's gratitude"} <span className="note">step {step + 1} of 3</span></h3>
        {step === 0 && <>
          <p className="note">Here is what you really did today, counted from your own records.</p>
          {evs == null ? <p className="note">Counting…</p> : rows.map(([a, b]) => <div className="filed-row" key={a}><span>{a}</span><b>{b}</b></div>)}
          <div className="rep-act"><button className="btn sm" type="button" onClick={() => setStep(1)}>Next</button></div>
        </>}
        {step === 1 && <div className="field wr">
          <label htmlFor="winIn">What went well</label>
          <textarea id="winIn" rows={3} maxLength={2000} placeholder={sug[0] ?? "Small counts"} value={w} onChange={(e) => setW(e.target.value)} />
          <label htmlFor="gratIn">What I'm grateful for</label>
          <textarea id="gratIn" rows={3} maxLength={2000} placeholder="A person, a moment, a thing" value={g} onChange={(e) => setG(e.target.value)} />
          <div className="rep-act"><button className="btn sm ghost" type="button" onClick={() => setStep(0)}>Back</button><button className="btn sm" type="button" onClick={() => setStep(2)}>Next</button></div>
        </div>}
        {step === 2 && <div className="field wr">
          <label htmlFor="noteIn">Write freely (optional)</label>
          <textarea id="noteIn" rows={8} maxLength={6000} placeholder="Whatever is on your mind. Nobody is reading but you." value={n} onChange={(e) => setN(e.target.value)} />
          <div className="rep-act"><button className="btn sm ghost" type="button" onClick={() => setStep(1)}>Back</button><button className="btn sm" type="button" onClick={() => { save(); setStep(3); }}>Save to my diary</button></div>
        </div>}
        {step === 3 && <>
          <p className="note">Saved to your Gratitude log. Private to you, never shown to friends.</p>
          <div className="rep-act">{onDone && <button className="btn sm" type="button" onClick={onDone}>Close</button>}<button className="btn sm ghost" type="button" onClick={() => setStep(0)}>Look again</button></div>
        </>}
      </div>
    </div>
  );
}

// Diary tab: the sheet on demand, instead of a permanent block.
export function WinsButton() {
  const { st, k, openSheet } = useCourt();
  return (
    <div className="tcard">
      <h3><Mini name="coco" />Tonight&apos;s gratitude</h3>
      <p className="note">{st.wins[k] ? "Saved for today. You can look again or add more." : "Opens by itself at 21:30, or any time now."}</p>
      <div className="rep-act"><button className="btn sm" type="button" onClick={() => openSheet({ kind: "wins" })}>Gratitude</button></div>
    </div>
  );
}

/* ---------- Dungeon and weekly recap ---------- */
const MOODS = ["Low", "Flat", "Okay", "Good", "Bright"];

function diaryDays(st: CourtState, k: string) {
  const seen = new Set<string>();
  return [...Object.keys(st.wins), ...Object.keys(st.mood), ...Object.keys(st.days), k]
    .filter((d) => (seen.has(d) ? false : (seen.add(d), true))).sort().reverse();
}

export function downloadDiary(st: CourtState, k: string) {
  const lines = ["# Dungeon", "", `Exported ${k}. Private to you.`, ""];
  for (const d of diaryDays(st, k)) {
    const w = st.wins[d] ?? {}, m = st.mood[d];
    if (!w.w && !w.g && !w.n && !m) continue;
    lines.push(`## ${prettyDay(d)} (${d})`);
    if (m) lines.push(`Feeling: ${MOODS[(m.m || 3) - 1]}${m.n ? ", " + m.n : ""}`);
    if (w.w) lines.push(`Went well: ${w.w}`);
    if (w.g) lines.push(`Grateful for: ${w.g}`);
    if (w.n) lines.push("", w.n);
    lines.push("");
  }
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
  const a = document.createElement("a"); a.href = url; a.download = `dungeon-${k}.md`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DiaryEdit({ day, onDone }: { day: string; onDone: () => void }) {
  const { st, update } = useCourt();
  const e0 = st.wins[day] ?? {};
  const [w, setW] = useState(e0.w ?? ""), [g, setG] = useState(e0.g ?? ""), [n, setN] = useState(e0.n ?? "");
  return (
    <form className="field wr" onSubmit={(e) => { e.preventDefault(); update((d) => { d.wins[day] = { ...d.wins[day], w: w.slice(0, 2000), g: g.slice(0, 2000), n: n.slice(0, 6000) }; }, ["wins"]); onDone(); }}>
      <label>What went well<textarea rows={2} maxLength={2000} value={w} onChange={(e) => setW(e.target.value)} /></label>
      <label>What I&apos;m grateful for<textarea rows={2} maxLength={2000} value={g} onChange={(e) => setG(e.target.value)} /></label>
      <label>Notes<textarea rows={5} maxLength={6000} value={n} onChange={(e) => setN(e.target.value)} /></label>
      <div className="rep-act"><button className="btn sm" type="submit">Save</button><button className="btn sm ghost" type="button" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function DiaryLive({ open }: { open?: boolean }) {
  const { st, k } = useCourt();
  const [joyI, setJoyI] = useState(0);
  const [edit, setEdit] = useState("");
  const auto = dayQ(k).filter((q) => isDone(st, q.id)).map((q) => q.title), T = winTally(st, k);

  const praise: string[] = [];
  Object.keys(st.wins).sort().reverse().forEach((d) => { const e = st.wins[d]; if (e.w) praise.push(`${prettyDay(d)}, you wrote: "${e.w}"`); if (e.g) praise.push(`${prettyDay(d)}, you were grateful for: "${e.g}"`); });
  if (T.wsum > 0) praise.push(`This week you have finished ${T.wsum} quests. Nobody made you. You did.`);
  if (st.streak > 1) praise.push(`${st.streak} days in a row. You keep coming back, and that is the whole secret.`);
  praise.push("You are building a business, a brand and a mind that sees far ahead. That is not nothing.");

  // This week (v52 joyWeek): the weekly recap.
  const wk = weekKey(k);
  let days = 0, done = 0, tot = 0, bestN = 0, bestK = "", wd = 0;
  const ms: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(wk, i); if (d > k) break; days++;
    const r = d === k ? { d: auto.length, t: dayQ(k).length } : st.days[d];
    if (r) { done += r.d; tot += r.t; if (r.d > bestN) { bestN = r.d; bestK = d; } }
    if (st.wins[d]?.w || st.wins[d]?.g) wd++;
    if (st.mood[d]) ms.push(st.mood[d].m);
  }
  const gw = gardenWeek(st, k);
  let wn = 0, gn = 0; Object.values(st.wins).forEach((e) => { if (e.w) wn++; if (e.g) gn++; });
  const pc = tot ? done / tot : 0;
  const say = pc >= 0.7 ? "A strong week. You earned the rest evening." : pc >= 0.4 ? "A solid week. Steady beats loud." : done > 0 ? "A quieter week, and you still showed up. That counts." : "The week has barely started. One small thing is enough.";

  const cells = []; let best = 0, bk = "";
  for (let i = 27; i >= 0; i--) {
    const d = addDays(k, -i), r = d === k ? { d: auto.length, t: dayQ(k).length } : st.days[d], p = r && r.t ? Math.round((r.d / r.t) * 100) : -1;
    if (r && r.d > best) { best = r.d; bk = d; }
    cells.push(<span key={d} className="jc" style={{ "--p": p > 0 ? Math.round(35 + p * 0.65) : 0 } as React.CSSProperties} title={prettyDay(d) + (p < 0 ? ": no record" : `: ${r!.d} of ${r!.t}`)} data-e={p < 0 ? "1" : undefined}></span>);
  }
  const mk = Object.keys(st.mood).sort().slice(-14);
  const rows = diaryDays(st, k).slice(0, 30).map((d) => ({ d, w: st.wins[d] ?? {}, m: st.mood[d], r: d === k ? { d: auto.length, t: dayQ(k).length, n: auto } : st.days[d] }))
    .filter((x) => x.w.w || x.w.g || x.w.n || x.m || (x.r && x.r.d > 0));

  return (
    <details className="gdet" id="gdJoy" open={open}><summary>Diary and weekly recap</summary><div id="joyBox">
      <div className="tcard joy">
        <h3><span className="mini dicon"><DungeonIcon /></span>Dungeon <span className="cnj">地牢</span></h3>
        <div className="joyhero">
          <p className="joyq" id="joyQ">{praise[joyI % praise.length]}</p>
          <div className="rep-act">
            <button className="btn sm" type="button" onClick={() => setJoyI(joyI + 1)}>Tell me something good</button>
            <button className="btn sm ghost" type="button" onClick={() => { const el = document.getElementById("winIn"); el?.scrollIntoView({ block: "center" }); el?.focus(); }}>Log today</button>
            <button className="btn sm ghost" type="button" onClick={() => downloadDiary(st, k)}>Download my diary</button>
          </div>
        </div>
        <div className="sec-h">This week</div>
        <div className="jp" id="recapWeek"><ul className="jwk">
          <li>{done} of {tot} daily quests done over {days} day{days === 1 ? "" : "s"}</li>
          {bestN > 0 && <li>Best day: {prettyDay(bestK)} with {bestN}</li>}
          {wd > 0 && <li>{wd} day{wd === 1 ? "" : "s"} with gratitude written</li>}
          {gw.water > 0 && <li>{gw.water} seed watering{gw.water === 1 ? "" : "s"} in the garden</li>}
          {gw.rel > 0 && <li>{gw.rel} thing{gw.rel === 1 ? "" : "s"} let go. That is progress too.</li>}
          <li>{st.streak}-day streak · {wn} things that went well and {gn} things you are grateful for, logged so far</li>
          {T.posts > 0 && <li>{T.posts} post{T.posts === 1 ? "" : "s"} counted</li>}
          {ms.length > 0 && <li>Average mood {(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(1)} of 5</li>}
        </ul><p><b>{say}</b></p></div>
        <div className="sec-h">Last 28 days</div>
        <div className="jstrip" role="img" aria-label="Quest completion over the last 28 days, darker is more">{cells}</div>
        <p className="jleg"><span>less</span><span className="jc" style={{ "--p": 10 } as React.CSSProperties}></span><span className="jc" style={{ "--p": 50 } as React.CSSProperties}></span><span className="jc" style={{ "--p": 100 } as React.CSSProperties}></span><span>more</span>{best > 0 && <> · best day {prettyDay(bk)} ({best})</>}</p>
        {mk.length > 0 && <>
          <div className="sec-h">Feelings, last {mk.length} days</div>
          <div className="jmood" role="img" aria-label="Mood per day">{mk.map((d) => <span key={d} className="jm" style={{ "--h": st.mood[d].m * 20 + "%" } as React.CSSProperties} title={`${prettyDay(d)}: ${MOODS[st.mood[d].m - 1]}`}></span>)}</div>
        </>}
        <div className="sec-h">Your diary</div>
        <p className="note xd">Private to you. Never shown to friends. Included in Export my data.</p>
        {!rows.length && <p className="note">Your first page appears when you log a win, a feeling or finish a quest.</p>}
        {rows.map((x) => (
          <article className="jp" key={x.d}>
            <header><b>{prettyDay(x.d)}{x.d === k ? " (today)" : ""}</b>{x.m && <span className="pillx">{MOODS[x.m.m - 1]}</span>}{x.r && x.r.t > 0 && <span className="pillx">{x.r.d} of {x.r.t} quests</span>}</header>
            {edit === x.d ? <DiaryEdit day={x.d} onDone={() => setEdit("")} /> : <>
              {x.w.w && <p><span className="jl">win</span> {x.w.w}</p>}
              {x.w.g && <p><span className="jl">thanks</span> {x.w.g}</p>}
              {x.w.n && <p className="pre"><span className="jl">notes</span> {x.w.n}</p>}
              {x.m?.n && <p><span className="jl">feeling</span> {x.m.n}</p>}
              {x.r?.n && x.r.n.length > 0 && <p className="jn">{x.r.n.join(" · ")}</p>}
              <div className="rep-act"><button className="btn sm ghost" type="button" onClick={() => setEdit(x.d)}>Edit</button></div>
            </>}
          </article>
        ))}
        <Archive />
      </div>
    </div></details>
  );
}

// Read-only archive of the old typed habits and weeds (removed from the Garden; nothing deleted).
export function Archive() {
  const { st } = useCourt();
  const g = st.gd, habits = g.seeds.filter((s) => !s.q);
  if (!habits.length && !g.roots.length && !g.gone.length) return null;
  return (
    <details className="pillar"><summary><b>Archive</b> <span className="note">old habits and weeds, read only</span></summary>
      {habits.length > 0 && <><p className="note">Habits you planted</p>{habits.map((h) => <div className="filed-row" key={h.id}><span>{h.name} <span className="note">since {prettyDay(h.at)} · watered {Object.keys(h.w || {}).length} days</span></span></div>)}</>}
      {g.roots.length > 0 && <><p className="note">Weeds you named</p>{g.roots.map((r) => <div className="filed-row" key={r.id}><span>{r.name} <span className="note">{prettyDay(r.at)}</span></span></div>)}</>}
      {g.gone.length > 0 && <><p className="note">Let go or pulled out</p>{g.gone.map((x, i) => <div className="filed-row" key={i}><span>{x.name} <span className="note">{x.kind === "root" ? "pulled" : "let go"} {prettyDay(x.on)}</span></span></div>)}</>}
    </details>
  );
}

/* ---------- You (v52 status card: "You · The Queen") ---------- */
export function StatusLive() {
  const { st, k, save } = useCourt();
  const need = needFor(st.lvl), wh = weekHab(st, k);
  return (
    <section className="win status" aria-label="Your status">
      <div className="lvbadge"><small>LV</small><b id="lv">{st.lvl}</b></div>
      <div>
        <p className="who-line"><svg className="crown" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l1.5-10 5 4.5L12 5l2.5 7.5 5-4.5L21 18z" fill="#FFD95E" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg>You <span>· The Queen</span></p>
        <p className="realm" id="realm">{st.stars} stars · {st.streak} day streak</p>
        <div className="bars">
          <div className="bar exp"><label>EXP <em id="expTxt">{st.xp} / {need}</em></label><div className="track"><i id="expBar" style={{ width: (st.xp / need) * 100 + "%" }}></i></div></div>
          <div className="bar mp vf"><label>Habits this week <em id="mpTxt">{wh.d} / {wh.t}</em></label><div className="track"><i id="mpBar" style={{ width: (wh.t ? (wh.d / wh.t) * 100 : 0) + "%" }}></i></div></div>
        </div>
        <p className="note xd">{save === "saving" ? "Saving..." : save === "saved" ? "All changes saved." : save === "offline" ? "Not saved yet. I will try again shortly." : "Your data, private to you."}</p>
      </div>
    </section>
  );
}

export { QUESTS };

// New look only (hidden in Classic): the garden as a scene. Backdrop = asset pack layers; the decorations and
// the eight branch trees are code-drawn pixel art (prototype). Each tree's stage uses the same blossom count
// as the bonsai above (0 to 4); nothing here writes anything.
function GardenScene({ list }: { list: Branch[] }) {
  return (
    <section className="gscene" aria-label="Garden scene">
      <div className="gscene-view" aria-hidden="true">
        <div className="gscene-bg" />
        <DecorSprite id="lantern" className="gdec gdec-l" />
        <DecorSprite id="flowers" className="gdec gdec-f1" />
        <DecorSprite id="mushroom" className="gdec gdec-m" />
        <DecorSprite id="flowers" className="gdec gdec-f2" />
        <DecorSprite id="lantern" className="gdec gdec-r" />
        <span className="gscene-tag">Prototype art</span>
      </div>
      <ol className="gtrees">
        {list.map((b) => {
          const stage = Math.min(4, Math.ceil(b.blossoms / 2));
          return (
            <li key={b.n} className={"gtree gt-" + b.stage}>
              <DecorSprite id={"sakura_" + stage} className="gtree-art" />
              <b>{b.name}</b>
              <span className="note">{b.blossoms}/8 · {b.stage}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
