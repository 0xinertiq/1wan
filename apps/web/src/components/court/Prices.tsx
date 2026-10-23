"use client";

import { useEffect } from "react";
import { useCourt } from "./CourtState";
import type { Price } from "@/lib/prices";

// Live prices (display only). One request feeds both the stage chip and the Scan window.

export function PricesLoader({ symbols }: { symbols: string[] }) {
  const { setPrices, setPxBusy } = useCourt();
  const key = symbols.join(",");
  useEffect(() => {
    let alive = true;
    async function load() {
      if (document.visibilityState === "hidden") return;
      setPxBusy(true);
      try {
        const r = await fetch("/api/prices?s=" + encodeURIComponent(key));
        if (r.ok && alive) setPrices(await r.json());
      } catch { /* keep what is shown */ } finally {
        if (alive) setPxBusy(false);
      }
    }
    load();
    const t = window.setInterval(load, 60000);
    return () => { alive = false; window.clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

const fmt = (n: number) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n >= 1 ? n.toFixed(2) : n.toPrecision(3));
const pct = (c: number | null) => (c == null ? "" : (c >= 0 ? "+" : "") + c.toFixed(1) + "%");
const ago = (iso: string) => { const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + "h ago"; };

export function StagePrices() {
  const { prices } = useCourt();
  if (!prices?.prices.length) return null;
  const pick = ["BTC", "ETH", "SOL"].map((s) => prices.prices.find((p) => p.sym === s)).filter((p): p is Price => !!p);
  const show = (pick.length ? pick : prices.prices).slice(0, 3);
  return (
    <div className="chip-map chip-px" aria-label="Live prices">
      {show.map((p) => <span key={p.sym}>{p.sym} {fmt(p.usd)} <i className={p.ch24 != null && p.ch24 < 0 ? "dn" : "up"}>{pct(p.ch24)}</i></span>)}
      {prices.stale && <span className="stale">stale</span>}
    </div>
  );
}

export function ScanPrices() {
  const { prices } = useCourt();
  if (!prices) return <p className="note">Loading prices...</p>;
  if (!prices.prices.length) return <p className="note">Prices are not reachable right now.</p>;
  return (
    <>
      <div className="sec-h">Prices now</div>
      <ul className="pxl">
        {prices.prices.map((p) => (
          <li key={p.sym}><b>{p.sym}</b><span>${fmt(p.usd)}</span><span className={p.ch24 != null && p.ch24 < 0 ? "dn" : "up"}>{pct(p.ch24)}</span></li>
        ))}
      </ul>
      <p className="note xd">
        {prices.stale ? `Stale: last good prices from ${ago(prices.at)}. ` : ""}
        24h change in USD from {prices.source === "crypto.com" ? "Crypto.com Exchange" : prices.source === "cache" ? "the last good read" : "CoinGecko"}, refreshed every minute. Read-only.
      </p>
    </>
  );
}
