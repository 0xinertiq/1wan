"use client";

import { useId } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { FoxSvg } from "@/components/kumo/Fox";
import { Scene } from "@/components/kumo/decor/Scene";
import type { SceneId } from "@/components/kumo/decor/scenes";
import { Boundary } from "./Boundary";
import { VAULT_LABEL, vaultMode, type VStatus } from "@/lib/vault";

// The shared set every round 6 page is built from (same classes as the Court: .win cards with lavender title
// bars, .chipb chips, .btn buttons, .kseg segmented tabs). No one-off styles: anything new lives here and in the
// "Round 6 shared" block of kumo-new.css, on the tokens.

/** Themed pixel scene (or a room banner, round 7 pilot), then the Playfair title, a one-line subtitle and the page actions. */
export function PageHead({ scene, room, title, sub, actions }: { scene?: SceneId; room?: React.ReactNode; title: string; sub: string; actions?: React.ReactNode }) {
  return (
    <header className="kpage-head">
      {room ?? (scene ? <Scene id={scene} /> : null)}
      <div className="kpage-title">
        <div><h1>{title}</h1><p>{sub}</p></div>
        {actions && <div className="kpage-act">{actions}</div>}
      </div>
    </header>
  );
}

/** A card with its own error boundary, so one failure never blanks the page. */
export function Card({ title, sub, id, children, className = "", actions }: { title: string; sub?: React.ReactNode; id?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  const hid = useId();
  return (
    <Boundary name={title}>
      <section className={"win kcard " + className} id={id} aria-labelledby={hid}>
        <div className="win-title"><h2 id={hid}>{title}</h2>{sub && <span className="sub">{sub}</span>}{actions && <span className="kcard-act">{actions}</span>}</div>
        <div className="win-body">{children}</div>
      </section>
    </Boundary>
  );
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => <div className="sec-h">{children}</div>;
export const Chip = ({ children, tone = "lav" }: { children: React.ReactNode; tone?: "lav" | "sakura" | "gold" | "mint" | "peach" | "sky" }) => <span className={"kchip t-" + tone}>{children}</span>;
export const Callout = ({ children, tone = "sakura" }: { children: React.ReactNode; tone?: "sakura" | "lav" | "gold" }) => <div className={"kcallout t-" + tone}>{children}</div>;
export const Ts = ({ children }: { children: React.ReactNode }) => <time className="ts">{children}</time>;

export function Btn({ children, kind = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "" | "ghost" | "sm" | "sm ghost" }) {
  return <button type="button" className={("btn " + kind).trim()} {...p}>{children}</button>;
}

/** Segmented tabs (the Court's Today | Week style). */
export function TabPills<T extends string>({ value, options, onChange, label }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="kseg" role="group" aria-label={label}>
      {options.map(([v, l]) => <button key={v} type="button" aria-pressed={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}

/** A plain table that keeps its own scroll box, so the page never scrolls sideways. */
export function Table({ head, rows, caption }: { head: string[]; rows: React.ReactNode[][]; caption?: string }) {
  return (
    <div className="ktable-wrap" role="region" aria-label={caption ?? head.join(", ")} tabIndex={0}>
      <table className="ktable">
        {caption && <caption className="sr">{caption}</caption>}
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Empty, loading or error state with a little pixel friend (the fox by default, or a crew member). */
export function EmptyState({ children, who, kind = "empty" }: { children: React.ReactNode; who?: SpriteName; kind?: "empty" | "loading" | "error" }) {
  return (
    <div className={"kempty k-" + kind} role={kind === "error" ? "alert" : undefined}>
      <span className="kempty-art" aria-hidden="true">{who ? <PixelSprite name={who} /> : <FoxSvg tails={3} sleepy={kind === "loading"} />}</span>
      <p>{children}</p>
    </div>
  );
}

/** Small honest label for where round 6 records are kept, and their save status. */
export function StoreNote({ status, failed }: { status?: VStatus; failed?: boolean }) {
  const m = vaultMode();
  if (failed) return <p className="kstore" role="alert">Could not load your saved records. Try again later; nothing was changed.</p>;
  return (
    <p className={"kstore" + (m === "device" ? " dev" : "")}>
      {VAULT_LABEL[m]}{status === "saving" ? " · saving…" : status === "saved" ? " · saved" : status === "error" ? " · not saved, try again" : ""}
    </p>
  );
}

/** A thin bar for stats (token colours). */
export const Bar = ({ v, max, label, tone = "accent" }: { v: number; max: number; label: string; tone?: "accent" | "lav" | "mint" | "danger" }) => (
  <span className={"kbar t-" + tone} role="img" aria-label={label}><i style={{ width: Math.max(0, Math.min(100, max ? (Math.abs(v) / max) * 100 : 0)) + "%" }} /></span>
);

/** Confirm before anything that deletes. */
export const confirmDelete = (what: string) => typeof window === "undefined" || window.confirm(`Delete ${what}? This cannot be undone.`);
