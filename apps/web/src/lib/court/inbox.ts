import { sgtKeyOf } from "./time";

// Notifications inbox (round 6): one list built from what the app already knows, rules only, no push. Each item
// has a stable id (so read state and de-duplication work), a group and a deep link to its one home.
export type Src = "needs" | "brief" | "review" | "liquidity" | "routine" | "habit" | "kingdom";
export type Note = { id: string; src: Src; title: string; detail?: string; at: string; day: string; high: boolean; go: string };
export type InboxIn = {
  k: string; nowIso: string;
  due: { id: string; name: string; d: string; dd: number; important?: boolean }[];   // life admin, already filtered (no auto-paid)
  vdue: { id: string; name: string; d: string; dd: number; kind: "task" | "routine" }[];
  briefs: { key: string; label: string; at: string }[];
  review: { at: string; unread: boolean } | null;
  releases: { at: string; name: string }[];   // big releases within 48 hours
  habits: { id: string; name: string }[];      // her habits scheduled today and not yet done
  streak: number;
  notif: (id: string) => boolean;             // her notification choices
};

export function buildInbox(x: InboxIn): Note[] {
  const out: Note[] = [];
  const when = (dd: number) => (dd < 0 ? "overdue" : dd === 0 ? "due today" : dd === 1 ? "due tomorrow" : `due in ${dd} days`);
  for (const d of x.due) out.push({ id: "life:" + d.id + ":" + d.d, src: "needs", title: `${d.name} ${when(d.dd)}`, at: x.nowIso, day: d.d < x.k ? x.k : d.d, high: d.dd <= 0 || !!d.important, go: "life" });
  if (x.notif("routines")) for (const d of x.vdue) out.push({ id: d.kind + ":" + d.id, src: "routine", title: `${d.name} ${when(d.dd)}`, at: x.nowIso, day: x.k, high: d.dd <= 0, go: d.kind === "task" ? "calendar" : "life" });
  if (x.notif("briefs")) for (const b of x.briefs) out.push({ id: "brief:" + b.key + ":" + b.at, src: "brief", title: `New ${b.label} brief`, at: b.at, day: sgtKeyOf(b.at), high: false, go: "court" });
  else if (x.notif("morning") && (x.briefs.length || x.review?.unread)) {
    const parts = [x.briefs.length ? `${x.briefs.length} new brief${x.briefs.length === 1 ? "" : "s"}` : "", x.review?.unread && !x.notif("review") ? "your weekly review is ready" : ""].filter(Boolean);
    out.push({ id: "morning:" + x.k, src: "brief", title: "Morning summary: " + parts.join(", "), detail: x.briefs.map((b) => b.label).join(" · "), at: x.nowIso, day: x.k, high: false, go: "court" });
  }
  if (x.review?.unread && x.notif("review")) out.push({ id: "review:" + x.review.at, src: "review", title: "Kumo's weekly review is ready", at: x.review.at, day: x.k, high: true, go: "news" });
  if (x.notif("liquidity")) for (const r of x.releases) out.push({ id: "liq:" + r.name + ":" + r.at, src: "liquidity", title: `${r.name} within 48 hours`, at: r.at, day: x.k, high: false, go: "calendar" });
  if (x.notif("habits")) for (const h of x.habits) out.push({ id: "habit:" + h.id + ":" + x.k, src: "habit", title: `${h.name} is on today's list`, detail: "A gentle reminder; rest days count too.", at: x.nowIso, day: x.k, high: false, go: "garden" });
  if ([7, 14, 21, 30, 50, 100].includes(x.streak)) out.push({ id: "kingdom:streak:" + x.streak, src: "kingdom", title: `${x.streak} days in a row`, detail: "A quiet Kingdom moment. Nothing to do.", at: x.nowIso, day: x.k, high: false, go: "kingdom" });
  // de-duplicate by id, keep the first
  const seen = new Set<string>();
  return out.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
}

export type Group = "High priority" | "Today" | "Earlier";
export function groupOf(n: Note, k: string): Group { return n.high ? "High priority" : n.day >= k ? "Today" : "Earlier"; }
