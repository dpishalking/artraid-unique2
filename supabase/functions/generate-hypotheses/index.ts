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

const CHANNEL_HINTS: Record<string, string> = {
  website: "сайт, лендинг, hero, CTA, форма",
  funnel: "воронка, этапы, доходимость, автоматизация, триггеры",
  sales: "отдел продаж, скрипт, CRM, дозвон, возражения, цикл сделки",
  offer: "оффер, упаковка, цена, гарантия, УТП",
  creative: "реклама, креатив, канал, сегмент, посадка",
  research: "исследование, интервью, сегмент, спрос",
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

const RESULT_SCHEMA = {
  type: "object",
  required: ["hypotheses"],
  properties: {
    hypotheses: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        required: ["title", "why", "expectedImpact", "metricName", "testWindow", "priority", "channel"],
        properties: {
          title: {
            type: "string",
            description: "Формула: Если сделаем X, получим Y, потому что Z — одно предложение",
          },
          why: { type: "string", description: "Почему это может сработать, 1-2 предложения" },
          expectedImpact: { type: "string", description: "Ожидаемый эффект с цифрой или порогом" },
          metricName: { type: "string", description: "Главная метрика теста" },
          testWindow: { type: "string", description: "SMART-окно: срок или объём данных" },
          guardrail: { type: "string", description: "Что не должно ухудшиться" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          channel: {
            type: "string",
            enum: ["website", "funnel", "sales", "offer", "creative", "research"],
          },
        },
      },
    },
  },
};

function buildPrompt(problem: string, channel: string, memoryBlock: string, seedTitle?: string): string {
  const channelHint = CHANNEL_HINTS[channel] ?? CHANNEL_HINTS.website;
  const seedBlock = seedTitle?.trim()
    ? `\nИсходная формулировка из аудита/бэклога (разверни в несколько тестируемых гипотез):\n«${seedTitle.trim()}»\n`
    : "";

  return `Ты — маркетинговый стратег. Пользователь описал проблему или узкое место. Сгенерируй 3–5 SMART-гипотез для A/B-теста.

Проблема / узкое место:
«${problem.trim()}»
${seedBlock}
Предпочтительный канал: ${channel} (${channelHint}).

Требования к каждой гипотезе:
- title: строго в формате «Если …, то …, потому что …»
- Разные углы: не дублируй одну идеу
- metricName и testWindow — конкретные и измеримые
- priority: high только для быстрых тестов с высоким impact
- channel: выбери наиболее подходящий канал для каждой гипотезы

Язык — русский.${memoryBlock ? `\n\n---\nКонтекст проекта:\n${memoryBlock}` : ""}`;
}

function normalizeResult(raw: unknown): {
  hypotheses: Array<{
    title: string;
    why: string;
    expectedImpact: string;
    metricName: string;
    testWindow: string;
    guardrail: string;
    priority: "high" | "medium" | "low";
    channel: string;
  }>;
} {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(root.hypotheses) ? root.hypotheses : [];
  const hypotheses = list
    .filter((x) => x && typeof x === "object")
    .map((row) => {
      const r = row as Record<string, unknown>;
      const priorityRaw = String(r.priority ?? "medium");
      const priority = priorityRaw === "high" || priorityRaw === "low" ? priorityRaw : "medium";
      const channelRaw = String(r.channel ?? "website");
      const channel = Object.keys(CHANNEL_HINTS).includes(channelRaw) ? channelRaw : "website";
      return {
        title: String(r.title ?? "").trim().slice(0, 500),
        why: String(r.why ?? "").trim().slice(0, 800),
        expectedImpact: String(r.expectedImpact ?? "").trim().slice(0, 300),
        metricName: String(r.metricName ?? "").trim().slice(0, 120),
        testWindow: String(r.testWindow ?? "").trim().slice(0, 120),
        guardrail: String(r.guardrail ?? "").trim().slice(0, 200),
        priority,
        channel,
      };
    })
    .filter((h) => h.title.length >= 10);

  if (hypotheses.length === 0) {
    throw new Error("Модель вернула пустой список гипотез");
  }
  return { hypotheses: hypotheses.slice(0, 5) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const problem = String(body?.problem ?? "").trim();
    const channel = String(body?.channel ?? "website").trim();
    const projectId = typeof body?.project_id === "string" ? body.project_id.trim() : "";
    const seedTitle = typeof body?.seed_title === "string" ? body.seed_title.trim() : "";

    if (problem.length < 8 && seedTitle.length < 8) {
      return new Response(JSON.stringify({ error: "Опишите проблему подробнее (минимум 8 символов)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    let memoryBlock = "";
    if (projectId && admin) {
      const uid = await resolveUserId(req);
      if (uid) {
        const { data: owns } = await admin
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", uid)
          .maybeSingle();
        if (owns?.id) {
          try {
            memoryBlock = await loadProjectContextBlock(admin, projectId, uid);
          } catch {
            /* ignore */
          }
        }
      }
    }

    const promptProblem = problem || seedTitle;
    const prompt = buildPrompt(promptProblem, channel, memoryBlock, seedTitle || undefined);

    const raw = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction:
        "Ты генерируешь тестируемые маркетинговые гипотезы. Ответ — только JSON по схеме.",
      userParts: [{ text: prompt }],
      responseSchema: sanitizeSchemaForGemini(RESULT_SCHEMA) as Record<string, unknown>,
      temperature: 0.85,
      maxOutputTokens: 8192,
    });

    const result = normalizeResult(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-hypotheses error:", e);
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    const status = /429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg) ? 429 : 502;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
