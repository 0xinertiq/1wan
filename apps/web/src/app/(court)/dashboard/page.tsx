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
import { TodayLive } from "@/components/court/live/TodayLive";
import { CourtLayout, Observatory } from "@/components/court/live/KumoHome";
import { CrewRoster, LivingWorld } from "@/components/court/live/LivingWorld";
import { BriefCards } from "@/components/court/BriefCards";
import { DiaryLive, GardenLive, StatusLive, WinsButton } from "@/components/court/live/GrowLive";
import { bootState } from "@/lib/court/actions";
import { normalize } from "@/lib/court/state";

export const dynamic = "force-dynamic";

const SGT = "Asia/Singapore";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: SGT }).format(d);
const prettyDay = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: SGT, weekday: "short", day: "numeric", month: "short" }).format(d).replace(",", "");
const hm = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: SGT, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

function agoTxt(ms: number, now: number) {
  const m = Math.round((now - ms) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
}

function toDoc(b: BriefRow, now: Date, vote: Vote): BriefDoc {
  const at = new Date(b.at);
  const ok = !isNaN(at.getTime());
  const day = ok ? (dayKey(at) === dayKey(now) ? "Today" : prettyDay(at)) : "";
  return {
    key: b.kind,
    label: kindLabel(b.kind),
    title: (b.title || kindLabel(b.kind)).slice(0, 120),
    when: ok ? `${day} ${hm(at)} (${agoTxt(at.getTime(), now.getTime())})` : "",
    html: mdLite(b.body),
    top: topThree(b.body),
    at: b.at,
    sources: b.sources,
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
  const { rows, freshest, votes } = await loadBriefs(supabase, user.id);
  const docs = rows.map((b) => toDoc(b, now, votes[b.kind] ?? null));
  const initial = freshest; // v52 opens the freshest brief.
  const scanDoc = docs.find((d) => d.key === "scan") ?? null;
  const filed = Object.fromEntries(rows.map((r) => [r.kind, r.at]));
  const latest: Latest = Object.fromEntries(rows.map((r) => [r.kind, { title: r.title, at: r.at }]));

  // Her state document; missing keys fall back to defaults. Rollover and the morning-brief quest
  // are applied here so the first paint is already right; the client saves what changed.
  const { data: row } = await supabase.from("user_state").select("data, version").eq("user_id", user.id).maybeSingle();
  const today = dayKey(now);
  const boot = bootState(normalize(row?.data ?? {}, today), today);

  return (
    <CourtProvider initial={boot.st} version={row?.version ?? 0} recap={boot.recap} dirty={boot.dirty} nowIso={now.toISOString()}>
    <CalendarLoader />
    <PricesLoader symbols={watchlistFrom(rows.find((r) => r.kind === "scan")?.body)} />
    <div className="wrap">
      <PixelDefs />
      <CourtDefs />
      <Header />
      <AppTabs
        extra={{ observatory: <Observatory luna={<LunaSky />} /> }}
        panels={{
          court: (
            <CourtLayout
              s={{
                weather: <WeatherLine />,
                today: <TodayLive />,
                todayBare: <TodayLive bare />,
                stage: <Stage filed={Object.fromEntries(rows.map((r) => [r.kind, r.at]))} />,
                statusLine: <StatusLine latest={latest} />,
                luna: <LunaSky />,
                brief: <BriefWin docs={docs} initial={initial} />,
                scan: <ScanWin doc={scanDoc} />,
                tech: <TechLive />,
                weekStrip: <WeekStrip />,
                weekAhead: <WeekAhead />,
                econ: <EconLive />,
                news: <NewsLive />,
                needs: <NeedsNow />,
                status: <StatusLive />,
                briefCards: <BriefCards docs={docs} />,
                world: <LivingWorld filed={filed} />,
                roster: <CrewRoster filed={filed} />,
              }}
            />
          ),
          calendar: <CalendarTab />,
          garden: <div className="tabcol"><GardenLive /></div>,
          diary: <div className="tabcol"><WinsButton /><DiaryLive open /></div>,
          life: <div className="tabcol"><LifeTabs /></div>,
        }}
      />
      <CourtSheet latest={latest} />
    </div>
    </CourtProvider>
  );
}

