// Test-only stand-in for @supabase/ssr in the browser harness: every query resolves to an empty, error-free result.
const q = () => { const r = { data: [], error: null }; const p = new Proxy(function () {}, { get: (_, k) => (k === "then" ? (ok) => Promise.resolve(r).then(ok) : () => p), apply: () => p }); return p; };
export const createBrowserClient = () => ({ from: q, auth: { getUser: async () => ({ data: { user: null } }) } });
