"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import { getOnce } from "@/lib/court/once";
import { useVault, type VRow } from "@/lib/vault";
import { addDays, dayGap, prettyDay, weekKey } from "@/lib/court/time";
import { MiniMonth } from "./CalendarPage";
import { Archive, downloadDiary } from "../live/GrowLive";
import { Btn, Card, Chip, EmptyState, PageHead, SectionLabel, StoreNote, TabPills } from "../ui";

// Dungeon (round 6, private journal): left, the month calendar and a text-only list with search; middle, the
// day's entry (Inter) with autosave and an honest saved status, plus the "Count your wins" sheet; right, mood,
// tags, trade reflection prompts, attached research notes and the one weekly look-back (rule-based, no AI).
// Owner-only, never shown to friends, included in Export my data. A research note never exposes an entry:
// the link is stored on the entry only.

export type Entry = VRow & { day: string; text: string; mood?: number; tags: string[]; plan?: string; feel?: string; change?: string; tradeId?: string; notes: string[] };
type Note = VRow & { kind?: string; title?: string; text?: string; tags?: string[]; url?: string };

/** Round 9: a research note from the New note form (title or text needed; link only http(s); one optional tag). */
export function noteFromForm(f: { title: string; text: string; url: string; tag: string }) {
  const title = f.title.trim().slice(0, 120), text = f.text.trim().slice(0, 4000);
  if (!title && !text) return null;
  const url = /^https?:\/\/\S+$/.test(f.url.trim()) ? f.url.trim().slice(0, 500) : undefined;
  const tag = f.tag.trim().replace(/^#/, "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  return { kind: "note" as const, title, text, ...(url ? { url } : {}), tags: tag ? [tag] : [] };
}

function NewNote({ onSave }: { onSave: (n: NonNullable<ReturnType<typeof noteFromForm>>) => void }) {
  const [f, setF] = useState({ title: "", text: "", url: "", tag: "" });
  const [msg, setMsg] = useState("");
  return (
    <form className="kform knote-form" aria-label="New note" onSubmit={(e) => { e.preventDefault(); const n = noteFromForm(f); if (!n) return setMsg("Give the note a title or some text."); onSave(n); setF({ title: "", text: "", url: "", tag: "" }); setMsg(f.url.trim() && !n.url ? "Saved without the link: a link must start with https://" : "Saved."); }}>
      <div className="sec-h">New note</div>
      <input aria-label="Note title" placeholder="Title" maxLength={120} value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setMsg(""); }} />
      <textarea aria-label="Note text" placeholder="What you found, in your words" maxLength={4000} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      <div className="kform-row">
        <input aria-label="Link (optional)" placeholder="Link, optional (https://…)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input aria-label="Tag (optional)" placeholder="Tag, optional" maxLength={24} value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} />
      </div>
      <div className="kbtn-row"><button className="btn" type="submit">Save note</button>{msg && <span className="note" role="status">{msg}</span>}</div>
    </form>
  );
}
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
          {w.w && <p><b>Win</b> {w.w}</p>}{w.g && <p><b>Thanks</b> {w.g}</p>}{w.n && <p className="pre"><b>Notes</b> {w.n}</p>}
        </div>
      )}
      {day === k && <div className="kform-row"><Btn kind="sm" onClick={() => openSheet({ kind: "wins" })}>Count your wins</Btn><span className="note">{w ? "Saved for today; you can add more." : "The evening sheet: what went well and what you are grateful for."}</span></div>}
    </Card>
  );
}

// part (round 8): "side" is mood, tags and trade reflection (right column); "notes" is Research notes (left column).
function Side({ day, e, put, part }: { day: string; e: Entry | undefined; put: (x: Partial<Entry> & { id: string }) => void; part: "side" | "notes" }) {
  const { st } = useCourt();
  const notes = useVault<Note>("research_notes");
  const [tag, setTag] = useState("");
  const [trades, setTrades] = useState<{ id: string; inst?: string; date?: string }[]>([]);
  useEffect(() => { getOnce<{ trades?: { id: string }[] }>("/api/ledger").then((j) => setTrades(Array.isArray(j?.trades) ? j.trades.slice(0, 40) : [])).catch(() => {}); }, []);
  const base = { id: idOf(day), day };
  const cur = e ?? ({ tags: [], notes: [] } as unknown as Entry);
  const old = st.mood[day];
  return (
    <>
      {part === "side" && <>
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
      </>}
      {part === "notes" && <Card title="Research notes" sub="write one, attach it to this page">
        <NewNote onSave={(n) => notes.put(n as Partial<Note>)} />
        {!notes.rows.length ? <EmptyState who="tilly">No research notes yet. Write your first one above.</EmptyState>
          : [...notes.rows].sort((a, b) => b.up.localeCompare(a.up)).slice(0, 20).map((n) => {
            const on = (cur.notes ?? []).includes(n.id);
            return (
              <div className="krow" key={n.id}>
                <span className="krow-main"><b>{n.title || (n.text ?? "").slice(0, 60) || "Untitled note"}</b> {n.kind === "macro" && <Chip>macro</Chip>}{(n.tags ?? []).map((t) => <Chip key={t}>#{t}</Chip>)}
                  {n.title && n.text && <><br /><span className="note">{n.text.slice(0, 140)}</span></>}
                  {n.url && <><br /><a href={n.url} target="_blank" rel="noreferrer">{n.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</a></>}</span>
                <Btn kind="sm ghost" aria-pressed={on} onClick={() => put({ ...base, notes: on ? cur.notes.filter((x) => x !== n.id) : [...(cur.notes ?? []), n.id] })}>{on ? "Attached ✓" : "Attach"}</Btn>
              </div>
            );
          })}
        <p className="note">A note stays separate: attaching links it from this page only.</p>
      </Card>}
    </>
  );
}

export function WeeklyLookBack() {
  const { st, k } = useCourt();
  const v = useVault<Entry>("journal_entries");
  const L = lookBack(v.rows, st.wins, st.mood, k, st.streak, st.days);
  return (
    <Card title="Weekly look-back" sub="rule-based, private" id="dungeon-week">
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
  const hits = days.filter((d) => !needle || [byDay.get(d)?.text, ...(byDay.get(d)?.tags ?? []), st.wins[d]?.w, st.wins[d]?.g, st.wins[d]?.n].some((x) => String(x ?? "").toLowerCase().includes(needle)));
  // only the changed fields are sent; the storage layer merges them into the latest copy of the page
  const put = (x: Partial<Entry> & { id: string }) => v.put((byDay.has(x.day ?? day) ? x : { tags: [], notes: [], text: "", ...x }) as Partial<Entry> & { id: string });
  return (
    <div className="kpage">
      <PageHead scene="gate" title="Dungeon" sub="Your private journal. Never shown to friends; included in Export my data." />
      {/* round 7: Your pages | Today's page (stretches to the row, the writing area fills it) | the weekly look-back,
          then mood, tags, reflections and notes. On a tablet the page sits left with the other two stacked right. */}
      <div className="kpg kdun even">
        <div className="kcol kd-pages">
          <Card title="Your pages">
            <TabPills label="Pages" value={tab} options={[["month", "Month"], ["list", "List"]] as const} onChange={setTab} />
            {tab === "month" ? <MiniMonth marks={has} picked={day} onPick={(d) => setDay(d)} label="Journal month" /> : <>
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
          <Side day={day} e={byDay.get(day)} put={put} part="notes" />
        </div>
        <div className="kcol kd-edit"><Editor day={day} e={byDay.get(day)} put={put} status={v.status} storeNote={<StoreNote status={v.status} failed={v.failed} />} /></div>
        <div className="kcol kd-side"><WeeklyLookBack /><Side day={day} e={byDay.get(day)} put={put} part="side" /></div>
      </div>
    </div>
  );
}
