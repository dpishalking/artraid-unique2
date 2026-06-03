import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiForcedFunctionCall,
  requireGeminiKey,
} from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

type FieldSpec = { id: string; label: string; helper?: string };

const LEGACY_FIELD_DESCRIPTIONS: Record<string, string> = {
  product: "что продаётся: формат, состав, ключевая деталь",
  audience: "портрет ЦА: возраст, ситуация, боль",
  offer: "результат + срок + гарантия",
  price: "цифры, тарифы, рассрочка",
  mechanism: "название метода и в чём суть отличия от конкурентов",
  bigidea: "провоцирующая мысль меняющая взгляд на проблему",
  traffic: "откуда приходит аудитория и насколько она тёплая",
  enemy: "конкретный злодей которого ненавидит ЦА",
};

function coerceHints(raw: Record<string, unknown>, requestedFields: string[]): Record<string, string[]> {
  const hints: Record<string, string[]> = {};
  for (const f of requestedFields) {
    const v = raw[f];
    const arr = Array.isArray(v)
      ? (v as unknown[]).map((x) => String(x).trim()).filter((s) => s.length > 0)
      : [];
    hints[f] = arr.slice(0, 4);
  }
  return hints;
}

function parseFieldsInput(
  fields: unknown,
): { requestedFields: string[]; fieldSpecs: FieldSpec[] } {
  if (!Array.isArray(fields) || fields.length === 0) {
    const defaults = ["product", "audience", "offer", "price"];
    return {
      requestedFields: defaults,
      fieldSpecs: defaults.map((id) => ({ id, label: id, helper: LEGACY_FIELD_DESCRIPTIONS[id] })),
    };
  }

  if (typeof fields[0] === "object" && fields[0] !== null && "id" in (fields[0] as object)) {
    const fieldSpecs = (fields as FieldSpec[]).map((f) => ({
      id: String(f.id),
      label: String(f.label ?? f.id),
      helper: f.helper ? String(f.helper) : undefined,
    }));
    return { requestedFields: fieldSpecs.map((f) => f.id), fieldSpecs };
  }

  const requestedFields = fields.map((f) => String(f));
  return {
    requestedFields,
    fieldSpecs: requestedFields.map((id) => ({
      id,
      label: id,
      helper: LEGACY_FIELD_DESCRIPTIONS[id],
    })),
  };
}

function buildPrompt(
  niche: string,
  fieldSpecs: FieldSpec[],
  scenarioTitle?: string,
  context?: Record<string, string>,
): string {
  const fieldList = fieldSpecs
    .map((f) => `- ${f.id}: ${f.label}${f.helper ? `. ${f.helper}` : ""}`)
    .join("\n");

  const contextBlock = context && Object.keys(context).length > 0
    ? Object.entries(context)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `- ${k}: ${v.trim().slice(0, 200)}`)
      .join("\n")
    : "";

  const scenarioBlock = scenarioTitle
    ? `Сценарий лендинга: «${scenarioTitle}». Подсказки должны соответствовать этому сценарию.\n`
    : "";

  const contextSection = contextBlock
    ? `\nУже заполнено пользователем (учитывай для связности):\n${contextBlock}\n`
    : "";

  return `${scenarioBlock}Контекст / ниша: "${niche}"
${contextSection}
Сгенерируй по 4 коротких варианта для каждого поля. Каждый вариант — 1 предложение, максимум 80 символов, конкретно и по делу. Никакой воды.

Поля:
${fieldList}

Варианты в одном поле — разные углы (разные форматы, сегменты, подходы). Язык — русский.`;
}

async function hintsViaGemini(
  prompt: string,
  requestedFields: string[],
): Promise<Record<string, string[]>> {
  requireGeminiKey();

  const schemaProperties: Record<string, object> = {};
  for (const f of requestedFields) {
    schemaProperties[f] = {
      type: "array",
      items: { type: "string" },
      description: `Ровно 4 коротких варианта (до 80 символов каждый) для поля ${f}`,
    };
  }

  const { args } = await geminiForcedFunctionCall({
    model: geminiFlashModel(),
    systemInstruction:
      "Ты помощник маркетолога. Вызывай функцию emit_hints — никакого свободного текста.",
    userParts: [{ text: `${prompt}\n\nВызови emit_hints.` }],
    functionName: "emit_hints",
    functionDescription: "Возвращает по 4 варианта подсказок для запрошенных полей брифа",
    parameters: {
      type: "object",
      required: requestedFields,
      properties: schemaProperties,
    },
    temperature: 0.85,
    maxOutputTokens: 8192,
  });

  return coerceHints(args as Record<string, unknown>, requestedFields);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL не настроен" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anon) {
      return new Response(JSON.stringify({ error: "SUPABASE_ANON_KEY не настроен для функций" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Как generate-offer: подсказки доступны и без логина (anon key), логин — опционально.
    if (token && token !== anon) {
      const userClient = createClient(SUPABASE_URL, anon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { error: authErr } = await userClient.auth.getUser();
      if (authErr) {
        console.warn("generate-hints: invalid user token, proceeding as guest");
      }
    }

    const body = await req.json();
    const { niche: nicheInput, scenario_title, context } = body as {
      niche?: string;
      fields?: unknown;
      scenario_title?: string;
      context?: Record<string, string>;
    };

    const { requestedFields, fieldSpecs } = parseFieldsInput(body.fields);

    const niche =
      nicheInput?.trim() ||
      context?.product?.trim() ||
      context?.hypothesis?.trim() ||
      context?.eventTitle?.trim() ||
      context?.consultationType?.trim() ||
      scenario_title?.trim() ||
      "продукт или услуга";

    if (!niche) {
      return new Response(JSON.stringify({ error: "Недостаточно контекста для подсказок" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(niche, fieldSpecs, scenario_title, context);

    let hints: Record<string, string[]>;
    try {
      hints = await hintsViaGemini(prompt, requestedFields);

      const hasAny = requestedFields.some((f) => (hints[f]?.length ?? 0) > 0);
      if (!hasAny) {
        return new Response(JSON.stringify({ error: "Модель вернула пустые подсказки — попробуйте ещё раз" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("generate-hints Gemini error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      if (/HTTP 429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg)) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Ошибка AI: ${msg}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ hints }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-hints error", e);
    return new Response(JSON.stringify({ error: "Ошибка генерации подсказок" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
