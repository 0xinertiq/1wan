// Browser check (npm run test:browser): starts the local harness and opens the real Court in headless Chrome with
// empty, partial, broken, old-format, rain and full data; client-only and server-rendered then hydrated; day and
// night; desktop and phone; and with old or broken values saved in the browser. Fails on any console error,
// any button with a solid pink fill (round 7), or
// uncaught exception. Needs Chrome (CHROME env or the default Windows path) and network access for React from
// esm.sh. Optional local real-data files: HARNESS_REAL, HARNESS_REALAPI, HARNESS_REALUSER (never committed).
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 4399;
const server = spawn(process.execPath, ["--import", "./tests/tsx.mjs", "tests/browser/serve.mjs", String(PORT)], { cwd: WEB, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));

const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const oldStorage = encodeURIComponent(JSON.stringify({
  "kumo.ui": "new", "kumo.theme": "dark", "1wan-cal-view": "agenda", ["1wan-seen-" + today]: '{"a":1}', ["1wan.v2.seen." + today]: '{"a":1}',
  "1wan-sprint-pause": '{"at":"x"}', "1wan.v2.sprint-pause": "not json", "1wan-review-read": "garbage", "1wan-review-latest": "2020-01-01", "1wan-fold-needWin": "0",
}));
const cases = ["full", "empty", "broken", "full-old", "rain", "cloudy", ...(process.env.HARNESS_REAL ? ["real"] : []), ...(process.env.HARNESS_REALUSER ? ["me"] : [])];
const runs = [];
for (const c of cases) for (const theme of ["dark", "light"]) for (const size of ["1280,900", "390,844"]) runs.push({ c, theme, size, ssr: false, ls: "" });
for (const c of ["full", "empty", "broken"]) runs.push({ c, theme: "dark", size: "1280,900", ssr: true, ls: "" }, { c, theme: "dark", size: "1280,900", ssr: false, ls: oldStorage });
// Round 6: every tab opened by its address (all panels stay mounted, so each page's effects run), with odd
// preview records saved on the device, day and night, desktop and phone.
const oddRecords = encodeURIComponent(JSON.stringify({ "1wanvault.v1.journal_entries": '[{"id":"j1","day":"2026-10-28","text":null,"tags":"x"}]', "1wanvault.v1.tasks": '{"not":"a list"}', "1wanvault.v1.routines": '[{"id":"r","name":"Dog","every":"x"}]', "1wanvault.v1.research_notes": '[{"id":"n","kind":"note","tags":null}]', "1wanvault.v1.goals": '[{"id":"g","title":"Move","ms":null}]', "1wanvault.v1.finance_entries": '[{"id":"f","kind":"budget","cat":"food","amt":"x"}]', "1wan.v2.inbox.read": "nope" }));
for (const tab of ["trades", "calendar", "life", "diary", "garden", "news", "settings", "kingdom", "welcome", "observatory"]) for (const [theme, size] of [["light", "1280,900"], ["dark", "390,844"]]) runs.push({ c: "full", theme, size, ssr: false, ls: oddRecords, hash: tab });
for (const tab of ["life", "diary", "news"]) runs.push({ c: "empty", theme: "light", size: "1280,900", ssr: false, ls: "", hash: tab }, { c: "broken-old", theme: "dark", size: "820,1180", ssr: false, ls: oldStorage, hash: tab });

// Round 12: the Dungeon fits one screen at common desktop sizes (no page scroll), with full sample data.
for (const size of ["1280,720", "1440,900"]) runs.push({ c: "full", theme: "light", size, ssr: false, ls: "", hash: "diary", fit: true });
let failed = 0;
for (const r of runs) {
  const url = `http://localhost:${PORT}/harness.html?case=${r.c}&theme=${r.theme}${r.ssr ? "&ssr=1" : ""}${r.ls ? "&ls=" + r.ls : ""}${r.fit ? "&fit=1" : ""}${r.hash ? "#" + r.hash : ""}`;
  let out = "";
  try { out = execFileSync(CHROME, ["--headless=new", "--disable-gpu", `--window-size=${r.size}`, "--virtual-time-budget=10000", "--dump-dom", url], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 90000 }); } catch (e) { out = String(e.stdout ?? ""); }
  const m = out.match(/ERRS:(\[.*?\]):END/s), errs = m ? JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")) : ["no result (page did not finish)"];
  const label = `${r.c} ${r.theme} ${r.size}${r.ssr ? " ssr" : ""}${r.ls ? " saved-values" : ""}${r.hash ? " #" + r.hash : ""}${r.fit ? " fits" : ""}`;
  if (errs.length) { failed++; console.log("FAIL", label, "\n  " + errs.join("\n  ")); } else console.log("ok  ", label);
}
server.kill();
console.log(failed ? `${failed} of ${runs.length} runs had errors` : `all ${runs.length} runs clean`);
process.exit(failed ? 1 : 0);
