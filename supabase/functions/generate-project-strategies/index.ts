import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiJsonResponse,
  requireGeminiKey,
  sanitizeSchemaForGemini,
} from "../_shared/gemini.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHANNELS = ["website", "funnel", "sales", "offer", "creative", "research"] as const;

const RESULT_SCHEMA = {
  type: "object",
  required: ["strategies"],
  properties: {
    strategies: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        required: ["title", "rationale", "whatToChange", "metricName", "priority", "channel"],
        properties: {
          title: { type: "string", description: "Название стратегического направления, до 120 символов" },
          rationale: { type: "string", description: "Почему это направление важно для цели и North Star" },
          whatToChange: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: { type: "string" },
          },
          metricName: { type: "string", description: "Метрика, которую стратегия должна сдвинуть" },
          deadline: { type: "string", description: "Рекомендуемый срок или пустая строка" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          channel: { type: "string", enum: CHANNELS },
        },
      },
    },
  },
};

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

function metricBlock(metric: Record<string, unknown> | null): string {
  if (!metric) return "North Star пока не выбрана.";
  const parts = [
    `Название: ${String(metric.name ?? "").trim()}`,
    metric.plan_value != null ? `План: ${metric.plan_value}` : null,
    metric.fact_value != null ? `Факт: ${metric.fact_value}` : null,
    metric.unit ? `Единица: ${metric.unit}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

function buildPrompt(input: {
  goal: string;
  focus: string;
  deadline: string;
  northStarMetric: Record<string, unknown> | null;
  memoryBlock: string;
  metricsBlock: string;
}): string {
  return `Ты — CMO/стратег роста. Нужно предложить 3–5 стратегических направлений проекта, которые можно превратить в гипотезы.

Главная цель:
${input.goal}

North Star:
${metricBlock(input.northStarMetric)}

Фокус текущего спринта:
${input.focus || "Не задан"}

Дедлайн/горизонт:
${input.deadline || "Не задан"}

Коммерческие метрики проекта:
${input.metricsBlock || "Нет данных"}

Требования:
- Не генерируй общие советы. Каждая стратегия должна быть привязана к цели, метрике или узкому месту.
- whatToChange: конкретные изменения, которые можно превратить в 1–3 гипотезы.
- Дай разные направления: упаковка/оффер, воронка/лендинг, трафик/креатив, продажи/доверие или исследование.
- priority high только для стратегий с быстрым потенциальным эффектом.
- Язык — русский.

Контекст проекта:
${input.memoryBlock || "Контекст проекта пустой."}`;
}

function normalize(raw: unknown) {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(root.strategies) ? root.strategies : [];
  const strategies = list
    .filter((x) => x && typeof x === "object")
    .map((row) => {
      const r = row as Record<string, unknown>;
      const priorityRaw = String(r.priority ?? "medium");
      const priority = priorityRaw === "high" || priorityRaw === "low" ? priorityRaw : "medium";
      const channelRaw = String(r.channel ?? "website");
      const channel = (CHANNELS as readonly string[]).includes(channelRaw) ? channelRaw : "website";
      const whatToChange = Array.isArray(r.whatToChange)
        ? r.whatToChange.map(String)
        : Array.isArray(r.what_to_change)
          ? r.what_to_change.map(String)
          : [];
      return {
        title: String(r.title ?? "").trim().slice(0, 180),
        rationale: String(r.rationale ?? "").trim().slice(0, 800),
        whatToChange: whatToChange.map((s) => s.trim()).filter(Boolean).slice(0, 5),
        metricName: String(r.metricName ?? r.metric_name ?? "").trim().slice(0, 120),
        deadline: String(r.deadline ?? "").trim().slice(0, 80) || null,
        priority,
        channel,
      };
    })
    .filter((s) => s.title.length >= 8 && s.whatToChange.length > 0)
    .slice(0, 5);

  if (!strategies.length) throw new Error("Модель вернула пустой список стратегий");
  return { strategies };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const projectId = typeof body?.project_id === "string" ? body.project_id.trim() : "";
    const goal = String(body?.goal ?? "").trim();
    const focus = String(body?.focus ?? "").trim();
    const deadline = String(body?.deadline ?? "").trim();
    const northStarMetric =
      body?.north_star_metric && typeof body.north_star_metric === "object"
        ? (body.north_star_metric as Record<string, unknown>)
        : null;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id обязателен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (goal.length < 8) {
      return new Response(JSON.stringify({ error: "Опишите цель подробнее" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
    const uid = await resolveUserId(req);
    if (!admin || !uid) {
      return new Response(JSON.stringify({ error: "Нужна авторизация" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: owns } = await admin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .maybeSingle();
    if (!owns?.id) {
      return new Response(JSON.stringify({ error: "Проект не найден" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [memoryBlock, metricsRes] = await Promise.all([
      loadProjectContextBlock(admin, projectId, uid).catch(() => ""),
      admin
        .from("commercial_metrics")
        .select("name, category, plan_value, fact_value, unit, is_primary")
        .eq("project_id", projectId)
        .eq("is_hidden", false)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(12),
    ]);

    const metricsBlock = (metricsRes.data ?? [])
      .map((m: Record<string, unknown>) => {
        const plan = m.plan_value != null ? `план ${m.plan_value}${m.unit ?? ""}` : "";
        const fact = m.fact_value != null ? `факт ${m.fact_value}${m.unit ?? ""}` : "";
        return `- ${m.name}${m.is_primary ? " (primary)" : ""}: ${[plan, fact].filter(Boolean).join(", ") || "без плана/факта"}`;
      })
      .join("\n");

    const prompt = buildPrompt({ goal, focus, deadline, northStarMetric, memoryBlock, metricsBlock });
    const raw = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction:
        "Ты генерируешь проектные стратегии роста. Ответ — только JSON по схеме.",
      userParts: [{ text: prompt }],
      responseSchema: sanitizeSchemaForGemini(RESULT_SCHEMA) as Record<string, unknown>,
      temperature: 0.8,
      maxOutputTokens: 8192,
    });

    return new Response(JSON.stringify(normalize(raw)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-project-strategies error:", e);
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    const status = /429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg) ? 429 : 502;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
