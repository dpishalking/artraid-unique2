import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { writeAdminLog } from "../_shared/opsLog.ts";
import {
  buildOfferPrompt,
  normalizeOfferTone,
  OFFER_RESULT_SCHEMA,
  type OfferBriefInput,
} from "../_shared/offerPrompt.ts";
import {
  geminiFlashModel,
  geminiJsonResponse,
  requireGeminiKey,
  stripGeminiUnsafeSchema,
} from "../_shared/gemini.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_PURPOSES = new Set([
  "landing_hero", "post", "ad", "stories_reels", "email", "telegram_bot",
  "consultation", "webinar", "lead_magnet", "commercial_proposal",
  "presentation", "service", "product", "custom",
]);

const VALID_TONES = new Set([
  "expert", "empathetic", "bold", "inspiring", "conversational",
  "calm", "premium", "formal", "provocative", "playful",
  // legacy aliases (normalized before validation)
  "b2b", "instagram", "landing", "ads",
]);

async function resolveOfferUser(req: Request): Promise<string | null> {
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

function validateBrief(brief: unknown): { ok: true; data: OfferBriefInput } | { ok: false; error: string } {
  if (!brief || typeof brief !== "object") {
    return { ok: false, error: "Некорректный бриф." };
  }
  const b = brief as Record<string, unknown>;
  const offerPurpose = String(b.offerPurpose ?? "");
  if (!VALID_PURPOSES.has(offerPurpose)) {
    return { ok: false, error: "Выберите цель оффера." };
  }
  if (offerPurpose === "custom" && !String(b.customPurpose ?? "").trim()) {
    return { ok: false, error: "Заполните это поле, чтобы оффер получился конкретным." };
  }
  const required = ["productDescription", "targetAudience", "painPoint", "promisedResult"] as const;
  for (const key of required) {
    if (String(b[key] ?? "").trim().length < 2) {
      return { ok: false, error: "Заполните это поле, чтобы оффер получился конкретным." };
    }
  }
  const rawTone = String(b.tone ?? "").trim();
  if (!rawTone || !VALID_TONES.has(rawTone)) {
    return { ok: false, error: "Выберите тон оффера." };
  }
  const tone = normalizeOfferTone(rawTone);
  return {
    ok: true,
    data: {
      offerPurpose,
      customPurpose: b.customPurpose ? String(b.customPurpose) : undefined,
      productDescription: String(b.productDescription).trim(),
      targetAudience: String(b.targetAudience).trim(),
      customerSituation: String(b.customerSituation ?? "").trim(),
      painPoint: String(b.painPoint).trim(),
      promisedResult: String(b.promisedResult).trim(),
      proof: String(b.proof ?? "").trim(),
      objections: String(b.objections ?? "").trim(),
      additionalContext: String(b.additionalContext ?? "").trim(),
      tone,
    },
  };
}

function clampScore(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.min(10, Math.max(1, Math.round(x)));
}

function normalizeFourUItem(raw: unknown): { score: number; comment: string } {
  if (!raw || typeof raw !== "object") return { score: 5, comment: "" };
  const o = raw as Record<string, unknown>;
  return {
    score: clampScore(o.score),
    comment: String(o.comment ?? "").trim(),
  };
}

function normalizeStrategy(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;

  const awarenessStage = typeof s.awarenessStage === "string" ? s.awarenessStage.trim() : "";
  const sophRaw = s.sophisticationLevel;
  const sophNum = typeof sophRaw === "number" ? sophRaw : Number(sophRaw);
  const sophisticationLevel =
    Number.isFinite(sophNum) && sophNum >= 1 && sophNum <= 5 ? Math.round(sophNum) : undefined;
  const bigIdea = typeof s.bigIdea === "string" ? s.bigIdea.trim() : "";
  const enemy = typeof s.enemy === "string" ? s.enemy.trim() : "";
  const mechanism = typeof s.mechanism === "string" ? s.mechanism.trim() : "";
  const leadType =
    typeof s.leadType === "string" ? s.leadType.trim().toLowerCase().replace(/_/g, "-") : "";

  const voicePhrases = Array.isArray(s.voicePhrases)
    ? Array.from(
        new Set(
          (s.voicePhrases as unknown[])
            .map((x) => String(x ?? "").trim().replace(/^["«»']+|["«»']+$/g, ""))
            .filter((x) => x.length > 0),
        ),
      ).slice(0, 7)
    : [];

  const normalized: Record<string, unknown> = {};
  if (awarenessStage) normalized.awarenessStage = awarenessStage;
  if (sophisticationLevel !== undefined) normalized.sophisticationLevel = sophisticationLevel;
  if (bigIdea) normalized.bigIdea = bigIdea;
  if (enemy) normalized.enemy = enemy;
  if (mechanism) normalized.mechanism = mechanism;
  if (leadType) normalized.leadType = leadType;
  if (voicePhrases.length > 0) normalized.voicePhrases = voicePhrases;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeResult(raw: unknown): Record<string, unknown> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fourU = (r.fourUScore && typeof r.fourUScore === "object"
    ? r.fourUScore
    : {}) as Record<string, unknown>;

  const strategy = normalizeStrategy(r.strategy);

  const normalized: Record<string, unknown> = {
    ...r,
    whyItWorks: Array.isArray(r.whyItWorks)
      ? (r.whyItWorks as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [],
    improvements: Array.isArray(r.improvements)
      ? (r.improvements as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [],
    alternativeHeadlines: Array.isArray(r.alternativeHeadlines)
      ? (r.alternativeHeadlines as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [],
    alternativeCtas: Array.isArray(r.alternativeCtas)
      ? (r.alternativeCtas as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [],
    fourUScore: {
      useful: normalizeFourUItem(fourU.useful),
      urgent: normalizeFourUItem(fourU.urgent),
      unique: normalizeFourUItem(fourU.unique),
      ultraSpecific: normalizeFourUItem(fourU.ultraSpecific ?? fourU.ultra_specific),
    },
  };

  if (strategy) {
    normalized.strategy = strategy;
  } else {
    delete normalized.strategy;
  }

  return normalized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const validated = validateBrief(body?.brief);
    if (!validated.ok) {
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectId =
      typeof body?.project_id === "string" && body.project_id.trim() ? body.project_id.trim() : null;

    let memoryBlock = "";
    if (projectId && admin) {
      const uid = await resolveOfferUser(req);
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
            /* ignore memory load failures */
          }
        }
      }
    }

    const basePrompt = buildOfferPrompt(validated.data);
    const prompt =
      memoryBlock.trim().length > 60
        ? `${basePrompt}

Поля брифа выше — приоритетны. Учитывай «Память проекта» ниже для деталей, оффера, доказательств и ограничений, если это не противоречит явным ответам в брифе.

---
${memoryBlock}`
        : basePrompt;

    const schema = stripGeminiUnsafeSchema(OFFER_RESULT_SCHEMA) as Record<string, unknown>;

    const raw = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction: prompt,
      userParts: [{ text: "Сгенерируй оффер по брифу. Верни только JSON." }],
      responseSchema: schema,
      temperature: 0.9,
      maxOutputTokens: 8192,
    });

    const result = normalizeResult(raw);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-offer error:", e);
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    if (admin) {
      await writeAdminLog(admin, {
        type: "offer_generation_failed",
        message: msg.slice(0, 500),
        severity: "error",
        service: "generate-offer",
      });
    }
    return new Response(
      JSON.stringify({
        error: msg.includes("GEMINI")
          ? "Сервис генерации временно недоступен."
          : "Не удалось сгенерировать оффер. Попробуйте ещё раз или сократите описание.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
