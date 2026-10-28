import { sgtHourOf, sgtKeyOf, wdOf } from "./time";

// Alert pop-ups (round 7): rule-based, no push, no AI. Each rule belongs to one agent; the agent shows a pixel "!"
// on the Court (and in their room banner), and a click opens a small speech bubble with what needs doing, a link
// to the one place it lives, and Dismiss / Later. Ids are stable, so a dismissed alert stays dismissed.
export type Agent = "pip" | "olli" | "coco" | "momo" | "kumo";
export type Alert = { id: string; agent: Agent; text: string; go: string; label: string };
export type AlertIn = {
  k: string; hour: number;                                              // Singapore day and hour
  briefs: { key: string; label: string; at: string }[];                 // briefs filed in the last 24 hours
  releases: { at: string; name: string }[];                             // big releases within 48 hours
  due: { id: string; name: string; dd: number; kind: "task" | "routine" | "life" }[];   // her tasks, routines and life admin
  habits: { id: string; name: string }[];                               // habits on today's list, not yet done
  needs: { id: string; t: string }[];                                   // Needs you now items no other agent covers
  review: { at: string; unread: boolean } | null;                       // Kumo's newest weekly review
  on: (id: string) => boolean;                                          // her stored choices (only an explicit "off" mutes)
};

export const AGENT_NAME: Record<Agent, string> = { pip: "Pip", olli: "Olli", coco: "Coco", momo: "Momo", kumo: "Kumo" };
const list = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, 2).join(", ")} and ${xs.length - 2} more`);

export function buildAlerts(x: AlertIn): Alert[] {
  const out: Alert[] = [];
  // Momo: one calm morning summary (05:00 to 11:59), the only alert that speaks for the briefs in the morning
  const morning = x.hour >= 5 && x.hour < 12 && x.on("morning");
  if (morning && x.briefs.length) out.push({ id: "morning:" + x.k, agent: "momo", text: `Good morning. ${x.briefs.length} new brief${x.briefs.length === 1 ? "" : "s"}: ${list(x.briefs.map((b) => b.label))}.`, go: "court", label: "Read on the Court" });
  // Pip: each brief filed from 12:00 today (briefs filed earlier belong to the morning summary, never twice)
  if (!morning && x.on("briefs")) for (const b of x.briefs.filter((y) => sgtKeyOf(y.at) === x.k && sgtHourOf(y.at) >= 12)) out.push({ id: "brief:" + b.key + ":" + b.at, agent: "pip", text: `A new ${b.label} brief is in.`, go: "court", label: "Read on the Court" });
  // Olli: big releases within 48 hours, one bubble
  if (x.on("liquidity") && x.releases.length) out.push({ id: "liq:" + x.releases.map((r) => r.name + r.at).join("|"), agent: "olli", text: `Big release${x.releases.length === 1 ? "" : "s"} within 48 hours: ${list(x.releases.map((r) => r.name))}.`, go: "econ-cal", label: "Open the economic calendar" });
  // Coco: tasks, routines and life admin due today or overdue
  const due = x.due.filter((d) => d.dd <= 0);
  if (x.on("routines") && due.length) out.push({ id: "due:" + x.k + ":" + due.map((d) => d.id).join(","), agent: "coco", text: `${due.length === 1 ? "One thing is" : due.length + " things are"} due: ${list(due.map((d) => d.name + (d.dd < 0 ? " (overdue)" : "")))}.`, go: "life", label: "Open the Life Hub" });
  // Momo: habit reminders from 17:00, gently
  if (x.on("habits") && x.hour >= 17 && x.habits.length) out.push({ id: "habits:" + x.k, agent: "momo", text: `Still on today's list: ${list(x.habits.map((h) => h.name))}. Rest days count too.`, go: "garden", label: "Open the Garden" });
  // Kumo: what Needs you now holds that nobody else covers (bookings within two hours)
  if (x.needs.length) out.push({ id: "needs:" + x.needs.map((n) => n.id).join(","), agent: "kumo", text: x.needs.length === 1 ? x.needs[0].t : `${x.needs.length} things in Needs you now: ${list(x.needs.map((n) => n.t))}.`, go: "needWin", label: "Open Needs you now" });
  // Kumo on Sunday: the weekly review, opened in Settings
  if (x.on("review") && wdOf(x.k) === 0 && x.review) out.push({ id: "review:" + x.review.at, agent: "kumo", text: x.review.unread ? "My weekly review is ready. Ten minutes, with tea." : "Sunday: a good day to look back at my weekly review.", go: "review-card", label: "Open the review" });
  const seen = new Set<string>();
  return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

/** Alerts still showing: not dismissed and not put off until later. */
export const showing = (all: Alert[], dismissed: string[], later: Record<string, number>, now: number) => all.filter((a) => !dismissed.includes(a.id) && !((later[a.id] ?? 0) > now));
