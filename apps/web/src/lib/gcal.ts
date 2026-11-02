import { createAdminClient } from "@/lib/supabase/admin";
import { descText } from "@/lib/calendar";
import type { CalEvent } from "@/lib/court/state";
import { addDays, sgt } from "@/lib/court/time";

// Server only. Friends' Google Calendar through Google sign-in (OAuth), read-only (round 22). The tokens live in
// google_tokens (migration 0007), which only the service role can touch; they are never sent to the browser.
// Off until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in the server settings.
export const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth", TOKEN = "https://oauth2.googleapis.com/token", REVOKE = "https://oauth2.googleapis.com/revoke";
const API = "https://www.googleapis.com/calendar/v3";
const MAX_CALS = 8;

export const gcalConfig = () => {
  const id = (process.env.GOOGLE_CLIENT_ID ?? "").trim(), secret = (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
  return id && secret ? { id, secret } : null;
};
export const redirectUri = (origin: string) => origin + "/api/google/callback";

export function authUrl(origin: string, state: string): string | null {
  const c = gcalConfig();
  if (!c) return null;
  const q = new URLSearchParams({ client_id: c.id, redirect_uri: redirectUri(origin), response_type: "code", scope: "openid email " + SCOPE, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
  return AUTH + "?" + q;
}

type TokenRes = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; id_token?: string; error?: string };
async function tokenCall(body: Record<string, string>): Promise<TokenRes> {
  try {
    const r = await fetch(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body), cache: "no-store", signal: AbortSignal.timeout(10000) });
    return (await r.json().catch(() => ({ error: "bad_response" }))) as TokenRes;
  } catch { return { error: "unreachable" }; }
}
// The id_token comes straight from Google's token endpoint over TLS, so its email can be read without re-checking
// the signature; it is only shown back to the same person as "connected as …".
export const emailOf = (idToken?: string) => {
  try { return String(JSON.parse(Buffer.from((idToken ?? "").split(".")[1], "base64url").toString("utf8")).email ?? "") || null; } catch { return null; }
};

export type Saved = "connected" | "noscope" | "failed" | "unavailable";
/** Trades the one-time code for tokens and saves them for this account. */
export async function saveFromCode(userId: string, code: string, origin: string): Promise<Saved> {
  const c = gcalConfig(), db = createAdminClient();
  if (!c || !db) return "unavailable";
  const t = await tokenCall({ code, client_id: c.id, client_secret: c.secret, redirect_uri: redirectUri(origin), grant_type: "authorization_code" });
  if (!t.access_token) return "failed";
  if (!(t.scope ?? "").split(" ").includes(SCOPE)) return "noscope"; // they unticked calendar access on Google's screen
  const old = await db.from("google_tokens").select("refresh_token").eq("user_id", userId).maybeSingle();
  const refresh = t.refresh_token ?? old.data?.refresh_token;
  if (!refresh) return "failed";
  const { error } = await db.from("google_tokens").upsert({ user_id: userId, email: emailOf(t.id_token), refresh_token: refresh, access_token: t.access_token, expires_at: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(), scope: t.scope ?? SCOPE, updated_at: new Date().toISOString() });
  return error ? "failed" : "connected";
}

/** Forgets this account's tokens, and asks Google to revoke them. */
export async function disconnect(userId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  const { data } = await db.from("google_tokens").select("refresh_token").eq("user_id", userId).maybeSingle();
  if (data?.refresh_token) await fetch(REVOKE, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: data.refresh_token }), signal: AbortSignal.timeout(10000) }).catch(() => {});
  await db.from("google_tokens").delete().eq("user_id", userId);
}

/** Google's events in the app's calendar shape (Singapore time, like the owner's calendars). */
export type GEvent = { id?: string; status?: string; summary?: string; location?: string; description?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } };
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function toEvents(items: GEvent[], cal: string, color: string): CalEvent[] {
  const out: CalEvent[] = [];
  for (const e of items ?? []) {
    if (!e || e.status === "cancelled" || !e.start) continue;
    const title = (e.summary ?? "").trim() || "(no title)", loc = e.location || undefined, desc = e.description ? descText(e.description) || undefined : undefined;
    if (e.start.date && DAY.test(e.start.date)) {
      const ek = e.end?.date && DAY.test(e.end.date) ? e.end.date : addDays(e.start.date, 1);
      out.push({ id: `${e.id}@${e.start.date}`, title, cal, color, allDay: true, sk: e.start.date, ek, sm: 0, em: 0, loc, desc });
    } else if (e.start.dateTime) {
      const s = new Date(e.start.dateTime), en = new Date(e.end?.dateTime ?? e.start.dateTime);
      if (isNaN(s.getTime())) continue;
      const a = sgt(s), b = sgt(isNaN(en.getTime()) ? s : en);
      out.push({ id: `${e.id}@${s.getTime()}`, title, cal, color, allDay: false, sk: a.key, ek: b.key, sm: a.min, em: b.min, loc, desc });
    }
  }
  return out;
}

export type GoogleCal = { state: "off" | "live" | "error"; google: "none" | "connected" | "expired" | "unavailable"; account?: string; cals: { name: string; color: string; ok: boolean }[]; events: CalEvent[] };
const off = (google: GoogleCal["google"]): GoogleCal => ({ state: "off", google, cals: [], events: [] });

/** This account's own Google calendars, two days back to three months ahead, refreshing the token as needed. */
export async function loadGoogle(userId: string): Promise<GoogleCal> {
  const c = gcalConfig(), db = createAdminClient();
  if (!c || !db) return off("unavailable");
  const { data: row, error } = await db.from("google_tokens").select("email, refresh_token, access_token, expires_at").eq("user_id", userId).maybeSingle();
  if (error || !row) return off("none");
  const account = (row.email as string | null) ?? undefined;
  let token = row.access_token as string | null;
  if (!token || !row.expires_at || Date.parse(row.expires_at) < Date.now() + 60e3) {
    const t = await tokenCall({ refresh_token: row.refresh_token, client_id: c.id, client_secret: c.secret, grant_type: "refresh_token" });
    if (!t.access_token) {
      // revoked, or past its life (in Google's test mode a connection lasts 7 days): forget it, ask to connect again
      if (t.error === "invalid_grant") { await db.from("google_tokens").delete().eq("user_id", userId); return off("expired"); }
      return { ...off("connected"), state: "error", account };
    }
    token = t.access_token;
    await db.from("google_tokens").update({ access_token: token, expires_at: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
  }
  const get = async (u: string) => {
    const r = await fetch(u, { headers: { Authorization: "Bearer " + token }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (r.status === 401) throw new Error("expired");
    if (!r.ok) throw new Error("status " + r.status);
    return r.json();
  };
  try {
    const list = await get(API + "/users/me/calendarList?minAccessRole=reader&maxResults=50");
    const cals = ((list.items ?? []) as { id: string; summary?: string; summaryOverride?: string; backgroundColor?: string; selected?: boolean; primary?: boolean }[])
      .filter((x) => x.selected !== false || x.primary).slice(0, MAX_CALS);
    const today = sgt(new Date()).key;
    const q = new URLSearchParams({ timeMin: addDays(today, -2) + "T00:00:00+08:00", timeMax: addDays(today, 90) + "T00:00:00+08:00", singleEvents: "true", orderBy: "startTime", maxResults: "250" });
    const res = await Promise.allSettled(cals.map((x) => get(`${API}/calendars/${encodeURIComponent(x.id)}/events?${q}`)));
    const status: GoogleCal["cals"] = [];
    const events: CalEvent[] = [];
    res.forEach((r, i) => {
      const name = (cals[i].summaryOverride || cals[i].summary || "Calendar").slice(0, 24), color = cals[i].backgroundColor || "";
      status.push({ name, color, ok: r.status === "fulfilled" });
      if (r.status === "fulfilled") events.push(...toEvents(r.value.items ?? [], name, color));
    });
    events.sort((a, b) => a.sk.localeCompare(b.sk) || a.sm - b.sm);
    return { state: status.some((s) => s.ok) ? "live" : "error", google: "connected", account, cals: status, events: events.slice(0, 800) };
  } catch (e) {
    // a token Google no longer accepts: drop the cached one so the next load refreshes it
    if ((e as Error).message === "expired") await db.from("google_tokens").update({ access_token: null, updated_at: new Date().toISOString() }).eq("user_id", userId);
    return { ...off("connected"), state: "error", account };
  }
}
