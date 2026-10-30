"use client";

import { useState } from "react";
import { QUESTS } from "@/lib/court/quests";
import { wdName, wdOf } from "@/lib/court/time";
import { newId } from "@/lib/vault";
import { LABEL_MAX, MINE_MAX, MY_ANCHOR, MY_MILESTONE, NAME_MAX, TARGET_MAX, anchorRows, ladderItems, moveShown, myMilestones, ordered, split, toggle, type AnchorMeta, type Freq, type GardenEdit } from "@/lib/court/gardenEdit";
import type { CourtState, PItem } from "@/lib/court/state";
import { useCourt } from "../CourtState";
import { Btn, TabPills } from "../ui";

// Round 13: one "Edit garden" panel with four tabs (Habits, Quests, Anchors, Wins ladder). Rename, reorder, fold
// away and unfold; anchors also get a time of day and days. Hiding folds an item away and never deletes it: its
// ticks and history stay and still export. My habits stays the only place to add a habit. Nothing here changes
// XP, stars, streak or tails: the ladder and quests only read those values.
type Tab = "hab" | "quests" | "anchors" | "ladder";
const TABS = [["hab", "Habits"], ["quests", "Quests"], ["anchors", "Anchors"], ["ladder", "Wins ladder"]] as const;
const DAYS = [1, 2, 3, 4, 5, 6, 0];

/** One editable row: name (saved on Enter or leaving the field), up, down, fold away or unfold. */
function Row({ name, max = NAME_MAX, label, folded, first, last, onName, onMove, onFold, children }: {
  name: string; max?: number; label: string; folded: boolean; first: boolean; last: boolean;
  onName?: (v: string) => void; onMove?: (dir: -1 | 1) => void; onFold: () => void; children?: React.ReactNode;
}) {
  return (
    <div className={"kge-row" + (folded ? " folded" : "")}>
      <div className="kge-line">
        {onName ? <input key={name} aria-label={"Name: " + label} defaultValue={name} maxLength={max} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== name) onName(v); else e.target.value = name; }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          : <span className="kge-name">{name}</span>}
        {onMove && !folded && <span className="kge-move">
          <Btn kind="sm ghost" aria-label={"Move up: " + label} disabled={first} onClick={() => onMove(-1)}>↑</Btn>
          <Btn kind="sm ghost" aria-label={"Move down: " + label} disabled={last} onClick={() => onMove(1)}>↓</Btn>
        </span>}
        <Btn kind="sm ghost" onClick={onFold}>{folded ? "Unhide" : "Hide"}</Btn>
      </div>
      {children}
    </div>
  );
}

/** The folded-away items, under one quiet fold. */
function Folded({ n, what, children }: { n: number; what: string; children: React.ReactNode }) {
  if (!n) return null;
  return <details className="kfold kge-fold"><summary className="note">Folded away ({n} {what}) · kept, with their history</summary>{children}</details>;
}

function useEdit() {
  const { st, k, update } = useCourt();
  const set = (fn: (e: GardenEdit, d: CourtState) => void, also: ("hab" | "questsOff")[] = []) =>
    update((d) => { const e = structuredClone(d.gedit); fn(e, d); d.gedit = e; }, ["gedit", ...also]);
  return { st, k, set };
}

function HabitsTab({ onAdd }: { onAdd: () => void }) {
  const { st, set } = useEdit();
  const e = st.gedit, list = ordered(st.hab.list, (h) => h.id, e.hab.order), { shown, folded } = split(list, (h) => h.id, e.hab.hidden);
  const ids = shown.map((h) => h.id);
  const rename = (id: string, v: string) => set((_, d) => { d.hab = { ...d.hab, list: d.hab.list.map((h) => (h.id === id ? { ...h, name: v.slice(0, NAME_MAX) } : h)) }; }, ["hab"]);
  const row = (h: (typeof list)[number], off: boolean, i: number) => (
    <Row key={h.id} name={h.name} label={h.name} folded={off} first={i === 0} last={i === ids.length - 1} onName={(v) => rename(h.id, v)}
      onMove={(dir) => set((x) => { x.hab.order = moveShown(list.map((y) => y.id), ids, h.id, dir); })} onFold={() => set((x) => { x.hab.hidden = toggle(x.hab.hidden, h.id); })} />
  );
  return (
    <>
      <div className="kge-head"><span className="kge-tag">HABITS</span><Btn kind="sm ghost" onClick={onAdd}>Add a habit in My habits</Btn></div>
      {!st.hab.list.length ? <p className="note">No habits of your own yet. My habits is where you add them.</p> : shown.map((h, i) => row(h, false, i))}
      <Folded n={folded.length} what={folded.length === 1 ? "habit" : "habits"}>{folded.map((h, i) => row(h, true, i))}</Folded>
    </>
  );
}

function QuestsTab() {
  const { st, set } = useEdit();
  const e = st.gedit, list = ordered(QUESTS, (q) => q.id, e.quests.order), { shown, folded } = split(list, (q) => q.id, st.questsOff);
  const ids = shown.map((q) => q.id);
  const row = (q: (typeof QUESTS)[number], off: boolean, i: number) => (
    <Row key={q.id} name={e.quests.names[q.id] ?? q.title} label={q.title} folded={off} first={i === 0} last={i === ids.length - 1}
      onName={(v) => set((x) => { if (v === q.title) delete x.quests.names[q.id]; else x.quests.names[q.id] = v.slice(0, NAME_MAX); })}
      onMove={(dir) => set((x) => { x.quests.order = moveShown(list.map((y) => y.id), ids, q.id, dir); })}
      onFold={() => set((_, d) => { d.questsOff = toggle(d.questsOff, q.id); }, ["questsOff"])}>
      <span className="note">{q.cad} · +{q.xp} EXP{(e.quests.names[q.id] ?? q.title) !== q.title ? ` · was: ${q.title}` : ""}</span>
    </Row>
  );
  return (
    <>
      <div className="kge-head"><span className="kge-tag">QUESTS</span><span className="note">{shown.length} of {QUESTS.length} on</span></div>
      {shown.map((q, i) => row(q, false, i))}
      <Folded n={folded.length} what="switched off">{folded.map((q, i) => row(q, true, i))}</Folded>
      <p className="note">Your own quests are your habits (Habits tab). A new name is for display; what each quest counts and awards stays the same.</p>
    </>
  );
}

function AnchorDays({ id, m }: { id: string; m?: AnchorMeta }) {
  const { set } = useEdit();
  const put = (fn: (x: AnchorMeta) => void) => set((e) => { const x = { ...(e.anchors.meta[id] ?? {}) }; fn(x); if (x.freq !== "custom") delete x.days; e.anchors.meta[id] = x; });
  const freq = m?.freq ?? "daily", days = m?.days ?? [];
  return (
    <div className="kge-sub">
      <label className="kge-mini"><span>Time</span><input type="time" value={m?.at ?? ""} onChange={(ev) => put((x) => { if (ev.target.value) x.at = ev.target.value; else delete x.at; })} /></label>
      <label className="kge-mini"><span>Days</span><select value={freq} onChange={(ev) => put((x) => { x.freq = ev.target.value as Freq; if (x.freq === "custom" && !x.days?.length) x.days = [1, 2, 3, 4, 5]; })}>
        <option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="custom">Custom days</option>
      </select></label>
      {freq === "custom" && <div className="kchips" role="group" aria-label="Custom days">{DAYS.map((d) => <button key={d} type="button" className="chipb" aria-pressed={days.includes(d)} onClick={() => put((x) => { const next = toggle((x.days ?? days).map(String), String(d)).map(Number).sort(); if (next.length) x.days = next; })}>{wdName(d).slice(0, 3)}</button>)}</div>}
    </div>
  );
}

function AnchorsTab() {
  const { st, k, set } = useEdit();
  const e = st.gedit, imported = st.defs.swins?.phases.find((p) => p.daily)?.items ?? [];
  const { shown, folded } = anchorRows(imported, e, wdOf(k));
  const full = [...shown, ...folded].map((a) => a.id), orig = new Map<string, string>([...imported.map(([id, t]) => [id, t] as [string, string]), ...e.anchors.mine.map((m) => [m.id, m.t] as [string, string])]);
  const ids = shown.map((a) => a.id);
  const [f, setF] = useState({ t: "", d: "" });
  const row = (a: (typeof shown)[number], off: boolean, i: number) => (
    <Row key={a.id} name={a.t} label={a.t} folded={off} first={i === 0} last={i === ids.length - 1}
      onName={(v) => set((x) => { if (v === orig.get(a.id)) delete x.anchors.names[a.id]; else x.anchors.names[a.id] = v.slice(0, NAME_MAX); })}
      onMove={(dir) => set((x) => { x.anchors.order = moveShown(ordered(full, (y) => y, e.anchors.order), ids, a.id, dir); })} onFold={() => set((x) => { x.anchors.hidden = toggle(x.anchors.hidden, a.id); })}>
      {!off && <AnchorDays id={a.id} m={e.anchors.meta[a.id]} />}
    </Row>
  );
  return (
    <>
      <div className="kge-head"><span className="kge-tag">ANCHORS</span><span className="note">{shown.length} shown</span></div>
      {shown.map((a, i) => row(a, false, i))}
      <Folded n={folded.length} what={folded.length === 1 ? "anchor" : "anchors"}>{folded.map((a, i) => row(a, true, i))}</Folded>
      <form className="kform kge-add" aria-label="Add an anchor" onSubmit={(ev) => { ev.preventDefault(); const t = f.t.trim(); if (!t || e.anchors.mine.length >= MINE_MAX) return; set((x) => { x.anchors.mine.push({ id: MY_ANCHOR + newId("a").replace(/[^a-z0-9]/gi, "").slice(-10), t: t.slice(0, NAME_MAX), ...(f.d.trim() ? { d: f.d.trim().slice(0, LABEL_MAX) } : {}), at: k }); }); setF({ t: "", d: "" }); }}>
        <input aria-label="New anchor" maxLength={NAME_MAX} placeholder="A new anchor, for example: water first thing" value={f.t} onChange={(ev) => setF({ ...f, t: ev.target.value })} />
        <input aria-label="Anchor note" maxLength={LABEL_MAX} placeholder="A short note (optional)" value={f.d} onChange={(ev) => setF({ ...f, d: ev.target.value })} />
        <button className="btn sm" type="submit">Add anchor</button>
      </form>
      <p className="note">The Daily anchors quest still counts your eight imported anchors. Hiding one, or giving it fewer days, means fewer than eight can be ticked on those days. Anchors you add award nothing.</p>
    </>
  );
}

function LadderTab() {
  const { st, k, set } = useEdit();
  const e = st.gedit;
  const phases = [...(st.defs.swins?.phases.filter((p) => !p.daily) ?? []).map((p) => ({ id: p.id, title: p.title, items: p.items })), { id: "mine", title: "Your milestones", items: myMilestones(e) }];
  // the full order across phases, so moving one milestone keeps every other one where it is
  const per = phases.map((p) => ({ ...p, all: ordered(p.items, (x) => x[0], e.ladder.order) }));
  const fullOrder = per.flatMap((p) => p.all.map((x) => x[0]));
  const [f, setF] = useState({ t: "", d: "", dt: "" });
  const row = (it: PItem, ids: string[], off: boolean, i: number) => {
    const [id] = it, shown = ladderItems([it], { ...e, ladder: { ...e.ladder, hidden: [] } })[0];
    return (
      <Row key={id} name={shown[1]} label={shown[1]} folded={off} first={i === 0} last={i === ids.length - 1}
        onName={(v) => set((x) => { if (v === it[1]) delete x.ladder.names[id]; else x.ladder.names[id] = v.slice(0, NAME_MAX); })}
        onMove={(dir) => set((x) => { x.ladder.order = moveShown(fullOrder, ids, id, dir); })}
        onFold={() => set((x) => { x.ladder.hidden = toggle(x.ladder.hidden, id); })}>
        {!off && <div className="kge-sub">
          <label className="kge-mini wide"><span>Label</span><input key={shown[2]} defaultValue={shown[2]} maxLength={LABEL_MAX} onBlur={(ev) => { const v = ev.target.value.trim(); if (v !== shown[2]) set((x) => { if (v) x.ladder.labels[id] = v.slice(0, LABEL_MAX); else delete x.ladder.labels[id]; }); }} /></label>
          <label className="kge-mini"><span>Target</span><input key={shown[3] ?? ""} defaultValue={shown[3] ?? ""} maxLength={TARGET_MAX} placeholder="e.g. Dec 2026" onBlur={(ev) => { const v = ev.target.value.trim(); if (v !== (shown[3] ?? "")) set((x) => { if (v) x.ladder.targets[id] = v.slice(0, TARGET_MAX); else delete x.ladder.targets[id]; }); }} /></label>
          {(st.swins.done[id] || e.ladder.done[id]) && <span className="note">finished</span>}
        </div>}
      </Row>
    );
  };
  return (
    <>
      <div className="kge-head"><span className="kge-tag">WINS LADDER</span><span className="note">targets and labels are words only; ticks, XP and stars stay as they are</span></div>
      {per.map((p) => {
        const { shown, folded } = split(p.all, (x) => x[0], e.ladder.hidden), ids = shown.map((x) => x[0]);
        if (!p.all.length) return null;
        return (
          <div className="kge-phase" key={p.id}>
            <div className="sec-h">{p.title}</div>
            {shown.map((it, i) => row(it, ids, false, i))}
            <Folded n={folded.length} what={folded.length === 1 ? "milestone" : "milestones"}>{folded.map((it, i) => row(it, ids, true, i))}</Folded>
          </div>
        );
      })}
      <form className="kform kge-add" aria-label="Add a milestone" onSubmit={(ev) => { ev.preventDefault(); const t = f.t.trim(); if (!t || e.ladder.mine.length >= MINE_MAX) return; set((x) => { x.ladder.mine.push({ id: MY_MILESTONE + newId("m").replace(/[^a-z0-9]/gi, "").slice(-10), t: t.slice(0, NAME_MAX), ...(f.d.trim() ? { d: f.d.trim().slice(0, LABEL_MAX) } : {}), ...(f.dt.trim() ? { dt: f.dt.trim().slice(0, TARGET_MAX) } : {}), at: k }); }); setF({ t: "", d: "", dt: "" }); }}>
        <input aria-label="New milestone" maxLength={NAME_MAX} placeholder="A new milestone" value={f.t} onChange={(ev) => setF({ ...f, t: ev.target.value })} />
        <input aria-label="Milestone label" maxLength={LABEL_MAX} placeholder="Label (optional)" value={f.d} onChange={(ev) => setF({ ...f, d: ev.target.value })} />
        <input aria-label="Milestone target" maxLength={TARGET_MAX} placeholder="Target (optional)" value={f.dt} onChange={(ev) => setF({ ...f, dt: ev.target.value })} />
        <button className="btn sm" type="submit">Add milestone</button>
      </form>
    </>
  );
}

/** The "Edit garden" panel (opened by the one Edit garden button on the Garden page). */
export function EditGarden({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("hab");
  const toHabits = () => { onClose(); window.setTimeout(() => { const el = document.getElementById("hab-new") as HTMLInputElement | null; el?.scrollIntoView({ block: "center" }); el?.focus(); }, 30); };
  return (
    <section className="kgedit" id="kgedit" aria-labelledby="kgeditT">
      <div className="kgedit-top"><h2 id="kgeditT">Edit garden</h2><Btn kind="sm ghost" onClick={onClose}>Done</Btn></div>
      <TabPills value={tab} options={TABS} onChange={setTab} label="Edit garden" />
      <div className="kgedit-body">
        {tab === "hab" ? <HabitsTab onAdd={toHabits} /> : tab === "quests" ? <QuestsTab /> : tab === "anchors" ? <AnchorsTab /> : <LadderTab />}
      </div>
      <p className="note">Hiding folds an item away. Nothing is deleted: its ticks and history stay and are in Export my data.</p>
    </section>
  );
}
