import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import { CREW } from "@/lib/crew";
import { PixelDefs, PixelSprite } from "@/components/PixelSprite";
import { stamp } from "@/lib/court/time";

export const dynamic = "force-dynamic";

type Brief = { id: string; kind: string; title: string; body: string; at: string };



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
      <PixelDefs />
      <header>
        <h1>{APP_NAME}</h1>
        <div className="actions">
          <a className="button" href="/dashboard">Dashboard</a>
          <a className="button" href="/crew">Crew</a>
          <a className="button primary" href="/api/export" download>
            Export my data
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <a className="crew-strip" href="/crew" aria-label="Meet the crew">
        {CREW.filter((m) => !m.soon).map((m) => (
          <div className="crew-mini" key={m.sprite}>
            <PixelSprite name={m.sprite} size={56} />
            <span>{m.name.replace("Chief ", "")}</span>
          </div>
        ))}
      </a>

      <h2 className="section">Briefs</h2>
      {error && <p className="error">Couldn't load briefs. Try refreshing.</p>}
      {!error && briefs.length === 0 && <p className="empty">No briefs yet.</p>}

      {briefs.map((b) => (
        <article className="brief" key={b.id}>
          <h2>{b.title || b.kind}</h2>
          <div className="meta">
            <span className="kind">{b.kind}</span> · {stamp(b.at)}
          </div>
          <div className="body">{b.body}</div>
        </article>
      ))}
    </main>
  );
}
