import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import data from "../../../../../../docs/milestones.json";

export const dynamic = "force-dynamic";

// Build progress, read from docs/milestones.json at build time (no database, no personal data).
// Claude Code updates that file after every step, so this page refreshes on each deploy.
type M = { id: string; group: string; title: string; status: string; note?: string; expect: string; you_do: string };
const GROUPS = ["Foundation", "Build", "Intelligence", "Optional", "Aesthetic overhaul", "Later"];
const LABEL: Record<string, string> = { done: "Done", partial: "Partly done", next: "Next", todo: "To do", blocked: "Blocked" };

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ms = data.milestones as M[];
  const score = ms.reduce((a, m) => a + (m.status === "done" ? 1 : m.status === "partial" ? 0.5 : 0), 0);
  const pct = Math.round((score / ms.length) * 100);
  const next = ms.find((m) => m.status === "next");

  return (
    <main className="progress-page">
      <header>
        <h1>{APP_NAME} · Progress</h1>
        <div className="actions"><a className="button" href="/dashboard">Back</a></div>
      </header>
      <p className="pg-pct">{pct}% built</p>
      <p className="pg-sub">{ms.filter((m) => m.status === "done").length} of {ms.length} milestones done · updated {data.updated}</p>
      <div className="pg-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress"><span style={{ width: pct + "%" }} /></div>
      {!ms.length && <p className="pg-sub">No milestones found in this build.</p>}
      {next && <section className="pg-next"><b>Next: {next.title}</b><p>{next.expect}</p>{next.you_do && <p><b>What you do:</b> {next.you_do}</p>}</section>}
      {GROUPS.map((g) => {
        const list = ms.filter((m) => m.group === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <h2>{g}</h2>
            <ul className="pg-list">
              {list.map((m) => (
                <li key={m.id} className={m.status === "next" ? "is-next" : undefined}>
                  <div className="pg-row"><span>{m.title}</span><span className={"pg-chip st-" + m.status}>{LABEL[m.status] ?? m.status}</span></div>
                  {m.note && <p className="pg-note">{m.note}</p>}
                  {m.expect && <p className="pg-note">What to expect: {m.expect}</p>}
                  {m.you_do && <p className="pg-note"><b>What you do:</b> {m.you_do}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
