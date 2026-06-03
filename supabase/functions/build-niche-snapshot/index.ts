/**
 * Сборка niche snapshot: агрегирует competitor_audits + audit пользователя,
 * строит 4 MVP-виджета детерминированно и 3 стратегии через Gemini.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildArtifactsFromSiteCards,
  siteCardFromCompetitorAudit,
  siteCardFromUserAudit,
  STRATEGIES_SCHEMA,
  type SiteCard,
} from "../_shared/buildNicheArtifacts.ts";
import { geminiFlashModel, geminiJsonResponse, extractJsonFromText } from "../_shared/gemini.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";
import { writeAdminLog } from "../_shared/opsLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIN_COMPETITORS = 1;

async function resolveUserId(req: Request): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anon) return null;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === anon) return null;
  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  return user?.id ?? null;
}

function makeShareId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Компактный контекст для Gemini — полные artifacts слишком большие и рвут JSON-ответ. */
function compactArtifactsForStrategies(artifacts: Record<string, unknown>): Record<string, unknown> {
  const pm = artifacts.positioning_map as { points?: unknown[]; empty_zones?: string[] } | undefined;
  const pulse = artifacts.niche_pulse as Record<string, unknown> | undefined;
  const score = artifacts.scorecard as { commentary?: string; you?: number[]; median?: number[] } | undefined;
  return {
    positioning_map: {
      points: pm?.points ?? [],
      empty_zones: pm?.empty_zones?.slice(0, 4) ?? [],
    },
    scorecard_commentary: score?.commentary ?? null,
    niche_pulse: pulse
      ? {
          avg_hormozi: pulse.avg_hormozi,
          dominant_awareness: pulse.dominant_awareness,
          unused_triggers: pulse.unused_triggers,
          overused_patterns: pulse.overused_patterns,
        }
      : null,
    voice_overlap: artifacts.voice_overlap ?? null,
    promise_gradient_vacuum: (artifacts.promise_gradient as { vacuum_zones?: unknown[] } | undefined)
      ?.vacuum_zones?.slice(0, 2),
  };
}

async function generateStrategies(
  contextBlock: string,
  artifacts: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const compact = compactArtifactsForStrategies(artifacts);
  try {
    const strategiesRaw = (await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction:
        "Ты стратег по позиционированию. На основе карты ниши предложи 3 конкретные стратегии для проекта пользователя. Пиши по-русски, кратко: title до 80 символов, rationale до 240, what_to_change — 3 пункта по 120 символов.",
      userParts: [
        {
          text:
            `${contextBlock}\n\nДАННЫЕ КАРТЫ НИШИ (сжато):\n${JSON.stringify(compact)}\n\n` +
            `Сформируй 3 стратегии:\n` +
            `- defensive: повторить сильное у топ-3 + одно своё отличие\n` +
            `- blind_spot: зайти в пустую зону (unused_triggers / empty_zones)\n` +
            `- new_category: заявить новую категорию\n` +
            `what_to_change — ровно 3 конкретных шага каждая.`,
        },
      ],
      responseSchema: STRATEGIES_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.45,
      maxOutputTokens: 8192,
      salvageParse: extractJsonFromText,
    })) as Record<string, unknown>;

    return {
      defensive: strategiesRaw.defensive
        ? { kind: "defensive", ...(strategiesRaw.defensive as object) }
        : undefined,
      blind_spot: strategiesRaw.blind_spot
        ? { kind: "blind_spot", ...(strategiesRaw.blind_spot as object) }
        : undefined,
      new_category: strategiesRaw.new_category
        ? { kind: "new_category", ...(strategiesRaw.new_category as object) }
        : undefined,
    };
  } catch (e) {
    console.warn("strategies generation failed, saving snapshot without AI strategies:", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startedAt = Date.now();
  let userId: string | null = null;
  let projectId: string | null = null;
  let snapshotId: string | null = null;

  try {
    userId = await resolveUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Войдите в аккаунт" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({})) as { project_id?: string };
    projectId = body.project_id?.trim() || null;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id обязателен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("id, user_id, name, current_website_url")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (projErr) throw projErr;
    if (!project) {
      return new Response(JSON.stringify({ error: "Проект не найден" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: profErr } = await admin
      .from("competitor_profiles")
      .select("id, name, host, url, status, latest_audit_id")
      .eq("project_id", projectId)
      .eq("status", "analyzed")
      .eq("is_self", false);
    if (profErr) throw profErr;

    const analyzed = (profiles ?? []) as {
      id: string;
      name: string | null;
      host: string;
      url: string;
      latest_audit_id: string | null;
    }[];

    if (analyzed.length < MIN_COMPETITORS) {
      return new Response(
        JSON.stringify({
          error: `Нужен минимум ${MIN_COMPETITORS} проанализированный конкурент. Сначала нажмите «Проанализировать».`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const auditIds = analyzed.map((p) => p.latest_audit_id).filter(Boolean) as string[];
    const { data: audits, error: audErr } = await admin
      .from("competitor_audits")
      .select("id, competitor_id, audit_payload, scores, status")
      .in("id", auditIds)
      .eq("status", "completed");
    if (audErr) throw audErr;

    const auditByCompetitor = new Map<string, Record<string, unknown>>();
    const scoresByCompetitor = new Map<string, Record<string, unknown>>();
    for (const row of (audits ?? []) as Record<string, unknown>[]) {
      const cid = String(row.competitor_id);
      auditByCompetitor.set(cid, (row.audit_payload ?? {}) as Record<string, unknown>);
      scoresByCompetitor.set(cid, (row.scores ?? {}) as Record<string, unknown>);
    }

    let yourAuditId: string | null = null;
    const { data: userAuditRow } = await admin
      .from("analysis_logs")
      .select("id, audit, url")
      .eq("project_id", projectId)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const cards: SiteCard[] = [];
    for (const p of analyzed) {
      const payload = auditByCompetitor.get(p.id);
      if (!payload) continue;
      cards.push(
        siteCardFromCompetitorAudit(
          p.id,
          p.name ?? p.host,
          payload,
          scoresByCompetitor.get(p.id) ?? {},
          p.url,
        ),
      );
    }

    if (userAuditRow?.audit && typeof userAuditRow.audit === "object") {
      yourAuditId = String(userAuditRow.id);
      cards.unshift(
        siteCardFromUserAudit(
          yourAuditId,
          (project as { name: string }).name ?? "Вы",
          userAuditRow.audit as Record<string, unknown>,
          (userAuditRow.url as string) ||
            (project as { current_website_url: string | null }).current_website_url,
        ),
      );
    }

    if (cards.filter((c) => !c.is_self).length < MIN_COMPETITORS) {
      return new Response(JSON.stringify({ error: "Не хватает данных аудитов конкурентов" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: snapInsert, error: snapErr } = await admin
      .from("niche_snapshots")
      .insert({
        project_id: projectId,
        your_audit_id: yourAuditId,
        included_competitor_ids: analyzed.map((p) => p.id),
        status: "building",
      })
      .select("id")
      .single();
    if (snapErr) throw snapErr;
    snapshotId = String(snapInsert.id);

    const artifacts = buildArtifactsFromSiteCards(cards);

    const contextBlock = await loadProjectContextBlock(admin, projectId, userId);
    const strategies = await generateStrategies(contextBlock, artifacts);

    const shareId = makeShareId();

    const { error: updErr } = await admin
      .from("niche_snapshots")
      .update({
        status: "completed",
        artifacts,
        strategies,
        share_id: shareId,
        model_meta: { primary: geminiFlashModel(), competitor_count: analyzed.length },
        generated_at: new Date().toISOString(),
      })
      .eq("id", snapshotId);
    if (updErr) throw updErr;

    await writeAdminLog(admin, {
      type: "niche.snapshot.completed",
      message: `snapshot ${snapshotId} · ${analyzed.length} competitors`,
      severity: "info",
      service: "build-niche-snapshot",
      metadata: {
        project_id: projectId,
        snapshot_id: snapshotId,
        share_id: shareId,
        duration_ms: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({ snapshot_id: snapshotId, share_id: shareId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("build-niche-snapshot error:", msg);

    if (snapshotId) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin
        .from("niche_snapshots")
        .update({ status: "failed", error: msg.slice(0, 500) })
        .eq("id", snapshotId);
    }

    try {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await writeAdminLog(admin, {
        type: "niche.snapshot.error",
        message: msg.slice(0, 1900),
        severity: "error",
        service: "build-niche-snapshot",
        metadata: { project_id: projectId, snapshot_id: snapshotId },
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: msg.slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
