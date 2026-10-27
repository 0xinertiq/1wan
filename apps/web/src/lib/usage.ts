import type { SupabaseClient } from "@supabase/supabase-js";

// Usage rows (table usage, migration 0001). One row = one run, so runs per feature = a row count.
// No AI runs inside the app, so token figures are an estimate of the text handled (characters / 4),
// marked by model "estimate:chars/4". Never blocks the caller: any failure is swallowed.
export const EST = "estimate:chars/4";
export const estTokens = (s: string) => Math.ceil(String(s ?? "").length / 4);

export async function logUsage(db: SupabaseClient, row: { userId: string | null; feature: string; input?: number; output?: number; model?: string }) {
  try {
    await db.from("usage").insert({ user_id: row.userId, feature: row.feature.slice(0, 60), model: row.model ?? EST, input_tokens: row.input ?? 0, output_tokens: row.output ?? 0 });
  } catch {}
}

// The owner (first account created). Shared briefs come from her scheduled tasks, so their runs count for her.
export async function ownerId(db: SupabaseClient): Promise<string | null> {
  try {
    const { data } = await db.auth.admin.listUsers({ perPage: 50 });
    return (data?.users ?? []).sort((x, y) => x.created_at.localeCompare(y.created_at))[0]?.id ?? null;
  } catch { return null; }
}
