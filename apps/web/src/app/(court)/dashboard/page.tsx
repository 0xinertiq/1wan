import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PixelDefs } from "@/components/PixelSprite";
import { CourtDefs } from "@/components/court/CourtDefs";
import { Header } from "@/components/court/Header";
import { Stage } from "@/components/court/Stage";
import { mdLite } from "@/components/court/mdLite";
import { topThree } from "@/lib/briefTop";
import type { BriefDoc } from "@/components/court/BriefTabs";
import { ScanWin } from "@/components/court/ScanWin";
import { loadBriefs, kindLabel, type BriefRow, type Vote } from "@/lib/briefs";
import { BriefWin } from "@/components/court/Windows";
import { NeedsNow, WeatherLine, WeekAhead, WeekStrip } from "@/components/court/live/CourtHome";
import { CalendarTab } from "@/components/court/live/CalendarTab";
import { LunaSky } from "@/components/court/live/LunaSky";
import { TechLive } from "@/components/court/live/TechLive";
import { EconLive } from "@/components/court/live/EconLive";
import { AppTabs } from "@/components/court/AppTabs";
import { LifeTabs } from "@/components/court/LifeTabs";
import { StatusLine, type Latest } from "@/components/court/StatusLine";
import { CourtSheet } from "@/components/court/CourtSheet";
import { NewsLive } from "@/components/court/NewsLive";
import { CourtProvider } from "@/components/court/CourtState";
import { CalendarLoader } from "@/components/court/CalendarLoader";
import { PricesLoader } from "@/components/court/Prices";
import { watchlistFrom } from "@/lib/prices";
import { KumoPick, MomoCard, TodayLive } from "@/components/court/live/TodayLive";
import { CourtLayout } from "@/components/court/live/KumoHome";
import { CrewRoster, LivingWorld } from "@/components/court/live/LivingWorld";
import { BriefsBlock, BriefsLibrary, MoversCard, ReviewCard, type DeskMem } from "@/components/court/CourtBriefs";
import { LiveWatch } from "@/components/court/live/LiveWatch";
import { noBigdata } from "@/lib/noBigdata";

// Desk notes go through the same Bigdata scrubber; a note left empty is dropped.
const cleanMem = (m: DeskMem): DeskMem => {
  const list = (a?: string[]) => (a ?? []).map((x) => noBigdata(String(x))).filter(Boolean);
  return { ...m, lessons: list(m.lessons), sourceNotes: list(m.sourceNotes), selfCheck: m.selfCheck ? noBigdata(String(m.selfCheck)) || undefined : undefined };
};
import { NewOnly } from "@/components/kumo/NewOnly";
import { TradesPage } from "@/components/court/pages/TradesPage";
import { CalendarPage } from "@/components/court/pages/CalendarPage";
import { LifeHub } from "@/components/court/pages/LifeHub";
import { DungeonPage } from "@/components/court/pages/Dungeon";
import { GardenPage } from "@/components/court/pages/GardenPage";
import { NewsPage } from "@/components/court/pages/NewsPage";
import { topFive } from "@/components/kumo/briefParse";
import { DiaryLive, GardenLive, StatusLive, WinsButton } from "@/components/court/live/GrowLive";
import { bootState } from "@/lib/court/actions";
import { normalize } from "@/lib/court/state";
import { sgtKeyOf, stampAge } from "@/lib/court/time";
import { Boundary } from "@/components/court/Boundary";

export const dynamic = "force-dynamic";

const dayKey = (d: Date) => sgtKeyOf(d);

function toDoc(b: BriefRow, now: Date, vote: Vote): BriefDoc {
  const at = new Date(b.at);
  const ok = !isNaN(at.getTime());
  // Every brief, review and scan is shown through the Bigdata scrubber (display only; stored data untouched).
  const body = noBigdata(b.body);
  return {
    key: b.kind,
    label: kindLabel(b.kind),
    title: noBigdata((b.title || kindLabel(b.kind)).slice(0, 120)),
    when: ok ? stampAge(at, now) : "",   // "Today 07:52 SGT · 5h ago" (lib/court/time.ts)
    html: mdLite(body),
    top: topThree(body),
    body,
    at: b.at,
    sources: noBigdata(b.sources),
    vote,
  };
}

// The v52 dashboard, now in five tabs. Briefs, Today, habits, garden, wins, diary and status run on her saved state.
export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS returns shared briefs plus this user's own. Kind names go through lib/briefKinds.
  const now = new Date();
  const { rows, freshest, votes, all } = await loadBriefs(supabase, user.id);
  const docs = rows.map((b) => toDoc(b, now, votes[b.kind] ?? null));
  // Brief history for the News tab (and the movers card): every row already read, newest first.
  const history = all.map((b) => toDoc(b, now, b.at === rows.find((r) => r.kind === b.kind)?.at ? votes[b.kind] ?? null : null));
  const initial = freshest; // v52 opens the freshest brief.
  const scanDoc = docs.find((d) => d.key === "scan") ?? null;
  const filed = Object.fromEntries(rows.map((r) => [r.kind, r.at]));
  const docOf = (k: string) => docs.find((d) => d.key === k) ?? null;
  const scanWin = <ScanWin doc={scanDoc} />;
  // Today's Top 5 headlines, so the News feed can tag them instead of repeating them.
  const top5 = topFive(docOf("intel")?.body ?? "").items.map((h) => h.title);
  const latest: Latest = Object.fromEntries(rows.map((r) => [r.kind, { title: r.title, at: r.at }]));

  // Her state document; missing keys fall back to defaults. Rollover and the morning-brief quest
  // are applied here so the first paint is already right; the client saves what changed.
  const { data: row } = await supabase.from("user_state").select("data, version").eq("user_id", user.id).maybeSingle();
  const today = dayKey(now);
  const boot = bootState(normalize(row?.data ?? {}, today), today);
  // What each desk has learned (her agent memory, read-only under RLS), for the Briefs card.
  const { data: memRows } = await supabase.from("agent_memory").select("key, data");
  const mem: Record<string, DeskMem> = Object.fromEntries((memRows ?? []).map((m) => [m.key, cleanMem((m.data ?? {}) as DeskMem)]));
  // Today's briefs still waiting for a rating: one line in Needs you now.
  const unrated = docs.filter((d) => ["pulse", "intel", "scan"].includes(d.key) && !d.vote && dayKey(new Date(d.at)) === today).map((d) => d.label);

  return (
    <CourtProvider initial={boot.st} version={row?.version ?? 0} recap={boot.recap} dirty={boot.dirty} nowIso={now.toISOString()}>
    <CalendarLoader />
    <PricesLoader symbols={watchlistFrom(rows.find((r) => r.kind === "scan")?.body)} />
    <div className="wrap">
      <PixelDefs />
      <CourtDefs />
      <Boundary name="Header"><Header /></Boundary>
      <AppTabs
        extra={{
          trades: (
            <NewOnly>
              <TradesPage left={<><LiveWatch /><MoversCard list={history.filter((d) => d.key === "movers")} /><TechLive /></>} scan={scanDoc} intel={docOf("intel")} />
            </NewOnly>
          ),
          news: (
            <NewOnly>
              <NewsPage headlines={<NewsLive top5={top5} />} library={<BriefsLibrary history={history} />} />
            </NewOnly>
          ),
        }}
        panels={{
          court: (
            <CourtLayout
              s={{
                weather: <WeatherLine />,
                today: <TodayLive />,
                todayBare: <TodayLive bare />,
                stage: <Stage filed={filed} />,
                statusLine: <StatusLine latest={latest} />,
                luna: <LunaSky />,
                brief: <BriefWin docs={docs} initial={initial} />,
                scan: scanWin,
                tech: <TechLive />,
                weekStrip: <WeekStrip />,
                weekAhead: <WeekAhead />,
                econ: <EconLive />,
                news: <NewsLive />,
                needs: <NeedsNow unrated={unrated} />,
                status: <StatusLive />,
                briefs: <BriefsBlock docs={{ pulse: docOf("pulse"), intel: docOf("intel"), scan: scanDoc }} mem={mem} />,
                review: <ReviewCard d={docOf("review")} />,
                world: <LivingWorld filed={filed} />,
                roster: <CrewRoster filed={filed} />,
              }}
            />
          ),
          calendar: <NewOnly classic={<CalendarTab />}><CalendarPage main={<CalendarTab noWeek />} econ={<EconLive />} momo={<MomoCard />} /></NewOnly>,
          garden: <NewOnly classic={<div className="tabcol"><GardenLive /></div>}><GardenPage /></NewOnly>,
          diary: <NewOnly classic={<div className="tabcol"><WinsButton /><DiaryLive open /></div>}><DungeonPage /></NewOnly>,
          life: <NewOnly classic={<div className="tabcol"><LifeTabs /></div>}><LifeHub /></NewOnly>,
        }}
      />
      <Boundary name="Sheet"><CourtSheet latest={latest} /></Boundary>
    </div>
    </CourtProvider>
  );
}

