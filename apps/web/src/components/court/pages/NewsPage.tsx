"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { PacketLive } from "../live/PacketLive";
import { noBigdata } from "@/lib/noBigdata";
import { useVault, type VRow } from "@/lib/vault";
import { stamp } from "@/lib/court/time";
import type { Lens } from "@/lib/court/state";
import { Btn, Card, Chip, EmptyState, PageHead, StoreNote, confirmDelete } from "../ui";

// News (round 6): left, headlines with topic chips and the Telegram chip; right, brief history by date and Kumo's
// reviews with the weekly review packet; under both, the "Saved and research" strip (Tilly, rules only): her
// research notes for the market lens, with tags, a source link, pin and search. Hidden when the lens is off.

export type Research = VRow & { kind: "note" | "macro"; title: string; text: string; tags: string[]; url?: string; pinned?: boolean; lens?: Exclude<Lens, "off">; watch?: string };
const LENS_LABEL: Record<Lens, string> = { trading: "Markets and trading", local: "Local news", any: "Any topic", off: "Off" };

/** Which notes the strip shows for a lens: "any" shows every note; otherwise notes tagged to that lens. */
export const forLens = (rows: Research[], lens: Lens) => (lens === "off" ? [] : rows.filter((r) => r.kind !== "macro" && (lens === "any" || (r.lens ?? "trading") === lens)));

export function ResearchStrip() {
  const { st } = useCourt();
  const lens: Lens = st.prefs.lens ?? "trading";
  const v = useVault<Research>("research_notes");
  const lt = useVault<VRow & { name: string }>("longterm_watchlist");
  const [q, setQ] = useState("");
  const [f, setF] = useState<{ id?: string; title: string; text: string; tags: string; url: string; watch: string } | null>(null);
  if (lens === "off") return null;
  const needle = q.trim().toLowerCase();
  const list = forLens(v.rows, lens).filter((r) => !needle || [r.title, r.text, ...(r.tags ?? [])].some((x) => String(x ?? "").toLowerCase().includes(needle)))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.up.localeCompare(a.up));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f || !(f.title.trim() || f.text.trim())) return;
    const url = /^https?:\/\//.test(f.url.trim()) ? f.url.trim().slice(0, 500) : undefined;
    v.put({ ...(f.id ? { id: f.id } : {}), kind: "note", lens: lens === "any" ? "trading" : lens, title: f.title.trim().slice(0, 120), text: f.text.slice(0, 4000), url, watch: f.watch || undefined,
      tags: f.tags.split(/[,\s]+/).map((t) => t.replace(/^#/, "").toLowerCase().slice(0, 24)).filter(Boolean).slice(0, 10) });
    setF(null);
  };
  return (
    <Card title="Saved and research" sub={<>Tilly · {LENS_LABEL[lens]} lens</>} className="kfull" id="research" actions={!f ? <Btn kind="sm" onClick={() => setF({ title: "", text: "", tags: "", url: "", watch: "" })}>Save a note</Btn> : null}>
      <input type="search" aria-label="Search your research notes" placeholder="Search notes, coins or tags" value={q} onChange={(e) => setQ(e.target.value)} />
      {f && (
        <form className="kform" aria-label="Research note" onSubmit={save}>
          <input aria-label="Title" maxLength={120} placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea aria-label="Note" maxLength={4000} placeholder="What you found, in your words" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
          <div className="kform-row">
            <input aria-label="Tags" placeholder="Topic or coin tags, e.g. sol, rates" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
            <input aria-label="Source link" placeholder="Source link (https://…)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
            <select aria-label="Link to a long-term watchlist item" value={f.watch} onChange={(e) => setF({ ...f, watch: e.target.value })}><option value="">No watchlist link</option>{lt.rows.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          </div>
          <div className="kform-row"><button className="btn" type="submit">Save</button><Btn kind="ghost" onClick={() => setF(null)}>Cancel</Btn></div>
        </form>
      )}
      {!v.ready ? <EmptyState kind="loading" who="tilly">Opening your notes…</EmptyState>
        : !list.length ? <EmptyState who="tilly">{v.rows.length ? "No notes match." : "Nothing saved yet. Save a note with a source link and a few tags; the Dungeon can attach it to a journal page."}</EmptyState>
        : <div className="kpg two">{list.slice(0, 24).map((r) => (
          <div className="krow" key={r.id}>
            <span className="krow-main"><b>{r.pinned ? "📌 " : ""}{noBigdata(r.title) || "Untitled"}</b> <time className="ts">{stamp(r.up)}</time>
              {r.text && <><br /><span>{noBigdata(r.text).slice(0, 220)}</span></>}
              <br /><span className="kchips">{(r.tags ?? []).map((t) => <Chip key={t}>#{t}</Chip>)}{r.watch && <Chip tone="mint">{lt.rows.find((x) => x.id === r.watch)?.name ?? "watchlist"}</Chip>}</span>
              {r.url && <><br /><a className="brsrc-line" href={r.url} target="_blank" rel="noreferrer">{r.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</a></>}</span>
            <span className="krow-act">
              <Btn kind="sm ghost" aria-pressed={!!r.pinned} onClick={() => v.put({ id: r.id, pinned: !r.pinned })}>{r.pinned ? "Unpin" : "Pin"}</Btn>
              <Btn kind="sm ghost" onClick={() => setF({ id: r.id, title: r.title, text: r.text, tags: (r.tags ?? []).join(", "), url: r.url ?? "", watch: r.watch ?? "" })}>Edit</Btn>
              <Btn kind="sm ghost" onClick={() => confirmDelete(`“${r.title || "this note"}”`) && v.remove(r.id)}>Delete</Btn>
            </span>
          </div>
        ))}</div>}
      <p className="note">Rules only: save, tag, search and link. Change the lens in Settings.</p>
      <StoreNote status={v.status} />
    </Card>
  );
}

export function NewsPage({ headlines, library }: { headlines: React.ReactNode; library: React.ReactNode }) {
  return (
    <div className="kpage">
      <PageHead scene="board" title="News" sub="Headlines, brief history, Kumo's reviews and your saved research." actions={<a className="btn sm ghost" href="#research">Saved and research</a>} />
      <div className="kpg two">
        <div className="kcol">{headlines}</div>
        <div className="kcol">
          {library}
          <Card title="Kumo's weekly review packet" sub="preview before anything is copied">
            <details><summary className="btn sm ghost">Open the packet</summary><PacketLive /></details>
          </Card>
        </div>
      </div>
      <ResearchStrip />
    </div>
  );
}
