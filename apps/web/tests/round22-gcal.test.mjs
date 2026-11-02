// Round 22: friends' Google Calendar (lib/gcal.ts and /api/google/*), offline: a stand-in for the database and for
// Google. Read-only scope, declined or tampered answers go back to Settings, tokens refresh, an expired connection is
// forgotten and asked for again, and no token ever appears in what the browser receives.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
let row = null;
const calls = [];
const table = {
  select() { return table; }, eq() { return table; },
  maybeSingle: async () => ({ data: row, error: null }),
  upsert: async (r) => { row = { ...row, ...r }; return { error: null }; },
  update(u) { table._u = u; return { eq: async () => { row = row && { ...row, ...table._u }; return { error: null }; } }; },
  delete() { return { eq: async () => { row = null; return { error: null }; } }; },
};
globalThis.__gcalDb = { from: () => table };
globalThis.__gcalUser = { id: "friend1" };
const ADMIN = "data:text/javascript," + encodeURIComponent("export const createAdminClient = () => globalThis.__gcalDb;");
const SERVER = "data:text/javascript," + encodeURIComponent("export const createClient = async () => ({ auth: { getUser: async () => ({ data: { user: globalThis.__gcalUser } }) } });");
registerHooks({ resolve: (spec, ctx, next) => spec === "@/lib/supabase/admin" ? { url: ADMIN, shortCircuit: true } : spec === "@/lib/supabase/server" ? { url: SERVER, shortCircuit: true } : next(spec === "next/server" ? "next/server.js" : spec, ctx) });

let google = () => ({});
globalThis.fetch = async (u, o = {}) => {
  calls.push({ u: String(u), body: o.body ? String(o.body) : "" });
  const j = google(String(u), o);
  return new Response(JSON.stringify(j.body ?? j), { status: j.status ?? 200 });
};
const g = await import("../src/lib/gcal.ts");
const { GET: callback } = await import("../src/app/api/google/callback/route.ts");
const { GET: connect } = await import("../src/app/api/google/connect/route.ts");
const { NextRequest } = await import("next/server.js");
const idToken = "x." + Buffer.from(JSON.stringify({ email: "friend@example.com" })).toString("base64url") + ".y";

test("the consent link asks for read-only calendar access, a refresh token and carries the state", async () => {
  const u = new URL(g.authUrl("https://1wan.test", "st8"));
  assert.equal(u.origin + u.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(u.searchParams.get("scope"), "openid email https://www.googleapis.com/auth/calendar.readonly");
  assert.equal(u.searchParams.get("access_type"), "offline");
  assert.equal(u.searchParams.get("redirect_uri"), "https://1wan.test/api/google/callback");
  assert.equal(u.searchParams.get("state"), "st8");
  const r = await connect(new NextRequest("https://1wan.test/api/google/connect"));
  assert.equal(r.status, 307);
  assert.match(r.headers.get("set-cookie"), /gcal_state=[0-9a-f-]{36}; Path=\/api\/google; .*Max-Age=600; Secure; HttpOnly; SameSite=lax/i);
});

test("declined, a wrong state or no calendar permission go back to Settings with a friendly message", async () => {
  const back = async (q, cookie) => {
    const r = await callback(new NextRequest("https://1wan.test/api/google/callback?" + q, { headers: cookie ? { cookie: "gcal_state=" + cookie } : {} }));
    return new URL(r.headers.get("location")).search;
  };
  assert.equal(await back("error=access_denied&state=s1", "s1"), "?gcal=declined");
  assert.equal(await back("code=c1&state=other", "s1"), "?gcal=failed");
  assert.equal(await back("code=c1&state=s1"), "?gcal=failed", "no state cookie");
  row = null;
  google = () => ({ access_token: "at1", refresh_token: "rt1", expires_in: 3600, scope: "openid email" });
  assert.equal(await back("code=c1&state=s1", "s1"), "?gcal=noscope");
  assert.equal(row, null, "nothing saved");
  google = () => ({ access_token: "at1", refresh_token: "rt1", expires_in: 3600, scope: "openid email " + g.SCOPE, id_token: idToken });
  assert.equal(await back("code=c1&state=s1", "s1"), "?gcal=connected");
  assert.equal(row.refresh_token, "rt1");
  assert.equal(row.email, "friend@example.com");
  assert.equal(row.user_id, "friend1");
});

test("events load with a refreshed token; the browser's copy holds no token", async () => {
  row = { user_id: "friend1", email: "friend@example.com", refresh_token: "rt1", access_token: "old", expires_at: new Date(Date.now() - 1000).toISOString() };
  google = (u) => u.includes("oauth2.googleapis.com/token") ? { access_token: "fresh", expires_in: 3600 }
    : u.includes("calendarList") ? { items: [{ id: "primary", summary: "Me", backgroundColor: "#9fe1e7", primary: true }, { id: "hidden", summary: "Hidden", selected: false }] }
    : { items: [{ id: "e1", summary: "Lunch", start: { dateTime: "2026-11-03T04:00:00Z" }, end: { dateTime: "2026-11-03T05:00:00Z" } }] };
  const r = await g.loadGoogle("friend1");
  assert.equal(r.state, "live");
  assert.equal(r.google, "connected");
  assert.deepEqual(r.cals.map((c) => c.name), ["Me"], "only the calendars shown in their Google Calendar");
  assert.equal(r.events[0].title, "Lunch");
  assert.equal(r.events[0].sm, 12 * 60, "Singapore time");
  assert.equal(row.access_token, "fresh");
  assert.ok(!/rt1|fresh|old|secret/.test(JSON.stringify(r)), "no token or secret in the response");
});

test("an expired or revoked connection is forgotten and shows as expired", async () => {
  row = { user_id: "friend1", refresh_token: "rt1", access_token: null, expires_at: null };
  google = () => ({ status: 400, body: { error: "invalid_grant" } });
  const r = await g.loadGoogle("friend1");
  assert.equal(r.google, "expired");
  assert.equal(row, null);
  assert.equal((await g.loadGoogle("friend1")).google, "none");
});

test("Google events become the app's calendar shape: all-day, timed, cancelled", () => {
  const ev = g.toEvents([
    { id: "a", summary: "Trip", start: { date: "2026-11-05" }, end: { date: "2026-11-07" } },
    { id: "b", summary: "", start: { dateTime: "2026-11-05T09:30:00+08:00" }, end: { dateTime: "2026-11-05T10:00:00+08:00" } },
    { id: "c", status: "cancelled", summary: "Gone", start: { date: "2026-11-05" } },
    { id: "d", summary: "Odd", start: {} },
  ], "Me", "#fff");
  assert.equal(ev.length, 2);
  assert.deepEqual([ev[0].allDay, ev[0].sk, ev[0].ek], [true, "2026-11-05", "2026-11-07"]);
  assert.deepEqual([ev[1].title, ev[1].sk, ev[1].sm, ev[1].em], ["(no title)", "2026-11-05", 570, 600]);
});

test("without the Google keys it stays off; disconnect revokes at Google and deletes the row", async () => {
  row = { user_id: "friend1", refresh_token: "rt9" };
  calls.length = 0;
  await g.disconnect("friend1");
  assert.equal(row, null);
  assert.ok(calls.some((c) => c.u === "https://oauth2.googleapis.com/revoke" && c.body.includes("token=rt9")));
  delete process.env.GOOGLE_CLIENT_SECRET;
  assert.equal(g.authUrl("https://1wan.test", "s"), null);
  assert.equal((await g.loadGoogle("friend1")).google, "unavailable");
});
