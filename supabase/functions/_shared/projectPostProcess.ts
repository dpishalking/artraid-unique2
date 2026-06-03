import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildMemorySuggestionRowsFromAudit } from "./auditMemorySuggestions.ts";
import { mapAuditToProjectData } from "./mapAuditToProject.ts";
import { finishGeneration, startGeneration } from "./opsLog.ts";

/** After a successful audit linked to a project (service role). */
export async function afterAuditLinkedToProject(
  admin: SupabaseClient,
  opts: {
    projectId: string;
    userId: string;
    analysisLogId: string;
    url: string;
    audit: unknown;
  },
): Promise<void> {
  const { projectId, userId, analysisLogId, url, audit } = opts;
  const mapped = mapAuditToProjectData(audit, analysisLogId);
  const now = new Date().toISOString();

  if (mapped.insights.length) {
    const { error } = await admin.from("project_insights").insert(
      mapped.insights.map((row) => ({
        project_id: projectId,
        source_type: row.source_type,
        source_id: row.source_id,
        insight_type: row.insight_type,
        title: row.title,
        description: row.description,
        evidence: row.evidence,
        confidence: row.confidence,
      })),
    );
    if (error) console.error("project_insights insert:", error.message);
  }

  if (mapped.hypotheses.length) {
    const { error } = await admin.from("hypotheses").insert(
      mapped.hypotheses.map((row) => ({
        project_id: projectId,
        source_type: row.source_type,
        source_generation_id: row.source_generation_id,
        title: row.title,
        description: row.description,
        type: row.type,
        priority: row.priority,
        what_to_change: row.what_to_change,
        why: row.why,
        expected_impact: row.expected_impact,
      })),
    );
    if (error) console.error("hypotheses insert:", error.message);
  }

  const { data: ctx } = await admin
    .from("project_contexts")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (ctx && Object.keys(mapped.contextPatch).length) {
    const patch: Record<string, unknown> = {};
    const cur = ctx as Record<string, unknown>;
    for (const [key, val] of Object.entries(mapped.contextPatch)) {
      const existing = cur[key];
      if (existing == null || (typeof existing === "string" && !String(existing).trim())) {
        patch[key] = val;
      }
    }
    if (Object.keys(patch).length) {
      await admin.from("project_contexts").update(patch).eq("project_id", projectId);
    }
  }

  const projectUpdate: Record<string, unknown> = {
    last_activity_at: now,
    updated_at: now,
  };
  if (mapped.packagingScore != null) {
    projectUpdate.packaging_score = mapped.packagingScore;
  }
  await admin.from("projects").update(projectUpdate).eq("id", projectId);

  const memRows = buildMemorySuggestionRowsFromAudit(projectId, analysisLogId, audit);
  if (memRows.length) {
    const { error } = await admin.from("project_memory_updates").insert(memRows);
    if (error) console.error("project_memory_updates insert:", error.message);
    else {
      await admin.from("project_events").insert({
        project_id: projectId,
        user_id: userId,
        event_type: "project_memory_update_suggested",
        title: "Предложены обновления памяти проекта из аудита",
        description: `Найдено полей для согласования: ${memRows.length}`,
        entity_type: "analysis_log",
        entity_id: analysisLogId,
        metadata: { count: memRows.length },
      }).catch(() => undefined);
    }
  }

  await admin.from("project_events").insert({
    project_id: projectId,
    user_id: userId,
    event_type: "audit_completed",
    title: "Аудит сайта завершён",
    description: url,
    entity_type: "analysis_log",
    entity_id: analysisLogId,
    metadata: { url, share_path: `/r/${analysisLogId}` },
  });

  const genId = await startGeneration(admin, {
    user_id: userId,
    type: "website_analysis",
    project_id: projectId,
    input_data: { url, analysis_log_id: analysisLogId },
    model: "gemini-flash",
    credits_spent: 0,
  });
  await finishGeneration(admin, genId, {
    status: "success",
    output_data: { analysis_log_id: analysisLogId },
    credits_spent: 0,
  });
}

export async function recordPrototypeForProject(
  admin: SupabaseClient,
  opts: {
    projectId: string;
    userId: string;
    prototypeId: string;
    generationId: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await admin.from("projects").update({ last_activity_at: now }).eq("id", opts.projectId);
  await admin.from("project_events").insert({
    project_id: opts.projectId,
    user_id: opts.userId,
    event_type: "prototype_created",
    title: "Прототип лендинга создан",
    entity_type: "prototype",
    entity_id: opts.prototypeId,
    metadata: { prototype_path: `/p/${opts.prototypeId}`, generation_id: opts.generationId },
  });
}
