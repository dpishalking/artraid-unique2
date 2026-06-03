import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type OpsGenerationType =
  | "website_analysis"
  | "full_landing_prototype"
  | "block_regeneration"
  | "offer_generation";

export type OpsGenerationStatus = "pending" | "processing" | "success" | "failed" | "cancelled";

export type AdminLogSeverity = "info" | "warning" | "error" | "critical";

/** Start a row in `generations` (user optional for anon demo prototypes). */
export async function startGeneration(
  admin: SupabaseClient,
  row: {
    user_id: string | null;
    type: OpsGenerationType;
    project_id?: string | null;
    prototype_id?: string | null;
    input_data?: Record<string, unknown> | null;
    model?: string | null;
    credits_spent?: number;
  },
): Promise<string | null> {
  const { data, error } = await admin
    .from("generations")
    .insert({
      user_id: row.user_id ?? null,
      type: row.type,
      status: "processing",
      project_id: row.project_id ?? null,
      prototype_id: row.prototype_id ?? null,
      input_data: row.input_data ?? null,
      model: row.model ?? null,
      credits_spent: row.credits_spent ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("startGeneration:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/** Finish a generation row started with {@link startGeneration}. */
export async function finishGeneration(
  admin: SupabaseClient,
  generationId: string | null,
  patch: {
    status: Exclude<OpsGenerationStatus, "pending" | "processing">;
    output_data?: unknown;
    error_message?: string | null;
    duration_ms?: number;
    tokens_used?: number | null;
    credits_spent?: number;
    prototype_id?: string | null;
  },
): Promise<void> {
  if (!generationId) return;

  const { error } = await admin
    .from("generations")
    .update({
      status: patch.status,
      output_data: patch.output_data ?? null,
      error_message: patch.error_message ?? null,
      duration_ms: patch.duration_ms ?? null,
      tokens_used: patch.tokens_used ?? null,
      credits_spent: patch.credits_spent,
      prototype_id: patch.prototype_id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationId);

  if (error) console.error("finishGeneration:", error.message);
}

/** Operational / error event for the admin Logs screen. */
export async function writeAdminLog(
  admin: SupabaseClient,
  row: {
    type: string;
    message: string;
    severity?: AdminLogSeverity;
    service?: string;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await admin.from("admin_logs").insert({
    type: row.type,
    message: row.message.slice(0, 2000),
    severity: row.severity ?? "info",
    status: "new",
    service: row.service ?? null,
    metadata: row.metadata ?? null,
  });

  if (error) console.error("writeAdminLog:", error.message);
}
