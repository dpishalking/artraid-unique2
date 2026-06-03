/**
 * Bulk-импорт отзывов в forge_reviews. Опционально — auto_tag через Gemini.
 * Авторизация: JWT, доступ через RLS staff-only.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiForcedFunctionCall, geminiFlashModel } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TAGGING_SCHEMA = {
  type: "object",
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        required: ["index", "tags"],
        properties: {
          index: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

function ok(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method" }, { status: 405 });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) return ok({ error: "auth required" }, { status: 401 });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return ok({ error: "unauth" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { product_id, rows, auto_tag } = body ?? {};
    if (!product_id || !Array.isArray(rows) || !rows.length) {
      return ok({ error: "product_id and rows required" }, { status: 400 });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // Проверка доступа staff через is_forge_staff
    const { data: staffOk } = await adminClient.rpc("is_forge_staff", { uid: authData.user.id });
    if (!staffOk) return ok({ error: "forbidden" }, { status: 403 });

    const cleanRows = (rows as Array<Record<string, unknown>>)
      .map((r) => ({
        product_id,
        text: String(r.text ?? "").trim().slice(0, 4000),
        author: r.author ? String(r.author).slice(0, 200) : null,
        source: r.source ? String(r.source).slice(0, 100) : null,
        rating: Number.isFinite(r.rating) ? Number(r.rating) : null,
        tags: [] as string[],
      }))
      .filter((r) => r.text.length > 0);

    if (!cleanRows.length) return ok({ inserted: 0, tagged: 0 });

    let taggedCount = 0;
    if (auto_tag) {
      const batches: typeof cleanRows[] = [];
      for (let i = 0; i < cleanRows.length; i += 20) batches.push(cleanRows.slice(i, i + 20));

      for (const batch of batches) {
        try {
          const userText = batch
            .map((r, i) => `${i}. ${r.text}`)
            .join("\n\n");

          const { args } = await geminiForcedFunctionCall({
            model: geminiFlashModel(),
            functionName: "tag_reviews",
            functionDescription: "Размечает отзывы клиентов тегами по болям, триггерам и возражениям.",
            parameters: TAGGING_SCHEMA,
            systemInstruction:
              "Ты — маркетолог. Размечай отзывы тегами по 1-4 на каждый.\n" +
              "Префиксы тегов:\n" +
              "- pain:<тип> (например pain:price, pain:fear, pain:complexity)\n" +
              "- trigger:<тип> (например trigger:result, trigger:trust, trigger:speed)\n" +
              "- objection:<тип> (если в отзыве проскальзывает изначальное сомнение)\n" +
              "- emotion:<тип> (joy, relief, surprise, anger)\n" +
              "Только латиница и snake_case в значениях.",
            userParts: [{ text: userText }],
            temperature: 0.2,
          });

          const results = (args?.results ?? []) as Array<{ index: number; tags: string[] }>;
          for (const r of results) {
            if (batch[r.index]) {
              batch[r.index].tags = (r.tags ?? [])
                .map((t) => String(t).slice(0, 64))
                .filter(Boolean)
                .slice(0, 8);
              taggedCount += 1;
            }
          }
        } catch (e) {
          console.warn("auto-tag batch failed:", e);
        }
      }
    }

    const { error } = await adminClient.from("forge_reviews").insert(cleanRows);
    if (error) {
      console.error("forge-import-reviews insert failed", error);
      return ok({ error: error.message }, { status: 500 });
    }

    return ok({ inserted: cleanRows.length, tagged: taggedCount });
  } catch (e) {
    console.error("forge-import-reviews error", e);
    return ok({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
});
