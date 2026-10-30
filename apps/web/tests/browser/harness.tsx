// Browser harness entry (tests only): the real header, tabs and Court with the real provider and loaders, fed by
// fixture APIs (tests/browser/fixtures.json) and fixture briefs and state for the chosen case. The same tree can
// be rendered on the server (serve.mjs ?ssr=1) and then hydrated here, as the real page is.
import { createRoot, hydrateRoot } from "react-dom/client";
import { CourtProvider } from "@/components/court/CourtState";
import { CalendarLoader } from "@/components/court/CalendarLoader";
import { PricesLoader } from "@/components/court/Prices";
import { PixelDefs } from "@/components/PixelSprite";
import { Header } from "@/components/court/Header";
import { AppTabs } from "@/components/court/AppTabs";
import { CourtLayout } from "@/components/court/live/KumoHome";
import { NewOnly } from "@/components/kumo/NewOnly";
import { TradesPage } from "@/components/court/pages/TradesPage";
import { CalendarPage } from "@/components/court/pages/CalendarPage";
import { LifeHub } from "@/components/court/pages/LifeHub";
import { DungeonPage } from "@/components/court/pages/Dungeon";
import { GardenPage } from "@/components/court/pages/GardenPage";
import { NewsPage } from "@/components/court/pages/NewsPage";
import { InboxProvider } from "@/components/court/pages/Inbox";
import { AlertsProvider } from "@/components/court/Alerts";
import { SettingsPage } from "@/components/court/pages/SettingsPage";
import { KingdomPage, WelcomePage } from "@/components/court/pages/Welcome";
import { CrewRoster, LivingWorld } from "@/components/court/live/LivingWorld";
import { NeedsNow, WeekAhead } from "@/components/court/live/CourtHome";
import { BriefsBlock, BriefsLibrary, MoversCard, type DeskMem } from "@/components/court/CourtBriefs";
import { StatusLine } from "@/components/court/StatusLine";
import { EconLive } from "@/components/court/live/EconLive";
import { TodayLive } from "@/components/court/live/TodayLive";
import { CalendarTab } from "@/components/court/live/CalendarTab";
import { TechLive } from "@/components/court/live/TechLive";
import { NewsLive } from "@/components/court/NewsLive";
import { DiaryLive, GardenLive, WinsButton } from "@/components/court/live/GrowLive";
import { LifeTabs } from "@/components/court/LifeTabs";
import { LunaSky } from "@/components/court/live/LunaSky";
import { CourtSheet } from "@/components/court/CourtSheet";
import { mdLite } from "@/components/court/mdLite";
import { normalize } from "@/lib/court/state";
import { bootState } from "@/lib/court/actions";
import { addDays, sgtKeyOf, stampAge } from "@/lib/court/time";
import { canonKind } from "@/lib/briefKinds";
import { noBigdata } from "@/lib/noBigdata";
import type { BriefDoc } from "@/components/court/BriefTabs";

const BODIES: Record<string, string> = {
  intel: "Daily Intel Brief\n\nCalm.\n\n## Top 5 headlines\n\n**The Fed holds.** Why. — [CNBC](https://a.example)\n\n## Asia\n\n**Kospi up.** Chips. — [AP](https://b.example)",
  scan: "Crypto Watchlist Scan\n\nMajors hold.\n\n## Movers\n\n**ZRO +12% day** unlock.\n\n## Style Map\n\n| Bucket | Coins (score) |\n|---|---|\n| A Pullback now | ZRO 75 |",
  pulse: "Pulse Morning Brief\n\n## VC and tech deals\n\n- one deal",
  review: "Chief Kumo weekly review\n\nA calm week.\n\nIntel: filed.\n\n- Sleep earlier",
  movers: "No notable movers at 14:30.",
};
const doc = (key: string, body: string | null, at: string, when: string): BriefDoc => ({ key, label: key, title: key + " brief", when, html: mdLite(body ?? ""), top: [], body: body ?? undefined, at, sources: "RSS", vote: null });

export type Data = { nowIso: string; docs: BriefDoc[]; mem: Record<string, DeskMem>; raw: unknown };

// Everything the tree needs, from the case name; `get` reads the harness's JSON (fetch in the browser, files on
// the server), so both sides build identical data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadData(name: string, get: (p: string) => Promise<any>, nowIso = new Date().toISOString()): Promise<Data> {
  const now = new Date(nowIso), k = sgtKeyOf(now), at = new Date(now.getTime() - 2 * 3600e3).toISOString(), when = stampAge(at, now);
  let docs: BriefDoc[] = [], mem: Record<string, DeskMem> = { intel: { lessons: ["Prefer primary sources"], stats: { n: 1, up: 1, down: 0 } } };
  if (name === "real" || name === "me") {
    const j = await get("/__real.json");
    for (const b of j?.briefs ?? []) { const kind = canonKind(b.kind); if (!kind) continue; const body = noBigdata(b.body); docs.push({ key: kind, label: kind, title: noBigdata(b.title || kind), when: stampAge(b.at, now), html: mdLite(body), top: [], body, at: b.at, sources: noBigdata(b.meta?.sources ?? null), vote: null }); }
    mem = Object.fromEntries((j?.mem ?? []).map((m: { key: string; data: DeskMem }) => [m.key, m.data]));
  } else if (name.startsWith("broken")) docs = [doc("intel", "", at, when), doc("scan", null, at, when), doc("review", "x", at, when)];
  else if (!name.startsWith("empty")) docs = Object.entries(BODIES).map(([kk, b]) => doc(kk, b, at, when));
  const raw = name === "me" ? await get("/__state.json")
    : name.includes("old") ? { v: 1, life: [{ id: "x", name: "Spotify", cat: "bill", amt: 9.9, rule: { type: "dom", d: 28 }, lead: 0, autoPaid: "yes" }, { name: "broken" }, null], spr: { run: { at: new Date(now.getTime() - 5 * 60e3).toISOString(), tag: "study" }, log: [{ at: "bad", tag: "x", min: 25 }] }, tails: [0, 1, "x"], restDay: k, uq: ["A saved quote."] }
    : name.startsWith("empty") ? {}
    // round 21: "grat" is the full case plus a few evenings in the Gratitude log (made-up sample lines)
    : name === "grat" ? { lvl: 4, xp: 30, streak: 3, wins: Object.fromEntries([1, 2, 4, 5, 7].map((n, i) => [addDays(k, -n), { w: ["Closed the week calmly and logged every trade, even the small scalp that went nowhere", "A long walk before the open", "Stuck to the plan on SOL", "Slept well", "Cooked dinner instead of ordering in"][i], g: "Quiet mornings", ...(i === 0 ? { n: "Line one of the notes.\nLine two of the notes." } : {}) }])) }
    : { lvl: 4, xp: 30, streak: 3, dump: [{ id: "d1", t: "call mum", done: false, ts: 1 }], life: [{ id: "l1", name: "Dog grooming", cat: "pet", amt: null, rule: { type: "dom", d: 29 }, lead: 3, important: true }] };
  return { nowIso, docs, mem, raw };
}

export function buildTree(d: Data) {
  const k = sgtKeyOf(d.nowIso), boot = bootState(normalize(d.raw, k), k), docs = d.docs;
  const docOf = (kk: string) => docs.find((x) => x.key === kk) ?? null;
  const filed = Object.fromEntries(docs.map((x) => [x.key, x.at]));
  const latest = Object.fromEntries(docs.map((x) => [x.key, { title: x.title, at: x.at }]));
  const s = {
    weather: null, today: <TodayLive />, todayBare: <TodayLive bare />, stage: null, statusLine: <StatusLine latest={latest} />, luna: <LunaSky />,
    brief: null, scan: null, tech: <TechLive />, weekStrip: null, weekAhead: <WeekAhead />, econ: <EconLive />, news: <NewsLive />, needs: <NeedsNow unrated={["Intel"]} />,
    status: null, briefs: <BriefsBlock docs={{ pulse: docOf("pulse"), intel: docOf("intel"), scan: docOf("scan") }} mem={d.mem} />,
    world: <LivingWorld filed={filed} />, roster: <CrewRoster filed={filed} />,
  };
  return (
    <InboxProvider briefs={docs.map((x) => ({ key: x.key, label: x.label, at: x.at }))} review={docOf("review")?.at ?? null}>
    <CourtProvider initial={boot.st} version={0} recap={boot.recap} dirty={boot.dirty} nowIso={d.nowIso}>
      <AlertsProvider>
      <CalendarLoader />
      <PricesLoader symbols={["BTC", "SOL", "ZRO"]} />
      <div className="wrap">
        <PixelDefs />
        <Header />
        <AppTabs
          extra={{
            trades: <NewOnly><TradesPage movers={<MoversCard list={docs.filter((x) => x.key === "movers")} bare />} tech={<TechLive />} scan={docOf("scan")} intel={docOf("intel")} /></NewOnly>,
            settings: <NewOnly><SettingsPage review={<BriefsLibrary history={docs} only={["review"]} bare />} /></NewOnly>,
            kingdom: <NewOnly><KingdomPage world={<LivingWorld filed={filed} />} /></NewOnly>,
            welcome: <NewOnly><WelcomePage /></NewOnly>,
            news: <NewOnly><NewsPage headlines={<NewsLive top5={["The Fed holds."]} follow />} /></NewOnly>,
          }}
          panels={{
            court: <CourtLayout s={s} />,
            calendar: <NewOnly classic={<CalendarTab />}><CalendarPage main={<CalendarTab noWeek />} econ={<EconLive />} /></NewOnly>,
            garden: <NewOnly classic={<div className="tabcol"><GardenLive /></div>}><GardenPage /></NewOnly>,
            diary: <NewOnly classic={<div className="tabcol"><WinsButton /><DiaryLive open /></div>}><DungeonPage /></NewOnly>,
            life: <NewOnly classic={<div className="tabcol"><LifeTabs /></div>}><LifeHub /></NewOnly>,
          }}
        />
        <CourtSheet latest={latest} />
      </div>
      </AlertsProvider>
    </CourtProvider>
    </InboxProvider>
  );
}

export async function run(name: string) {
  const orig = window.fetch.bind(window);
  window.fetch = ((u: RequestInfo | URL, o: RequestInit = {}) => orig(u, { ...o, headers: { ...(o.headers as Record<string, string>), "x-case": name.split("-")[0] } })) as typeof fetch;
  const w = window as unknown as { __DATA__?: Data; __SSR__?: boolean };
  const data = w.__DATA__ ?? (await loadData(name, async (p) => (await orig(p)).json()));
  const root = document.getElementById("root")!;
  if (w.__SSR__) hydrateRoot(root, buildTree(data), { onRecoverableError: (e) => console.error("recoverable: " + String((e as Error)?.message ?? e).slice(0, 300)) });
  else createRoot(root).render(buildTree(data));
}
