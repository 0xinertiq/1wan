// Local browser harness (tests only, never deployed). Serves the app's client modules compiled on the fly
// (TypeScript to ES modules; "@/" and extensionless imports resolved), React from a CDN at the installed version,
// the real stylesheets, and fixture JSON for /api/*, so headless Chrome can mount the real Court and record every
// console error and uncaught exception. usage: node tests/browser/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const HERE = path.dirname(fileURLToPath(import.meta.url)), WEB = path.resolve(HERE, "../.."), SRC = path.join(WEB, "src");
const ver = (p) => JSON.parse(fs.readFileSync(path.join(WEB, "node_modules", p, "package.json"), "utf8")).version;
const R = ver("react");
const MAP = {
  react: `https://esm.sh/react@${R}`, "react/jsx-runtime": `https://esm.sh/react@${R}/jsx-runtime`,
  "react-dom": `https://esm.sh/react-dom@${R}?deps=react@${R}`, "react-dom/client": `https://esm.sh/react-dom@${R}/client?deps=react@${R}`,
  "astronomy-engine": `https://esm.sh/astronomy-engine@${ver("astronomy-engine")}`, "lightweight-charts": `https://esm.sh/lightweight-charts@${ver("lightweight-charts")}`,
};

function resolveFile(base) {
  for (const ext of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) { const f = base + ext; if (fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
  return null;
}
function compile(file) {
  const src = fs.readFileSync(file, "utf8");
  let out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: file }).outputText;
  out = out.replace(/(from\s+|import\s*\(\s*|import\s+)(["'])([^"']+)\2/g, (m, pre, q, spec) => {
    if (spec.endsWith(".css")) return `${pre}${q}data:text/javascript,${q}`;
    let base = null;
    if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(file), spec);
    if (!base) return m;
    // Markdown imports as plain text (as next.config.mjs does for crew/kumo.md)
    if (spec.endsWith(".md")) return `${pre}${q}data:text/javascript,${encodeURIComponent("export default " + JSON.stringify(fs.readFileSync(base, "utf8")))}${q}`;
    const f = resolveFile(base);
    return f ? `${pre}${q}/${path.relative(WEB, f).split(path.sep).join("/")}${q}` : m;
  });
  return out;
}

const fx = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures.json"), "utf8"));
// Optional real public payloads (built locally from the app's own loaders; never committed).
if (process.env.HARNESS_REALAPI) fx.api.real = { ...fx.api.full, ...JSON.parse(fs.readFileSync(process.env.HARNESS_REALAPI, "utf8")) };
const realUser = process.env.HARNESS_REALUSER ? JSON.parse(fs.readFileSync(process.env.HARNESS_REALUSER, "utf8")) : null;
if (realUser) fx.api.me = { ...(fx.api.real ?? fx.api.full), ...Object.fromEntries(Object.entries(realUser.api).filter(([, v]) => v)) };
const port = +(process.argv[2] ?? 4321);
const local = (p) => (p === "/__state.json" ? (realUser ? realUser.state : null) : p === "/__real.json" ? (process.env.HARNESS_REAL ? JSON.parse(fs.readFileSync(process.env.HARNESS_REAL, "utf8")) : null) : null);

// ?ssr=1 renders the tree on the server first and the page hydrates it, as Next does (needs node --import ./tests/tsx.mjs).
async function ssr(name) {
  const { loadData, buildTree } = await import(new URL("./harness.tsx", import.meta.url).href);
  const { renderToString } = await import("react-dom/server");
  const data = await loadData(name, async (p) => local(p));
  return { html: renderToString(buildTree(data)), data };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), p = decodeURIComponent(u.pathname);
  const send = (type, body, code = 200) => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };
  try {
    if (p === "/" || p === "/harness.html") {
      const name = u.searchParams.get("case") ?? "full";
      const pre = u.searchParams.get("ssr") ? await ssr(name) : null;
      const css = ["src/components/pixel.css", "src/app/(court)/tokens.css", "src/app/(court)/dashboard.css", "src/app/(court)/kumo-tokens.css", "src/app/(court)/kumo-new.css"].map((c) => `<link rel="stylesheet" href="/${c}">`).join("");
      return send("text/html", `<!doctype html><html lang="en" data-ui="new" data-theme="${u.searchParams.get("theme") ?? "dark"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}
<script type="importmap">${JSON.stringify({ imports: MAP })}</script>
<script>window.__errs=[];const ce=console.error;console.error=(...a)=>{window.__errs.push("console.error: "+a.map((x)=>x&&x.stack?x.stack.split("\\n").slice(0,3).join(" | "):String(x)).join(" ").slice(0,500));ce(...a)};
addEventListener("error",(e)=>window.__errs.push("uncaught: "+(e.error&&e.error.stack?e.error.stack.split("\\n").slice(0,4).join(" | "):e.message)));
addEventListener("unhandledrejection",(e)=>window.__errs.push("unhandled rejection: "+(e.reason&&e.reason.stack?e.reason.stack.split("\\n").slice(0,3).join(" | "):String(e.reason))));
${u.searchParams.get("ls") ? `try{const o=JSON.parse(decodeURIComponent(${JSON.stringify(u.searchParams.get("ls"))}));for(const k in o)localStorage.setItem(k,o[k]);}catch(e){}` : "localStorage.clear();"}
${pre ? `window.__SSR__=true;window.__DATA__=${JSON.stringify(pre.data).replace(/</g, "\\u003c")};` : ""}
</script></head><body><div id="root">${pre ? pre.html : ""}</div><pre id="errs"></pre>
<script type="module">import("/tests/browser/harness.tsx").then((m)=>m.run(${JSON.stringify(u.searchParams.get("case") ?? "full")})).catch((e)=>window.__errs.push("import: "+e.stack));
setTimeout(()=>{document.getElementById("errs").textContent="ERRS:"+JSON.stringify(window.__errs)+":END";},6000);</script></body></html>`);
    }
    if (p === "/__state.json" || p === "/__real.json") return send("application/json", JSON.stringify(local(p)));
    if (p.startsWith("/api/")) {
      const key = p.slice(5).replace(/\/$/, "");
      const caseName = req.headers["x-case"] ?? "full";
      const body = (fx.api[caseName] ?? fx.api.full)[key] ?? fx.api.full[key] ?? {};
      // placeholders: NOW, TODAY, TOMORROW (Singapore day keys), IN2H, IN1D
      const t = Date.now(), key8 = (ms) => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
      const subs = { NOW: new Date(t).toISOString(), TODAY: key8(t), TOMORROW: key8(t + 86400e3), IN2H: new Date(t + 2 * 3600e3).toISOString(), IN1D: new Date(t + 86400e3).toISOString() };
      return send("application/json", JSON.stringify(body).replace(/"(NOW|TODAY|TOMORROW|IN2H|IN1D)"/g, (m, w) => JSON.stringify(subs[w])));
    }
    const file = path.join(WEB, p);
    if (!file.startsWith(WEB) || !fs.existsSync(file)) return send("text/plain", "not found", 404);
    if (/\.(tsx?)$/.test(file)) return send("text/javascript", compile(file));
    if (file.endsWith(".json")) return send("text/javascript", "export default " + fs.readFileSync(file, "utf8"));
    if (file.endsWith(".css")) return send("text/css", fs.readFileSync(file, "utf8"));
    if (file.endsWith(".svg")) return send("image/svg+xml", fs.readFileSync(file));
    return send("application/octet-stream", fs.readFileSync(file));
  } catch (e) { send("text/plain", String(e && e.stack), 500); }
}).listen(port, () => console.log("harness on http://localhost:" + port));
