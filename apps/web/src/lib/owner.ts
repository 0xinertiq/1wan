import { createAdminClient } from "@/lib/supabase/admin";
import { ownerId } from "@/lib/usage";

// Server only. The owner is the first account created (lib/usage.ts ownerId). Her briefs, trading areas and
// calendar settings are hers alone; every other account is a friend. If the owner cannot be confirmed (no
// service key), nobody is treated as the owner, so nothing personal leaks.
export async function isOwner(userId: string): Promise<boolean> {
  const db = createAdminClient();
  return !!db && userId === (await ownerId(db));
}
