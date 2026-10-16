import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";

export const dynamic = "force-dynamic";

type Brief = { id: string; kind: string; title: string; body: string; at: string };

const fmt = new Intl.DateTimeFormat("en-SG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Singapore",
});

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS returns shared briefs plus this user's own.
  const { data, error } = await supabase
    .from("briefs")
    .select("id, kind, title, body, at")
    .order("at", { ascending: false });
  const briefs = (data ?? []) as Brief[];

  return (
    <main>
      <header>
        <h1>{APP_NAME}</h1>
        <div className="actions">
          <a className="button primary" href="/api/export" download>
            Export my data
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      {error && <p className="error">Couldn't load briefs. Try refreshing.</p>}
      {!error && briefs.length === 0 && <p className="empty">No briefs yet.</p>}

      {briefs.map((b) => (
        <article className="brief" key={b.id}>
          <h2>{b.title || b.kind}</h2>
          <div className="meta">
            <span className="kind">{b.kind}</span> · {fmt.format(new Date(b.at))} SGT
          </div>
          <div className="body">{b.body}</div>
        </article>
      ))}
    </main>
  );
}
