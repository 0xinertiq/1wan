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
  "@supabase/ssr": "/tests/browser/supabase-stub.js",
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
<script>window.process={env:{}};window.__errs=[];const ce=console.error;console.error=(...a)=>{window.__errs.push("console.error: "+a.map((x)=>x&&x.stack?x.stack.split("\\n").slice(0,3).join(" | "):String(x)).join(" ").slice(0,500));ce(...a)};
addEventListener("error",(e)=>window.__errs.push("uncaught: "+(e.error&&e.error.stack?e.error.stack.split("\\n").slice(0,4).join(" | "):e.message)));
addEventListener("unhandledrejection",(e)=>window.__errs.push("unhandled rejection: "+(e.reason&&e.reason.stack?e.reason.stack.split("\\n").slice(0,3).join(" | "):String(e.reason))));
${u.searchParams.get("ls") ? `try{const o=JSON.parse(decodeURIComponent(${JSON.stringify(u.searchParams.get("ls"))}));for(const k in o)localStorage.setItem(k,o[k]);}catch(e){}` : "localStorage.clear();"}
${pre ? `window.__SSR__=true;window.__DATA__=${JSON.stringify(pre.data).replace(/</g, "\\u003c")};` : ""}
</script></head><body><div id="root">${pre ? pre.html : ""}</div><pre id="errs"></pre>
<script type="module">import("/tests/browser/harness.tsx").then((m)=>m.run(${JSON.stringify(u.searchParams.get("case") ?? "full")})).catch((e)=>window.__errs.push("import: "+e.stack));
{const pb=new URLSearchParams(location.search).get("probe");if(pb)setTimeout(()=>document.querySelectorAll(pb).forEach((el)=>{const c=getComputedStyle(el);window.__errs.push("probe "+(el.className||el.tagName)+" h="+Math.round(el.getBoundingClientRect().height)+" minH="+c.minHeight+" flex="+c.flex+" disp="+c.display);}),5800);}{const ck=new URLSearchParams(location.search).get("click");if(ck)setTimeout(()=>document.querySelector(ck)?.click(),5500);}setTimeout(()=>{document.querySelectorAll(".btn,.kseg button.on,.kmini button[aria-pressed=true],.hpick button.on").forEach((el)=>{const c=(getComputedStyle(el).backgroundColor.match(/[0-9.]+/g)||[]).map(Number);const a=c.length>3?c[3]:1;if(a>=0.99&&c[0]>220&&c[1]<170&&c[2]>120)window.__errs.push("solid pink button: "+(el.textContent||"").trim().slice(0,40));});if(new URLSearchParams(location.search).get("banner")==="1"){const se=document.scrollingElement;if(se.scrollWidth>se.clientWidth+1)window.__errs.push("page scrolls sideways: "+se.scrollWidth+" > "+se.clientWidth);const rooms=[...document.querySelectorAll(".kroom")].filter((r)=>r.offsetParent!==null);if(!rooms.length)window.__errs.push("no banner on this tab");rooms.forEach((r)=>{const sc=r.querySelector(".kroom-scroll");if(sc&&sc.scrollWidth>sc.clientWidth+1)window.__errs.push("banner scrolls sideways: "+sc.scrollWidth+" > "+sc.clientWidth);const rr=r.getBoundingClientRect(),art=r.querySelector(".kroom-art");if(!art)return;const a=art.getBoundingClientRect();if(a.left<rr.left-1||a.right>rr.right+1||a.top<rr.top-1||a.bottom>rr.bottom+1)window.__errs.push("banner art cropped");if(rr.left<-1||rr.right>innerWidth+1)window.__errs.push("banner wider than the window");if(Math.abs(a.width/a.height-20/3)>0.08)window.__errs.push("banner not at the 20:3 room shape: "+(a.width/a.height).toFixed(2));});}if(location.hash==="#garden"&&new URLSearchParams(location.search).get("case")==="full"&&!document.querySelector(".gbranches .gk[data-bp]"))window.__errs.push("no branch rows on the Garden");document.querySelectorAll(".gbranches .gk[data-bp]").forEach((el)=>{if(el.offsetParent===null)return;const cs=getComputedStyle(el),plain=getComputedStyle(document.documentElement).getPropertyValue("--k-surface").trim();const probe=document.createElement("i");probe.style.color=plain;document.body.appendChild(probe);const surf=getComputedStyle(probe).color;probe.remove();if(cs.backgroundImage==="none"&&cs.backgroundColor===surf)window.__errs.push("branch colour not applied: "+el.getAttribute("data-bp"));});if(new URLSearchParams(location.search).get("fit")==="1"){const se=document.scrollingElement;if(se.scrollHeight>innerHeight+2)window.__errs.push("page scrolls: "+se.scrollHeight+" > "+innerHeight);}const P18=new URLSearchParams(location.search),B18=(e)=>e.getBoundingClientRect();if(P18.get("nobanner")==="1"){const rs=[...document.querySelectorAll(".kroom")];if(!rs.length)window.__errs.push("banner code missing from the page");rs.forEach((r)=>{const b=B18(r);if(b.width>0||b.height>0)window.__errs.push("banner shown at phone width: "+Math.round(b.width)+"x"+Math.round(b.height));});}if(P18.get("luna")==="1"){const ss=[...document.querySelectorAll(".kluna-strip")].filter((x)=>x.offsetParent!==null);if(ss.length<2)window.__errs.push("Luna rows missing");else{const ls=ss.map((x)=>B18(x.querySelector("span")).left);if(Math.max(...ls)-Math.min(...ls)>1)window.__errs.push("Luna content starts differ: "+ls.map(Math.round).join(","));ss.forEach((x)=>{const b=x.querySelector("b"),sp=x.querySelector("span"),br=B18(b),pr=B18(sp),sr=B18(x);if(b.scrollWidth>b.clientWidth+1)window.__errs.push("Luna label overflows");if(pr.top<br.bottom-1&&br.right>pr.left+0.5)window.__errs.push("Luna label runs into its content");if(pr.right>sr.right+1||br.right>sr.right+1)window.__errs.push("Luna row overflows its strip");});const c=ss[0].cloneNode(true);c.querySelector("span").textContent=Array(14).fill("steady focus").join(" · ");ss[0].parentNode.appendChild(c);const sp=c.querySelector("span"),rg=document.createRange();rg.selectNodeContents(sp);const lines=new Map();[...rg.getClientRects()].forEach((q)=>{const t=Math.round(q.top);lines.set(t,Math.min(lines.has(t)?lines.get(t):1e9,q.left));});if(lines.size<2)window.__errs.push("Luna wrap check did not wrap");const l0=B18(sp).left;if(Math.abs(l0-ls[0])>1)window.__errs.push("Luna long row starts elsewhere");lines.forEach((v)=>{if(Math.abs(v-l0)>1)window.__errs.push("Luna wrapped line not aligned: "+Math.round(v)+" vs "+Math.round(l0));});c.remove();}}if((P18.get("fit")==="1"||P18.get("dunflow")==="1")&&location.hash==="#diary"){const se=document.scrollingElement;if(se.scrollWidth>se.clientWidth+1)window.__errs.push("Dungeon page scrolls sideways");const wk=document.getElementById("dungeon-week"),yp=document.querySelector(".kd-pages-card");if(!wk||!yp||!wk.closest(".kd-pages")||!yp.closest(".kd-pages"))window.__errs.push("look-back or Your pages not in the left column");else if(B18(wk).bottom>B18(yp).top+1)window.__errs.push("Weekly look-back is not above Your pages");const rt=[...document.querySelectorAll(".kd-side>section>.win-title>h2,.kd-side .kd-sec-h>.sec-h")].map((x)=>x.textContent).join(" / ");if(rt!=="Today's gratitude / Mood and tags / Trade reflection")window.__errs.push("right column order: "+rt);}if(P18.get("nocolscroll")==="1"&&location.hash==="#diary"){if(P18.get("full6")==="1"){const ul=document.querySelector(".kd-week .rv-sug");if(ul){const n=6-ul.children.length;for(let i=0;i<n;i++){const li=document.createElement("li");li.textContent=["5 days with a win or a thank-you","Average mood 3.8 of 5","Most used tags: #focus, #sleep, #trading","9 of 14 daily quests done"][i%4];ul.insertBefore(li,ul.lastElementChild);}}}if(P18.get("full6")==="1"){const lb=document.querySelector(".kd-pages>section:last-child>.win-body");if(lb){lb.innerHTML="";for(let i=0;i<12;i++){const r=document.createElement("div");r.className="krow kgrat";const b=document.createElement("b");b.textContent="Tue 2"+i+" Oct";const n=document.createElement("p");n.className="note";n.textContent="Closed the week calmly and logged every trade";r.append(b,n);lb.appendChild(r);}}}const se=document.scrollingElement;if(se.scrollHeight!==se.clientHeight||se.scrollWidth!==se.clientWidth)window.__errs.push("Dungeon page scrolls: "+se.scrollWidth+"x"+se.scrollHeight+" in "+se.clientWidth+"x"+se.clientHeight);document.querySelectorAll(".kdun>.kcol").forEach((c)=>{if(c.scrollHeight!==c.clientHeight)window.__errs.push("column scrolls: "+c.className+" "+c.scrollHeight+" > "+c.clientHeight);});const log=document.querySelector(".kd-pages>section:last-child>.win-body");if(P18.get("full6")==="1"&&log){const head=log.previousElementSibling,t0=head.getBoundingClientRect().top;if(getComputedStyle(log).overflowY!=="auto"||log.scrollHeight<=log.clientHeight)window.__errs.push("a long Gratitude log does not scroll inside its card");if(log.clientHeight<44)window.__errs.push("Gratitude log list shows less than one row: "+log.clientHeight);log.scrollTop=80;if(Math.abs(head.getBoundingClientRect().top-t0)>0.5)window.__errs.push("Gratitude log header moves when its list scrolls");log.scrollTop=0;}document.querySelectorAll(".kdun *").forEach((el)=>{if(el===log||el.tagName==="TEXTAREA")return;const o=getComputedStyle(el).overflowY;if((o==="auto"||o==="scroll")&&el.scrollHeight>el.clientHeight+1)window.__errs.push("scrolls inside: "+(el.className||el.tagName));});document.querySelectorAll(".kdun .kcard>.win-title").forEach((t)=>{if(t.scrollWidth>t.clientWidth+1)window.__errs.push("card header cropped: "+t.textContent.slice(0,30)+" "+t.scrollWidth+" > "+t.clientWidth+" h2="+Math.round(t.firstElementChild.getBoundingClientRect().width));});}if(P18.get("dunflow")==="1"&&location.hash==="#diary"){if(document.querySelector(".kdun-page.fit"))window.__errs.push("Dungeon one-screen fit is still on");const dr=document.querySelector(".kdun-page .kroom");if(!dr)window.__errs.push("no Dungeon banner");else{const pr=dr.cloneNode(true);document.body.appendChild(pr);const a1=getComputedStyle(dr).maxWidth,a2=getComputedStyle(pr).maxWidth;pr.remove();if(a1!==a2)window.__errs.push("Dungeon banner width differs from the other tabs: "+a1+" vs "+a2);}const pn=document.querySelector(".kdun-panel");if(!pn||!pn.querySelector(":scope>.win-title"))window.__errs.push("no Journal panel with a header strip");if(document.querySelector(".kdun-panel .kcard"))window.__errs.push("a card inside the Journal panel");const hs=[...document.querySelectorAll(".kdun-panel .kd-sec-h>.sec-h")].map((x)=>x.textContent).join(" / ");if(hs!=="Weekly look-back / Your pages / Gratitude log / Today's page / Today's gratitude / Mood and tags / Trade reflection")window.__errs.push("sections: "+hs);document.querySelectorAll(".kdun>.ksplit-col").forEach((c)=>{if(c.scrollHeight>c.clientHeight+1)window.__errs.push("column scrolls inside itself: "+c.className);});const ul=document.querySelector(".kd-week .rv-sug");if(!ul||parseFloat(getComputedStyle(ul).rowGap)<12)window.__errs.push("Weekly look-back still compact");const ta=document.querySelector(".kd-edit textarea");if(!ta||ta.getBoundingClientRect().height<359)window.__errs.push("writing area under 360px");const rows=[...document.querySelectorAll(".kgrat-log .kgrat-row")];if(location.search.includes("case=grat")){if(rows.length<4)window.__errs.push("Gratitude log sample rows missing: "+rows.length);if(rows.some((r)=>r.getAttribute("aria-expanded")!=="false"))window.__errs.push("a Gratitude log row starts open");rows.forEach((r)=>{if(Math.round(r.getBoundingClientRect().height)>Math.round(parseFloat(getComputedStyle(r).lineHeight)||24)+20)window.__errs.push("Gratitude log row taller than one line: "+Math.round(r.getBoundingClientRect().height));const f=r.querySelector(".kgrat-first");if(f&&f.scrollWidth>f.clientWidth+1&&getComputedStyle(f).textOverflow!=="ellipsis")window.__errs.push("long first line not cut with an ellipsis");});const ds=[...document.querySelectorAll(".kgrat-log .kgrat")];const gaps=ds.slice(1).map((d,i)=>Math.round(B18(d).top-B18(ds[i]).bottom));if(gaps.some((g)=>g>1))window.__errs.push("gaps between Gratitude log days: "+gaps.join(","));}}document.getElementById("errs").textContent="ERRS:"+JSON.stringify(window.__errs)+":END";},6000);</script></body></html>`);
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
    if (file.endsWith(".js")) return send("text/javascript", fs.readFileSync(file, "utf8"));
    if (file.endsWith(".json")) return send("text/javascript", "export default " + fs.readFileSync(file, "utf8"));
    if (file.endsWith(".css")) return send("text/css", fs.readFileSync(file, "utf8"));
    if (file.endsWith(".svg")) return send("image/svg+xml", fs.readFileSync(file));
    return send("application/octet-stream", fs.readFileSync(file));
  } catch (e) { send("text/plain", String(e && e.stack), 500); }
}).listen(port, () => console.log("harness on http://localhost:" + port));
