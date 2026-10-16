import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PixelDefs } from "@/components/PixelSprite";
import { CourtDefs } from "@/components/court/CourtDefs";
import { Header } from "@/components/court/Header";
import { Stage } from "@/components/court/Stage";
import { Roster } from "@/components/court/Roster";
import { mdLite } from "@/components/court/mdLite";
import type { BriefDoc } from "@/components/court/BriefTabs";
import { ScanWin } from "@/components/court/ScanWin";
import { loadBriefs, kindLabel, type BriefRow, type Vote } from "@/lib/briefs";
import { AskWin, BriefWin, NeedWin, NewsWin, SprintBar, UsePanel } from "@/components/court/Windows";
import { CourtProvider } from "@/components/court/CourtState";
import { TodayLive } from "@/components/court/live/TodayLive";
import { DiaryLive, GardenLive, StatusLive, WinsLive } from "@/components/court/live/GrowLive";
import { SettingsLive } from "@/components/court/live/SettingsLive";
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
    at: b.at,
    sources: b.sources,
    vote,
  };
}

// The v52 dashboard. Briefs, Today, habits, garden, wins, diary and status run on her saved state.
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

  // Her state document; missing keys fall back to defaults. Rollover and the morning-brief quest
  // are applied here so the first paint is already right; the client saves what changed.
  const { data: row } = await supabase.from("user_state").select("data, version").eq("user_id", user.id).maybeSingle();
  const today = dayKey(now);
  const boot = bootState(normalize(row?.data ?? {}, today), today);

  return (
    <CourtProvider initial={boot.st} version={row?.version ?? 0} recap={boot.recap} dirty={boot.dirty} nowIso={now.toISOString()}>
    <div className="wrap">
      <PixelDefs />
      <CourtDefs />
      <Header />
      <SprintBar />
      <UsePanel />
      <div className="layout">
        <div className="col c-l">
          <AskWin />
          <TodayLive />
        </div>
        <div className="col c-m">
          <Stage />
          <BriefWin docs={docs} initial={initial} />
          <ScanWin doc={scanDoc} />
          <NewsWin />
        </div>
        <div className="col c-r">
          <NeedWin />
          <Roster />
          <StatusLive />
          <div id="growWrap" aria-label="Growth">
            <GardenLive />
            <WinsLive />
            <DiaryLive />
          </div>
          <SettingsLive />
        </div>
      </div>
    </div>
    </CourtProvider>
  );
}

