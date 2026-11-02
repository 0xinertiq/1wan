// Round 22: the login gatekeeper (src/middleware.ts) with a stand-in for Supabase's session check, so it runs
// offline: signed out goes to /login (pages) or 401 (API); signed in, "/" and "/login" go to the dashboard; the
// scheduled-task routes and every other page pass through untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

globalThis.__gateUser = null;
const FAKE = "data:text/javascript," + encodeURIComponent("export const createServerClient = () => ({ auth: { getUser: async () => ({ data: { user: globalThis.__gateUser } }) } });");
registerHooks({ resolve: (spec, ctx, next) => (spec === "@supabase/ssr" ? { url: FAKE, shortCircuit: true } : next(spec === "next/server" ? "next/server.js" : spec, ctx)) });
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://x.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "x";
const { middleware } = await import("../src/middleware.ts");
const { NextRequest } = await import("next/server.js");

const go = async (path, user, method = "GET") => {
  globalThis.__gateUser = user;
  const r = await middleware(new NextRequest(new URL(path, "https://1wan.test"), { method }));
  return { status: r.status, to: r.headers.get("location") ? new URL(r.headers.get("location")).pathname : null };
};
const me = { id: "u1" };

test("signed out: pages go to the login screen, the API answers 401, the login screen opens", async () => {
  assert.deepEqual(await go("/", null), { status: 307, to: "/login" });
  assert.deepEqual(await go("/dashboard", null), { status: 307, to: "/login" });
  assert.equal((await go("/api/state", null, "POST")).status, 401);
  assert.deepEqual(await go("/login", null), { status: 200, to: null });
});

test("signed in: the login screen and the old page at / go to the dashboard; the dashboard and sign-out pass", async () => {
  assert.deepEqual(await go("/", me), { status: 307, to: "/dashboard" });
  assert.deepEqual(await go("/login", me), { status: 307, to: "/dashboard" });
  assert.deepEqual(await go("/dashboard", me), { status: 200, to: null });
  assert.deepEqual(await go("/auth/signout", me, "POST"), { status: 200, to: null });
  assert.deepEqual(await go("/crew", me), { status: 200, to: null });
});

test("the scheduled-task routes skip the session check", async () => {
  assert.deepEqual(await go("/api/ingest/brief", null, "POST"), { status: 200, to: null });
  assert.deepEqual(await go("/api/export/weekly", null), { status: 200, to: null });
  assert.deepEqual(await go("/api/news/refresh", null, "POST"), { status: 200, to: null }, "the news schedule (secret checked in the route)");
  assert.equal((await go("/api/news/shared", null)).status, 401, "reading the feed still needs a sign-in");
});
