import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiJsonResponse,
  requireGeminiKey,
} from "../_shared/gemini.ts";
import {
  formatMergedMemoryForAi,
  normalizeMemoryRowSections,
} from "../_shared/projectMemoryAiBlock.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONTEXT_SCHEMA = {
  type: "object",
  properties: {
    product_name: { type: "string" },
    product_description: { type: "string" },
    market_category: { type: "string" },
    target_audience: { type: "string" },
    audience_segments: { type: "array", items: { type: "string" } },
    main_pain: { type: "string" },
    secondary_pains: { type: "array", items: { type: "string" } },
    main_desire: { type: "string" },
    desired_outcomes: { type: "array", items: { type: "string" } },
    current_offer: { type: "string" },
    key_promise: { type: "string" },
    positioning: { type: "string" },
    unique_mechanism: { type: "string" },
    key_proofs: { type: "array", items: { type: "string" } },
    objections: { type: "array", items: { type: "string" } },
    missing_data: { type: "array", items: { type: "string" } },
    recommended_next_step: { type: "string" },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const projectId = String(body.project_id ?? "");
    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (token && anon && token !== anon) {
      const userClient = createClient(supabaseUrl, anon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: owned } = await admin
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!owned) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: project, error: pErr } = await admin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let memoryAiBlock = "";
    const { data: memoryRowData } = await admin
      .from("project_memories")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();
    if (memoryRowData && typeof memoryRowData === "object") {
      const mergedMemory = normalizeMemoryRowSections(memoryRowData as Record<string, unknown>);
      memoryAiBlock = formatMergedMemoryForAi(mergedMemory);
    }

    const prompt = `Ты — старший продакт-маркетолог. По вводным пользователя сформируй структурированный маркетинговый контекст проекта.

Учитывай блок «Расширенная память проекта»: он может содержать ответы квиза и ручное заполнение. Не противоречь фактам из него без пометки. Если противоречия с объектом карточки проекта ниже — укажи это в recommended_next_step.

Верни JSON по схеме. Пиши по-русски, конкретно, без воды. Если данных мало — честно укажи в missing_data.

${memoryAiBlock.trim() ? `## Расширенная память проекта\n${memoryAiBlock}\n` : ""}

## Карточка проекта и поля пользователя:
${JSON.stringify(project, null, 2)}`;

    const raw = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction: prompt,
      userParts: [{ text: "Сформируй ProjectContext JSON." }],
      responseSchema: CONTEXT_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 8192,
    });

    const patch: Record<string, unknown> = {
      product_name: raw.product_name ?? project.product_name,
      product_description: raw.product_description ?? project.product_description,
      market_category: raw.market_category ?? null,
      target_audience: raw.target_audience ?? project.target_audience,
      audience_segments: Array.isArray(raw.audience_segments) ? raw.audience_segments : [],
      main_pain: raw.main_pain ?? null,
      secondary_pains: Array.isArray(raw.secondary_pains) ? raw.secondary_pains : [],
      main_desire: raw.main_desire ?? null,
      desired_outcomes: Array.isArray(raw.desired_outcomes) ? raw.desired_outcomes : [],
      current_offer: raw.current_offer ?? project.current_offer,
      key_promise: raw.key_promise ?? null,
      positioning: raw.positioning ?? null,
      unique_mechanism: raw.unique_mechanism ?? null,
      current_website_url: project.current_website_url,
      competitors: project.competitors ?? [],
      key_proofs: Array.isArray(raw.key_proofs) ? raw.key_proofs : [],
      objections: Array.isArray(raw.objections) ? raw.objections : [],
      missing_data: Array.isArray(raw.missing_data) ? raw.missing_data : [],
      recommended_next_step: raw.recommended_next_step ?? null,
      important_notes: project.additional_context,
    };

    const { error: uErr } = await admin
      .from("project_contexts")
      .update(patch)
      .eq("project_id", projectId);
    if (uErr) throw uErr;

    const filled = [
      patch.main_pain,
      patch.main_desire,
      patch.key_promise,
      patch.positioning,
    ].filter(Boolean).length;
    const packagingScore = Math.min(100, 20 + filled * 15);

    await admin.from("projects").update({
      packaging_score: packagingScore,
      last_activity_at: new Date().toISOString(),
    }).eq("id", projectId);

    await admin.from("project_events").insert({
      project_id: projectId,
      user_id: project.user_id,
      event_type: "context_updated",
      title: "Маркетинговая карта обновлена",
      description: "AI сформировал контекст проекта",
    });

    return new Response(JSON.stringify({ ok: true, packaging_score: packagingScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("project-context-builder:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
