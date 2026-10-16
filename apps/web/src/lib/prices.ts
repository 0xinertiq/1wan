// Live crypto prices for display only (no trading, no advice). Server side, cached 60 seconds.
// Primary: CoinGecko public API (no key). Fallback: Crypto.com Exchange public tickers.
// If both fail, the last good values are returned and marked stale.

export const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL"];

// Symbol to CoinGecko id. All ids checked against CoinGecko on 16 Oct 2026.
export const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", NEAR: "near", ZRO: "layerzero", UNI: "uniswap", ONDO: "ondo-finance",
  PUMP: "pump-fun", GRASS: "grass", ENA: "ethena", AVAX: "avalanche-2", WLD: "worldcoin-wld", LDO: "lido-dao",
  HYPE: "hyperliquid", PLUME: "plume", SYRUP: "syrup", BNB: "binancecoin", XRP: "ripple", DOGE: "dogecoin",
  ADA: "cardano", LINK: "chainlink", SUI: "sui", TON: "the-open-network", TRX: "tron", DOT: "polkadot",
  ARB: "arbitrum", OP: "optimism", TIA: "celestia", INJ: "injective-protocol", SEI: "sei-network", APT: "aptos",
  PEPE: "pepe", AAVE: "aave", TAO: "bittensor", RENDER: "render-token", FET: "fetch-ai", JUP: "jupiter-exchange-solana",
  PENDLE: "pendle", ATOM: "cosmos", LTC: "litecoin", HBAR: "hedera-hashgraph", KAS: "kaspa", VIRTUAL: "virtual-protocol",
  EIGEN: "eigenlayer", STRK: "starknet", BONK: "bonk", WIF: "dogwifcoin", JTO: "jito-governance-token", PYTH: "pyth-network",
  ENS: "ethereum-name-service", MKR: "maker", SKY: "sky", MNT: "mantle", STX: "stacks", IMX: "immutable-x",
  GRT: "the-graph", RAY: "raydium", BERA: "berachain-bera", IP: "story-2", KAITO: "kaito", MOVE: "movement", WAL: "walrus-2",
};

// Coins named in a scan brief, in the order they first appear (max 12). Indicator words are ignored
// because only known coin symbols count.
export function watchlistFrom(text: string | null | undefined): string[] {
  const out: string[] = [];
  for (const m of (text ?? "").matchAll(/\b([A-Z][A-Z0-9]{1,9}?)(?:USDT|USDC|USD|\.P)?\b/g)) {
    const s = m[1];
    if (COINGECKO_IDS[s] && !out.includes(s)) out.push(s);
    if (out.length >= 12) break;
  }
  return out.length ? out : DEFAULT_SYMBOLS;
}

export type Price = { sym: string; usd: number; ch24: number | null };
export type PriceResult = { at: string; source: "coingecko" | "crypto.com" | "cache"; stale: boolean; prices: Price[] };

const CACHE_MS = 60_000;
const lastGood = new Map<string, { p: Price; at: number; source: PriceResult["source"] }>();
let memo: { key: string; at: number; res: PriceResult } | null = null;

async function getJson(url: string) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: "no-store", headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("status " + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fromCoinGecko(syms: string[]): Promise<Price[]> {
  const ids = syms.map((s) => COINGECKO_IDS[s]).filter(Boolean);
  const j = await getJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`);
  return syms.flatMap((s) => {
    const row = j?.[COINGECKO_IDS[s]];
    return row && typeof row.usd === "number" ? [{ sym: s, usd: row.usd, ch24: typeof row.usd_24h_change === "number" ? row.usd_24h_change : null }] : [];
  });
}

async function fromCryptoCom(syms: string[]): Promise<Price[]> {
  const j = await getJson("https://api.crypto.com/exchange/v1/public/get-tickers");
  const data: { i: string; a: string; c: string }[] = j?.result?.data ?? [];
  const by = new Map(data.map((d) => [d.i, d]));
  return syms.flatMap((s) => {
    const d = by.get(`${s}_USDT`) ?? by.get(`${s}_USD`);
    const usd = d ? parseFloat(d.a) : NaN;
    return isFinite(usd) ? [{ sym: s, usd, ch24: isFinite(parseFloat(d!.c)) ? parseFloat(d!.c) * 100 : null }] : [];
  });
}

export async function getPrices(symbols: string[]): Promise<PriceResult> {
  const syms = [...new Set(symbols.map((s) => s.toUpperCase()).filter((s) => /^[A-Z0-9]{2,10}$/.test(s)))].slice(0, 12);
  const key = syms.join(",");
  if (memo && memo.key === key && Date.now() - memo.at < CACHE_MS) return memo.res;

  let prices: Price[] = [], source: PriceResult["source"] = "coingecko";
  try { prices = await fromCoinGecko(syms); } catch { prices = []; }
  if (prices.length < syms.length) {
    try {
      const got = new Set(prices.map((p) => p.sym));
      const more = await fromCryptoCom(syms.filter((s) => !got.has(s)));
      if (!prices.length) source = "crypto.com";
      prices = [...prices, ...more];
    } catch { /* fall through to cache */ }
  }
  const now = Date.now();
  for (const p of prices) lastGood.set(p.sym, { p, at: now, source });

  let stale = false;
  if (!prices.length) {
    prices = syms.flatMap((s) => (lastGood.has(s) ? [lastGood.get(s)!.p] : []));
    source = "cache";
    stale = true;
  }
  const ordered = syms.flatMap((s) => prices.filter((p) => p.sym === s));
  const res: PriceResult = { at: new Date(stale && ordered.length ? Math.min(...ordered.map((p) => lastGood.get(p.sym)!.at)) : now).toISOString(), source, stale, prices: ordered };
  if (!stale) memo = { key, at: now, res };
  return res;
}
