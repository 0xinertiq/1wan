import { createClient } from "@supabase/supabase-js";

// Service-role client. Server only: bypasses row-level security, so it is used solely by the
// ingest endpoint to write shared briefs. Never import this from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
