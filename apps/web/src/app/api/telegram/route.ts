import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { HANDLE, fetchChannel } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Her public Telegram channels (handles saved in user_state key tg), fetched on request with a 5-minute
// cache per channel. ?check=<handle> tests one handle before she saves it.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const check = new URL(req.url).searchParams.get("check");
  if (check != null) {
    const h = check.replace(/^@|^https?:\/\/t\.me\/(s\/)?/i, "").trim();
    if (!HANDLE.test(h)) return NextResponse.json({ health: { handle: h, ok: false, error: "Not a valid channel handle" } });
    return NextResponse.json({ health: (await fetchChannel(h)).health });
  }

  const { data: row } = await supabase.from("user_state").select("data").eq("user_id", user.id).maybeSingle();
  const tg = (row?.data as { tg?: { channels?: { handle: string; enabled: boolean }[] } } | null)?.tg;
  const handles = (tg?.channels ?? []).filter((c) => c.enabled && HANDLE.test(c.handle)).map((c) => c.handle).slice(0, 20);
  const res = await Promise.all(handles.map(fetchChannel));
  const items = res.flatMap((r) => r.items).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 80);
  return NextResponse.json({ at: new Date().toISOString(), items, health: res.map((r) => r.health) }, { headers: { "Cache-Control": "private, max-age=120" } });
}
