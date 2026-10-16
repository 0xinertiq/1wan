import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PixelDefs } from "@/components/PixelSprite";
import { CourtDefs } from "@/components/court/CourtDefs";
import { Header } from "@/components/court/Header";
import { Stage } from "@/components/court/Stage";

export const dynamic = "force-dynamic";

// Visual shell of the v52 dashboard. Display only for now.
export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="wrap">
      <PixelDefs />
      <CourtDefs />
      <Header />
      <div className="layout">
        <div className="col c-l"></div>
        <div className="col c-m">
          <Stage />
        </div>
        <div className="col c-r"></div>
      </div>
    </div>
  );
}
