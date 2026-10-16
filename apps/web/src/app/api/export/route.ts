import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// "Export my data": everything the signed-in user can see, as one JSON download.
// Runs with the user's own session, so RLS limits it to their rows (plus shared briefs).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const tables = ["profiles", "user_state", "agent_memory", "feedback", "briefs", "usage"] as const;
  const out: Record<string, unknown> = {
    app: "1wan",
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email },
  };

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) {
      return NextResponse.json({ error: `Export failed on ${t}` }, { status: 500 });
    }
    out[t] = data;
  }

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="1wan-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
