// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiProModel } from "../_shared/gemini.ts";
import {
  getScenarioById,
  isLegacyBrief,
  validateScenarioAnswers,
} from "../_shared/landingScenarios.ts";
import { CREDITS_ENABLED } from "../_shared/features.ts";
import { finishGeneration, startGeneration, writeAdminLog } from "../_shared/opsLog.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";
import { recordPrototypeForProject } from "../_shared/projectPostProcess.ts";
import { generateFullPrototypeContent } from "../_shared/prototypeGenerateCore.ts";
import {
  buildPrototypeUserPrompt,
  fetchSiteContext,
  type PrototypeBrief,
} from "../_shared/prototypeUserPrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Brief = PrototypeBrief;

/** First public IP hop from gateway headers (Edge / CDN). */
function getClientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for")?.trim();
  if (xf) {
    const hop = xf.split(",")[0]?.trim();
    if (hop) return hop;
  }
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xr = req.headers.get("x-real-ip")?.trim();
  if (xr) return xr;
  return null;
}

/** Start of current UTC calendar day (demo limit). */
function utcMidnightISO(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const brief = body.brief as Brief;
    const projectIdRaw = body.project_id;
    const projectId =
      typeof projectIdRaw === "string" && projectIdRaw.trim() ? projectIdRaw.trim() : null;
    const scenario = getScenarioById(brief?.scenario_id);
    const legacy = brief && isLegacyBrief(brief as Record<string, unknown>);

    if (!legacy) {
      if (!scenario) {
        return new Response(
          JSON.stringify({ error: "Выберите сценарий лендинга, чтобы сервис собрал структуру под вашу задачу." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const validationError = validateScenarioAnswers(scenario, brief.answers ?? {});
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!brief?.niche || !brief?.product || !brief?.audience || !brief?.offer || !brief?.price) {
      return new Response(JSON.stringify({ error: "Заполните все обязательные поля" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHdr = req.headers.get("Authorization") || "";
    const token = authHdr.replace(/^Bearer\s+/i, "").trim();
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: `Bearer ${token || anonKey}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    const effectiveUserId: string | null = user?.id ?? null;

    let linkedProjectId: string | null = null;
    let anonymousDemo = false;
    let creatorIp: string | null = null;

    if (effectiveUserId) {
      if (projectId) {
        const { data: owned } = await admin
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", effectiveUserId)
          .maybeSingle();
        if (owned?.id) linkedProjectId = owned.id;
      }

      const sinceHour = new Date(Date.now() - 3_600_000).toISOString();
      const { count: recentCount } = await admin
        .from("prototypes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", effectiveUserId)
        .gte("created_at", sinceHour);
      if ((recentCount ?? 0) >= 8) {
        return new Response(
          JSON.stringify({
            error: "rate_limit",
            message: "Слишком много генераций за час. Попробуйте позже или напишите в поддержку.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (CREDITS_ENABLED) {
        const { data: credRow } = await admin
          .from("user_credits")
          .select("balance")
          .eq("user_id", effectiveUserId)
          .single();
        const balance = credRow?.balance ?? 0;
        if (balance < 1) {
          return new Response(
            JSON.stringify({
              error: "no_credits",
              message: "Недостаточно генераций. Купите пакет на странице тарифов.",
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    } else {
      anonymousDemo = true;
      if (projectId) {
        return new Response(
          JSON.stringify({
            error: "guest_no_project",
            message: "Чтобы сохранять прототип в проект, войдите в аккаунт.",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      creatorIp = getClientIp(req);
      if (!creatorIp) {
        return new Response(
          JSON.stringify({
            error: "no_client_ip",
            message: "Не удалось определить адрес для демо-лимита. Обновите страницу или войдите.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const dayStart = utcMidnightISO();
      const { count: demoToday } = await admin
        .from("prototypes")
        .select("id", { count: "exact", head: true })
        .eq("anonymous_demo", true)
        .is("user_id", null)
        .eq("creator_ip", creatorIp)
        .gte("created_at", dayStart);

      if ((demoToday ?? 0) >= 2) {
        return new Response(
          JSON.stringify({
            error: "rate_limit",
            message:
              "Демо без входа: не больше 2 генераций в сутки с одного адреса. Войдите — чтобы сохранять прототипы и снять ограничение.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const { data: pending, error: insertErr } = await admin.from("prototypes").insert({
      user_id: effectiveUserId,
      project_id: linkedProjectId,
      anonymous_demo: anonymousDemo,
      creator_ip: anonymousDemo ? creatorIp : null,
      brief,
      status: "pending",
    }).select("id").single();
    if (insertErr) throw insertErr;
    const prototypeId = pending.id;
    const startedAt = Date.now();
    const modelName = geminiProModel();
    const generationId = await startGeneration(admin, {
      user_id: effectiveUserId,
      type: "full_landing_prototype",
      project_id: linkedProjectId,
      prototype_id: prototypeId,
      input_data: {
        scenario_id: brief.scenario_id ?? null,
        niche: brief.niche ?? null,
        project_id: linkedProjectId,
        anonymous_demo: anonymousDemo,
      },
      model: modelName,
    });

    const [competitorMd, ownMd, projectContextBlock] = await Promise.all([
      brief.competitor_url ? fetchSiteContext(brief.competitor_url) : Promise.resolve(""),
      brief.own_site_url ? fetchSiteContext(brief.own_site_url) : Promise.resolve(""),
      linkedProjectId && effectiveUserId
        ? loadProjectContextBlock(admin, linkedProjectId, effectiveUserId)
        : Promise.resolve(""),
    ]);

    const userPrompt = buildPrototypeUserPrompt(brief, {
      competitorMd,
      ownMd,
      projectContextBlock,
    });

    let content: any;
    try {
      content = await generateFullPrototypeContent(userPrompt, scenario);
    } catch (e2) {
      const errDetail =
        `AI не смог вернуть структуру прототипа (2 попытки). ${String((e2 as Error)?.message || e2).slice(
          0,
          400,
        )}`;
      console.error(errDetail);
      await admin.from("prototypes").update({ status: "error", error: errDetail }).eq("id", prototypeId);
      await finishGeneration(admin, generationId, {
        status: "failed",
        error_message: errDetail,
        duration_ms: Date.now() - startedAt,
        prototype_id: prototypeId,
      });
      await writeAdminLog(admin, {
        type: "generation_failed",
        message: `Прототип ${prototypeId}: ${errDetail.slice(0, 300)}`,
        severity: "error",
        service: "generate-prototype",
        metadata: {
          ...(effectiveUserId ? { user_id: effectiveUserId } : {}),
          ...(anonymousDemo && creatorIp ? { creator_ip: creatorIp } : {}),
          prototype_id: prototypeId,
        },
      });
      return new Response(
        JSON.stringify({ error: "AI не сгенерировал прототип. Попробуйте ещё раз — обычно помогает." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const scenarioMeta = getScenarioById(brief.scenario_id);
    if (scenarioMeta && content?.meta && !content.meta.scenario) {
      content.meta.scenario = {
        id: scenarioMeta.id,
        title: scenarioMeta.title,
        goal: scenarioMeta.goal,
        logic: scenarioMeta.logic,
        primaryCTA: scenarioMeta.primaryCTA,
        landingStructure: scenarioMeta.landingStructure,
      };
    }

    await admin.from("prototypes").update({ content, status: "ready" }).eq("id", prototypeId);

    if (CREDITS_ENABLED && effectiveUserId) {
      const { data: deducted, error: deductErr } = await admin.rpc("deduct_credit", {
        p_user_id: effectiveUserId,
        p_prototype_id: prototypeId,
      });
      if (deductErr || deducted === false) {
        console.error("deduct_credit failed after generation", deductErr, deducted);
        await writeAdminLog(admin, {
          type: "deduct_credit_failed",
          message: `Не списан кредит после успешной генерации ${prototypeId}`,
          severity: "warning",
          service: "generate-prototype",
          metadata: { user_id: effectiveUserId, prototype_id: prototypeId },
        });
      }
    }

    await finishGeneration(admin, generationId, {
      status: "success",
      duration_ms: Date.now() - startedAt,
      credits_spent: CREDITS_ENABLED && effectiveUserId ? 1 : 0,
      prototype_id: prototypeId,
    });

    if (linkedProjectId && effectiveUserId) {
      await recordPrototypeForProject(admin, {
        projectId: linkedProjectId,
        userId: effectiveUserId,
        prototypeId,
        generationId,
      }).catch((e) => console.error("recordPrototypeForProject:", e));
    }

    return new Response(JSON.stringify({ id: prototypeId, content, project_id: linkedProjectId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("generate-prototype error", e);
    const msg = e instanceof Error ? e.message : String(e);
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      await writeAdminLog(admin, {
        type: "generation_failed",
        message: msg.slice(0, 500),
        severity: "error",
        service: "generate-prototype",
      });
    } catch {
      /* ignore logging errors */
    }
    if (/HTTP 429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg)) {
      return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте через минуту" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка генерации" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
