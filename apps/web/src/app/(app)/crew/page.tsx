import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import { CREW } from "@/lib/crew";
import { PixelDefs, PixelSprite } from "@/components/PixelSprite";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main>
      <PixelDefs />
      <header>
        <h1>{APP_NAME} · The crew</h1>
        <div className="actions">
          <a className="button" href="/">Home</a>
        </div>
      </header>

      <div className="crew-grid">
        {CREW.map((m) => (
          <div className={m.soon ? "crew-card soon" : "crew-card"} key={m.sprite}>
            <PixelSprite name={m.sprite} size={120} label={m.name} />
            <div className="crew-name">{m.name}</div>
            <div className="crew-role">{m.role}</div>
            {m.soon && <div className="crew-soon">{m.soon}</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
