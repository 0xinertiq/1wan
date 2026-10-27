// Server only. Telegram lane A (docs/build-telegram.md): public channels through their public web
// preview https://t.me/s/<handle>. No login, no token. Message text is untrusted data, shown as text only.
export type TgItem = { channel: string; title: string; id: number; at: string | null; text: string; link: string };
export type TgHealth = { handle: string; ok: boolean; at: string; items: number; error?: string; title?: string };

export const HANDLE = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const cache = new Map<string, { at: number; items: TgItem[]; title: string }>();
const TTL = 5 * 60 * 1000;

const decode = (s: string) => s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").trim();
// Ads, referral and promo posts are dropped by simple rules.
const isAd = (t: string) => /\b(ref(?:erral)?[=/]|promo ?code|sponsored|giveaway|airdrop link|join (?:now|our)|use my link)\b/i.test(t);

export function parsePreview(handle: string, html: string): { title: string; items: TgItem[] } {
  const title = decode((html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] ?? handle);
  const items: TgItem[] = [];
  for (const part of html.split('<div class="tgme_widget_message_wrap').slice(1)) {
    const post = (part.match(/data-post="([^"/]+)\/(\d+)"/) || []);
    if (!post[2]) continue;
    const at = (part.match(/<time datetime="([^"]+)"/) || [])[1] ?? null;
    const body = (part.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] ?? "";
    const text = decode(body).slice(0, 600);
    if (!text || isAd(text)) continue;
    items.push({ channel: handle, title, id: +post[2], at, text, link: `https://t.me/${post[1]}/${post[2]}` });
  }
  return { title, items: items.reverse() };
}

export async function fetchChannel(handle: string): Promise<{ items: TgItem[]; health: TgHealth }> {
  const now = new Date().toISOString();
  const hit = cache.get(handle);
  if (hit && Date.now() - hit.at < TTL) return { items: hit.items, health: { handle, ok: true, at: new Date(hit.at).toISOString(), items: hit.items.length, title: hit.title } };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(`https://t.me/s/${handle}`, { signal: ctl.signal, cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; 1wan-dashboard/1.0)" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    if (!html.includes("tgme_widget_message")) throw new Error("No public preview (private channel, or the layout changed)");
    const { title, items } = parsePreview(handle, html);
    cache.set(handle, { at: Date.now(), items, title });
    return { items, health: { handle, ok: true, at: now, items: items.length, title } };
  } catch (e) {
    const error = e instanceof Error ? (e.name === "AbortError" ? "Timed out" : e.message) : "Not reachable";
    return { items: hit?.items ?? [], health: { handle, ok: false, at: now, items: 0, error } };
  } finally { clearTimeout(t); }
}
