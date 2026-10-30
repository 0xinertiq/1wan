"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import { getOnce } from "@/lib/court/once";
import { useVault, type VRow } from "@/lib/vault";
import { addDays, dayGap, prettyDay, weekKey } from "@/lib/court/time";
import { MiniMonth } from "./CalendarPage";
import { Archive, downloadDiary } from "../live/GrowLive";
import { DungeonStudy } from "@/components/kumo/decor/room2Dungeon";
import { Btn, Card, Chip, EmptyState, PageHead, SectionLabel, StoreNote, TabPills } from "../ui";

// Dungeon (round 6, private journal): left, the month calendar and a text-only list with search; middle, the
// day's entry (Inter) with autosave and an honest saved status, plus the Gratitude sheet and its log; right, mood,
// tags, trade reflection prompts, Today's gratitude and the one weekly look-back (rule-based, no AI).
// Owner-only, never shown to friends, included in Export my data. A research note never exposes an entry:
// the link is stored on the entry only.

export type Entry = VRow & { day: string; text: string; mood?: number; tags: string[]; plan?: string; feel?: string; change?: string; tradeId?: string; notes: string[] };
type Note = VRow & { kind?: string; title?: string; text?: string; tags?: string[]; url?: string };

const MOODS = ["Low", "Flat", "Okay", "Good", "Bright"];
const idOf = (day: string) => "j" + day;

/** The weekly look-back, rule-based only: entries written, moods, top tags, wins, streak. */
export function lookBack(entries: Entry[], wins: Record<string, { w?: string; g?: string; n?: string }>, oldMood: Record<string, { m: number }>, k: string, streak: number, questDays: Record<string, { d: number; t: number }> = {}) {
  const wk = weekKey(k), days = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter((d) => d <= k);
  const mine = entries.filter((e) => days.includes(e.day) && (e.text?.trim() || e.mood));
  const moods = days.map((d) => mine.find((e) => e.day === d)?.mood ?? oldMood[d]?.m).filter((m): m is number => typeof m === "number" && m >= 1 && m <= 5);
  const tags = new Map<string, number>();
  for (const e of mine) for (const t of e.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);
  return {
    days: days.length, written: new Set([...mine.map((e) => e.day), ...days.filter((d) => wins[d]?.w || wins[d]?.g || wins[d]?.n)]).size,
    avgMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    topTags: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
    winsDays: days.filter((d) => wins[d]?.w || wins[d]?.g).length, streak,
    quests: days.reduce((t, d) => t + (questDays[d]?.d ?? 0), 0), questTotal: days.reduce((t, d) => t + (questDays[d]?.t ?? 0), 0),
  };
}

function Editor({ day, e, put, status, storeNote }: { day: string; e: Entry | undefined; put: (x: Partial<Entry> & { id: string }) => void; status: string; storeNote?: React.ReactNode }) {
  const { st, k, openSheet } = useCourt();
  const [text, setText] = useState(e?.text ?? "");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { setText(e?.text ?? ""); }, [day]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const change = (v: string) => { setText(v); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => put({ id: idOf(day), day, text: v.slice(0, 20000) }), 700); };
  const w = st.wins[day];
  return (
    <Card title={day === k ? "Today's page" : prettyDay(day)} sub={status === "saving" ? "saving…" : status === "error" ? "not saved, try again" : status === "saved" ? "saved" : "autosaves as you write"} className="kjournal">
      <textarea aria-label={`Journal entry for ${prettyDay(day)}`} maxLength={20000} placeholder="Write freely. Nobody is reading but you." value={text} onChange={(ev) => change(ev.target.value)} />
      <span className="note">{text.length.toLocaleString("en-SG")} characters · private to you</span>
      {storeNote}
      {w && (w.w || w.g || w.n) && (
        <div className="kcallout t-lav">
          {w.w && <p><b>Went well</b> {w.w}</p>}{w.g && <p><b>Grateful for</b> {w.g}</p>}{w.n && <p className="pre"><b>Notes</b> {w.n}</p>}
        </div>
      )}
      {day === k && <div className="kform-row"><Btn kind="sm" onClick={() => { const el = document.getElementById("today-gratitude"); el?.scrollIntoView({ block: "nearest" }); el?.querySelector<HTMLElement>("textarea,input")?.focus(); }}>Gratitude</Btn><span className="note">{w ? "Saved for today; you can add more." : "The evening sheet: what went well and what you are grateful for."}</span></div>}
    </Card>
  );
}

// Mood and tags, then the trade reflection (right column). Round 12: research notes left the Dungeon; any notes
// already attached to a page stay in its record (the notes field) and in Export my data.
function Side({ day, e, put }: { day: string; e: Entry | undefined; put: (x: Partial<Entry> & { id: string }) => void }) {
  const { st } = useCourt();
  const [tag, setTag] = useState("");
  const [trades, setTrades] = useState<{ id: string; inst?: string; date?: string }[]>([]);
  useEffect(() => { getOnce<{ trades?: { id: string }[] }>("/api/ledger").then((j) => setTrades(Array.isArray(j?.trades) ? j.trades.slice(0, 40) : [])).catch(() => {}); }, []);
  const base = { id: idOf(day), day };
  const cur = e ?? ({ tags: [], notes: [] } as unknown as Entry);
  const old = st.mood[day];
  return (
    <>
      <Card title="Mood and tags">
        <div className="kmood" role="group" aria-label="Mood">
          {MOODS.map((m, i) => <button key={m} type="button" className="chipb" aria-pressed={(cur.mood ?? old?.m) === i + 1} onClick={() => put({ ...base, mood: i + 1 })}>{m}</button>)}
        </div>
        {old && !cur.mood && <p className="note">From your old diary: {MOODS[old.m - 1]}</p>}
        <div className="kchips">{(cur.tags ?? []).map((t) => <button key={t} type="button" className="chipb" aria-label={`Remove tag ${t}`} onClick={() => put({ ...base, tags: cur.tags.filter((x) => x !== t) })}>#{t} ×</button>)}</div>
        <form className="kform-row" onSubmit={(ev) => { ev.preventDefault(); const t = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24); if (t && !(cur.tags ?? []).includes(t)) put({ ...base, tags: [...(cur.tags ?? []), t].slice(0, 12) }); setTag(""); }}>
          <input aria-label="Add a tag" placeholder="Add a tag" value={tag} onChange={(ev) => setTag(ev.target.value)} /><button className="btn sm" type="submit">Add</button>
        </form>
      </Card>
      <Card title="Trade reflection" sub="before and after a trade">
        {trades.length > 0 && <select aria-label="Link a trade" value={cur.tradeId ?? ""} onChange={(ev) => ev.target.value && put({ ...base, tradeId: ev.target.value })}>
          {!cur.tradeId && <option value="" disabled>Pick a trade</option>}
          {trades.map((t) => <option key={t.id} value={t.id}>{String(t.inst ?? "")} {t.date ? prettyDay(String(t.date)) : ""}</option>)}
        </select>}
        <label className="kform">Before: what is the plan?<textarea key={day + "p"} maxLength={1000} defaultValue={cur.plan ?? ""} onBlur={(ev) => ev.target.value !== (cur.plan ?? "") && put({ ...base, plan: ev.target.value })} /></label>
        <label className="kform">How do you feel about it?<textarea key={day + "f"} maxLength={1000} defaultValue={cur.feel ?? ""} onBlur={(ev) => ev.target.value !== (cur.feel ?? "") && put({ ...base, feel: ev.target.value })} /></label>
        <label className="kform">After: what would you change?<textarea key={day + "c"} maxLength={1000} defaultValue={cur.change ?? ""} onBlur={(ev) => ev.target.value !== (cur.change ?? "") && put({ ...base, change: ev.target.value })} /></label>
      </Card>
    </>
  );
}

/** Round 11: the Gratitude log, newest first: each evening's lines (what went well, what I'm grateful for, notes),
 *  from the same saved key the sheet writes (wins). Private like the journal; included in Export my data. */
export function gratitudeLog(wins: Record<string, { w?: string; g?: string; n?: string; s?: string }>) {
  return Object.entries(wins ?? {}).filter(([d, x]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && x && (x.w || x.g || x.n || x.s)).map(([day, x]) => ({ day, w: x.w ?? "", g: x.g ?? "", s: x.s ?? "", n: x.n ?? "" })).sort((a, b) => b.day.localeCompare(a.day));
}
function GratitudeLog() {
  const { st, update } = useCourt();
  const list = gratitudeLog(st.wins);
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const [f, setF] = useState<{ day: string; w: string; g: string; s: string; n: string } | null>(null);
  // editing changes the words only: no quest, XP or streak logic runs here
  const save = () => { if (!f) return; update((d) => { d.wins = { ...d.wins, [f.day]: { ...d.wins[f.day], w: f.w.slice(0, 2000), g: f.g.slice(0, 2000), s: f.s.slice(0, 300), n: f.n.slice(0, 6000) } }; }, ["wins"]); setF(null); };
  return (
    <Card title="Gratitude log" sub="private, newest first">
      {!list.length ? <EmptyState who="coco">Nothing yet. The Gratitude sheet opens at 21:30, or tap Gratitude on today&apos;s page.</EmptyState>
        : (all ? list : list.slice(0, 30)).map((x) => (
          <div className="krow kgrat" key={x.day}>
            <span className="krow-main">
              <button type="button" className="klink-row" aria-expanded={open === x.day} onClick={() => { setOpen(open === x.day ? null : x.day); setF(null); }}><b>{prettyDay(x.day)}</b><br /><span className="note">{(x.w || x.g || x.n).slice(0, 80)}</span></button>
              {open === x.day && (f?.day === x.day
                ? <form className="kform" aria-label={`Edit gratitude for ${prettyDay(x.day)}`} onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <label className="kform">What went well<textarea maxLength={2000} value={f.w} onChange={(e) => setF({ ...f, w: e.target.value })} /></label>
                    <label className="kform">What I&apos;m grateful for<textarea maxLength={2000} value={f.g} onChange={(e) => setF({ ...f, g: e.target.value })} /></label>
                    <label className="kform">One small win<input maxLength={300} value={f.s} onChange={(e) => setF({ ...f, s: e.target.value })} /></label>
                    <label className="kform">Notes<textarea maxLength={6000} value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} /></label>
                    <div className="kbtn-row"><button className="btn sm" type="submit">Save</button><Btn kind="sm ghost" onClick={() => setF(null)}>Cancel</Btn></div>
                  </form>
                : <div className="kgrat-read">
                    {x.w && <p><b>Went well</b> {x.w}</p>}{x.g && <p><b>Grateful for</b> {x.g}</p>}{x.s && <p><b>Small win</b> {x.s}</p>}{x.n && <p className="pre"><b>Notes</b> {x.n}</p>}
                    <Btn kind="sm ghost" onClick={() => setF({ ...x })}>Edit</Btn>
                  </div>)}
            </span>
          </div>
        ))}
      {list.length > 30 && <Btn kind="sm ghost" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all (${list.length})`}</Btn>}
    </Card>
  );
}

/** Round 12: Today's gratitude, always in view at the top of the right column. Three short lines; autosaves as she
 *  types and on Save. It writes today's entry under the same key the evening sheet uses (wins), so the Gratitude log,
 *  the garden watering and the quest and XP behaviour work exactly as before; saving again edits today's entry. */
export const gratitudePatch = (cur: { w?: string; g?: string; n?: string; s?: string } | undefined, f: { w: string; g: string; s: string }) => ({ ...(cur ?? {}), w: f.w.slice(0, 2000), g: f.g.slice(0, 2000), s: f.s.slice(0, 300) });
function TodaysGratitude() {
  const { st, k, update } = useCourt();
  const cur = st.wins[k];
  const [f, setF] = useState({ w: cur?.w ?? "", g: cur?.g ?? "", s: cur?.s ?? "" });
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // the latest typed lines, not yet saved (null when nothing is pending)
  const pending = useRef<typeof f | null>(null);
  const save = (next = f) => {
    window.clearTimeout(timer.current); pending.current = null;
    if (!next.w.trim() && !next.g.trim() && !next.s.trim() && !st.wins[k]) return;
    update((d) => { d.wins = { ...d.wins, [k]: gratitudePatch(d.wins[k], next) }; }, ["wins"]); setSaved(true);
  };
  // newer words from the evening sheet or the log show here, unless she is typing in this card right now
  useEffect(() => { if (!pending.current) setF({ w: cur?.w ?? "", g: cur?.g ?? "", s: cur?.s ?? "" }); }, [k, cur?.w, cur?.g, cur?.s]);
  // leaving the page or hiding the tab saves what was typed, never drops it
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    const flush = () => { if (pending.current) saveRef.current(pending.current); };
    const vis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); flush(); };
  }, []);
  const change = (next: typeof f) => { setF(next); setSaved(false); pending.current = next; window.clearTimeout(timer.current); timer.current = window.setTimeout(() => save(next), 800); };
  return (
    <Card title="Today's gratitude" sub={saved ? "saved ✓" : "autosaves as you type"} id="today-gratitude" className="kgrat-today">
      <form className="kform" aria-label="Today's gratitude" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <input aria-label="What went well" placeholder="What went well" maxLength={2000} value={f.w} onChange={(e) => change({ ...f, w: e.target.value })} />
        <input aria-label="What I'm grateful for" placeholder="What I'm grateful for" maxLength={2000} value={f.g} onChange={(e) => change({ ...f, g: e.target.value })} />
        <input aria-label="One small win" placeholder="One small win" maxLength={300} value={f.s} onChange={(e) => change({ ...f, s: e.target.value })} />
        <div className="kbtn-row"><button className="btn sm" type="submit">Save</button><span className="note">Private, in your Gratitude log.</span></div>
      </form>
    </Card>
  );
}

export function WeeklyLookBack() {
  const { st, k } = useCourt();
  const v = useVault<Entry>("journal_entries");
  const L = lookBack(v.rows, st.wins, st.mood, k, st.streak, st.days);
  return (
    <Card title="Weekly look-back" sub="rule-based, private" id="dungeon-week" className="kd-week">
      <ul className="rv-sug">
        <li>{L.written} of {L.days} day{L.days === 1 ? "" : "s"} with something written</li>
        {L.winsDays > 0 && <li>{L.winsDays} day{L.winsDays === 1 ? "" : "s"} with a win or a thank-you</li>}
        {L.avgMood != null && <li>Average mood {L.avgMood.toFixed(1)} of 5</li>}
        {L.topTags.length > 0 && <li>Most used tags: {L.topTags.map((t) => "#" + t).join(", ")}</li>}
        {L.questTotal > 0 && <li>{L.quests} of {L.questTotal} daily quests done</li>}
        <li>{L.streak}-day streak</li>
      </ul>
      <p className="note">{L.written ? "Steady beats loud. Whatever you wrote this week counts." : "The week is open. One line is enough."}</p>
    </Card>
  );
}

export function DungeonPage() {
  const { st, k } = useCourt();
  const v = useVault<Entry>("journal_entries");
  const [day, setDay] = useState(k);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"list" | "month">("month");
  const byDay = useMemo(() => new Map(v.rows.map((e) => [e.day, e])), [v.rows]);
  const has = (d: string) => !!(byDay.get(d)?.text?.trim() || st.wins[d]?.w || st.wins[d]?.g || st.wins[d]?.n);
  const days = [...new Set([...v.rows.map((e) => e.day), ...Object.keys(st.wins)])].filter(has).sort().reverse();
  const needle = q.trim().toLowerCase();
  const hits = days.filter((d) => !needle || [byDay.get(d)?.text, ...(byDay.get(d)?.tags ?? []), st.wins[d]?.w, st.wins[d]?.g, st.wins[d]?.s, st.wins[d]?.n].some((x) => String(x ?? "").toLowerCase().includes(needle)));
  // only the changed fields are sent; the storage layer merges them into the latest copy of the page
  const put = (x: Partial<Entry> & { id: string }) => v.put((byDay.has(x.day ?? day) ? x : { tags: [], notes: [], text: "", ...x }) as Partial<Entry> & { id: string });
  // round 12: at desktop sizes the page fits the window: the grid takes the height left under the page head (keeping
  // a 16px buffer, round 19) and each column scrolls inside itself only if it must. Small screens scroll as normal.
  const grid = useRef<HTMLDivElement>(null);
  const [fitH, setFitH] = useState<number | null>(null);
  useEffect(() => {
    const look = () => {
      settled.current = 0;
      const el = grid.current, panel = el?.closest(".tabpanel") as HTMLElement | null;
      if (!el || (panel && panel.hidden) || window.innerWidth < 1200 || window.innerHeight < 540) return setFitH(null);
      const top = el.getBoundingClientRect().top + window.scrollY;
      setFitH(Math.max(260, Math.floor(window.innerHeight - top - 16)));
    };
    // measure on load, on resize, and whenever the Dungeon tab is shown (the nav shows it without a hashchange)
    const t = window.setTimeout(look, 60);
    window.addEventListener("resize", look); window.addEventListener("hashchange", look);
    const panel = grid.current?.closest(".tabpanel");
    const mo = panel && typeof MutationObserver !== "undefined" ? new MutationObserver(() => window.requestAnimationFrame(look)) : null;
    if (mo && panel) mo.observe(panel, { attributes: true, attributeFilter: ["hidden"] });
    return () => { window.clearTimeout(t); window.removeEventListener("resize", look); window.removeEventListener("hashchange", look); mo?.disconnect(); };
  }, []);
  // once the compact head is applied the grid moves up: measure again so the grid uses that space
  // then trim any leftover overflow (spacing below the grid), so the page itself never scrolls
  const settled = useRef(0);
  useEffect(() => {
    if (!fitH) { settled.current = 0; return; }
    if (settled.current >= 2) return;
    const step = ++settled.current;
    window.requestAnimationFrame(() => {
      const el = grid.current, se = document.scrollingElement; if (!el || !se) return;
      if (step === 1) { const top = el.getBoundingClientRect().top + window.scrollY; const h = Math.max(260, Math.floor(window.innerHeight - top - 16)); if (Math.abs(h - fitH) > 2) return setFitH(h); settled.current = 2; }
      const over = se.scrollHeight - window.innerHeight;
      if (over > 0) setFitH(Math.max(260, fitH - over));
    });
  }, [fitH]);
  return (
    <div className={"kpage kdun-page" + (fitH ? " fit" : "")} style={fitH ? ({ "--dun-h": fitH + "px" } as React.CSSProperties) : undefined}>
      <PageHead room={<DungeonStudy />} title="Dungeon" sub="Your private journal. Never shown to friends; included in Export my data." />
      {/* round 18: the weekly look-back, Your pages and the Gratitude log | Today's page (stretches to the row, the
          writing area fills it) | Today's gratitude, mood and tags, trade reflection. On a tablet the page sits left
          with the other two stacked right. */}
      <div className="kpg kdun even" ref={grid}>
        <div className="kcol kd-pages">
          <WeeklyLookBack />
          {/* round 19: the Month / List switch sits in the card's header row, saving a row so the column fits */}
          <Card title="Your pages" className="kd-pages-card" actions={<TabPills label="Pages" value={tab} options={[["month", "Month"], ["list", "List"]] as const} onChange={setTab} />}>
            {tab === "month" ? <MiniMonth marks={has} picked={day} onPick={(d) => setDay(d)} label="Journal month" mark="heart" /> : <>
              <input type="search" aria-label="Search your journal" placeholder="Search your pages" value={q} onChange={(e) => setQ(e.target.value)} />
              {!hits.length ? <EmptyState>{days.length ? "Nothing matches." : "Your first page appears when you write."}</EmptyState>
                : hits.slice(0, 60).map((d) => (
                  <button key={d} type="button" className="krow klink-row" aria-pressed={d === day} onClick={() => setDay(d)}>
                    <span className="krow-main"><b>{prettyDay(d)}</b><br /><span className="note">{(byDay.get(d)?.text || st.wins[d]?.w || st.wins[d]?.n || "").slice(0, 80)}</span></span>
                  </button>
                ))}
            </>}
            <div className="kform-row">{day !== k && <Btn kind="sm ghost" onClick={() => setDay(k)}>Back to today</Btn>}<Btn kind="sm ghost" onClick={() => downloadDiary(st, k)}>Download my diary</Btn></div>
            <Archive />
            {dayGap(day, k) < 0 && <p className="note">That day has not come yet; the page will wait for you.</p>}
          </Card>
          <GratitudeLog />
        </div>
        <div className="kcol kd-edit"><Editor day={day} e={byDay.get(day)} put={put} status={v.status} storeNote={<StoreNote status={v.status} failed={v.failed} />} /></div>
        <div className="kcol kd-side"><TodaysGratitude /><Side day={day} e={byDay.get(day)} put={put} /></div>
      </div>
    </div>
  );
}
