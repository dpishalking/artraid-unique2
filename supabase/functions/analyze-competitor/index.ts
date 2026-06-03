/**
 * Анализ конкурентов: два прохода Gemini для каждого выбранного профиля.
 *
 *  Проход 1 (universal_audit):
 *    Извлекаем компактную «карточку» конкурента: headline, sub, CTA,
 *    скоринги Hormozi/MECLABS/Eisenberg, awareness, sophistication, цена, тэги.
 *    Это меньше, чем полный analyze-site, но достаточно для всех 10 виджетов сравнения.
 *
 *  Проход 2 (your_lens):
 *    «Глазами клиента вашего проекта». Подмешиваем project_memory + project_contexts,
 *    отвечаем на 6 вопросов: чем зацепит/оттолкнёт ICP, чем мы лучше/хуже,
 *    что украсть, чего не повторять.
 *
 * Принимает массив competitor_ids и параллелит вызовы внутри edge fn (fan-out).
 * Это снимает с UI ответственность за очередь и даёт один controlled wall-time
 * вместо N HTTP roundtrips.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  extractJsonFromText,
  geminiFlashModel,
  geminiJsonResponse,
  type GeminiPart,
} from "../_shared/gemini.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";
import { writeAdminLog } from "../_shared/opsLog.ts";
import {
  COMPETITOR_INTEL_SYSTEM_APPEND,
  intelSchemaProperties,
  INTEL_SCHEMA_REQUIRED,
} from "../_shared/competitorIntelSchema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BATCH = 8;
const PAGE_FETCH_TIMEOUT_MS = 15_000;
const PAGE_TEXT_MAX_CHARS = 60_000;

async function resolveUserId(req: Request): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anon) return null;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (serviceKey && token === serviceKey) return "__service__";
  if (!token || token === anon) return null;
  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  return user?.id ?? null;
}

async function hashPageText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.slice(0, 8000)));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/** Firecrawl viewport screenshot (optional, если есть FIRECRAWL_API_KEY). */
async function fetchFirstScreenScreenshot(url: string): Promise<string | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  try {
    const fc = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [{ type: "screenshot", fullPage: false }],
        onlyMainContent: false,
        waitFor: 1200,
      }),
    });
    const fcData = await fc.json();
    const doc = fcData?.data ?? fcData;
    if (typeof doc?.screenshot === "string" && doc.screenshot.startsWith("http")) {
      return doc.screenshot;
    }
  } catch (e) {
    console.error("Firecrawl screenshot error:", e);
  }
  return null;
}

/** Качаем HTML и грубо вытаскиваем видимый текст. Без зависимостей под Deno-edge. */
async function fetchPageText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), PAGE_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MoneyMagnetAuditBot/1.0; +https://pishalking.ru)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    return htmlToText(html).slice(0, PAGE_TEXT_MAX_CHARS);
  } finally {
    clearTimeout(timeout);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/div|\/section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Схемы для двух проходов ─────────────────────────────────────────────────

const UNIVERSAL_SCHEMA = {
  type: "object",
  required: [
    "first_screen",
    "scores",
    "awareness",
    "sophistication",
    "trust",
    "cta",
    "positioning",
    ...INTEL_SCHEMA_REQUIRED,
  ],
  properties: {
    ...intelSchemaProperties(),
    first_screen: {
      type: "object",
      required: ["headline", "primary_cta"],
      properties: {
        headline: { type: "string" },
        sub_headline: { type: "string" },
        primary_cta: { type: "string" },
      },
    },
    scores: {
      type: "object",
      required: ["hormozi", "meclabs", "eisenberg", "storybrand"],
      properties: {
        hormozi: { type: "number", description: "0–100, общий по Hormozi Value Equation" },
        hormozi_axes: {
          type: "object",
          properties: {
            dream: { type: "number" },
            belief: { type: "number" },
            speed: { type: "number" },
            ease: { type: "number" },
          },
        },
        meclabs: { type: "number" },
        eisenberg: { type: "number" },
        storybrand: { type: "number" },
      },
    },
    awareness: {
      type: "string",
      description: "Schwartz: unaware | problem | solution | product | most",
    },
    sophistication: {
      type: "number",
      description: "1–5, Schwartz × Eugene sophistication ниши",
    },
    trust: {
      type: "object",
      properties: {
        reciprocity: { type: "string", description: "strong | weak | none" },
        commitment: { type: "string" },
        social_proof: { type: "string" },
        authority: { type: "string" },
        liking: { type: "string" },
        scarcity: { type: "string" },
      },
    },
    cta: {
      type: "object",
      properties: {
        verb: { type: "string" },
        count_on_page: { type: "number" },
      },
    },
    positioning: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description:
            "price_leader | premium | niche_expert | generalist | mechanism_led | category_creator",
        },
        promise: { type: "string", description: "Главное обещание сайта в 1 предложении" },
        promise_intensity: {
          type: "number",
          description: "0–100, насколько жёсткое обещание (мягкое → жёсткое)",
        },
      },
    },
    pricing: {
      type: "object",
      properties: {
        extracted_price: { type: "string", description: "Например: «49 990 ₽», «$99/мес», «по запросу»" },
        model: {
          type: "string",
          description: "one_off | subscription | packages | freemium | on_request",
        },
      },
    },
    proof_inventory: {
      type: "array",
      items: { type: "string", description: "Кейсы / отзывы / цифры / медиа / награды / команда" },
    },
    name: { type: "string", description: "Название компании или бренда" },
  },
} as const;

const YOUR_LENS_SCHEMA = {
  type: "object",
  required: ["hooks_for_your_icp", "repels_your_icp", "we_are_better", "we_are_worse"],
  properties: {
    hooks_for_your_icp: { type: "string" },
    repels_your_icp: { type: "string" },
    we_are_better: { type: "array", items: { type: "string" } },
    we_are_worse: { type: "array", items: { type: "string" } },
    stealable_ideas: { type: "array", items: { type: "string" } },
    forbidden_moves: { type: "array", items: { type: "string" } },
    positioning_role: { type: "string" },
  },
} as const;

const universalSystemInstruction = `Ты опытный маркетинговый аналитик конкурентной разведки. Тебе дают текст сайта конкурента — нужно извлечь карточку для таблицы сравнения ниши. Главное:
- Все скоринги в одной шкале 0–100, кроме sophistication (1–5).
- awareness: используй один из вариантов unaware/problem/solution/product/most.
- positioning.role: выбери один из price_leader/premium/niche_expert/generalist/mechanism_led/category_creator.
- trust.* — оцени каждый Cialdini-триггер как strong/weak/none по факту наличия на странице.
- НЕ выдумывай факты. Если данных нет — ставь нейтральные значения или пустую строку.
${COMPETITOR_INTEL_SYSTEM_APPEND}`;

const yourLensSystemInstruction = `Ты маркетинговый аналитик, который оценивает конкурента ГЛАЗАМИ КЛИЕНТА конкретного проекта. Главное:
- Не повторяй универсальную информацию. Оценивай ТОЛЬКО относительно проекта пользователя.
- we_are_better / we_are_worse — конкретно: фразы, цифры, фичи. Не «у нас лучше», а «у нас 11 фреймворков, у них 4».
- stealable_ideas — что можно адаптировать без копирования, в нашем ToV.
- forbidden_moves — конкретные формулировки, которые рынок уже использует и они выглядят как клише.
- Будь КРАТКИМ: hooks/repels до 180 символов, массивы — до 4 коротких пунктов (до 100 символов каждый).`;

/** Восстанавливает your_lens из обрезанного JSON (MAX_TOKENS). */
function salvageYourLensJson(text: string): Record<string, unknown> | null {
  const fromExtract = extractJsonFromText(text);
  if (fromExtract && typeof fromExtract === "object" && !Array.isArray(fromExtract)) {
    return fromExtract as Record<string, unknown>;
  }

  const readString = (key: string): string | null => {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
    const m = text.match(re);
    if (m?.[1]) return m[1].replace(/\\"/g, '"').slice(0, 280);
    const partial = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)`, "s"));
    return partial?.[1]?.slice(0, 280) ?? null;
  };

  const readStringArray = (key: string): string[] => {
    const re = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)`, "s");
    const m = text.match(re);
    if (!m?.[1]) return [];
    const items = m[1].match(/"((?:[^"\\]|\\.)*)"/g);
    return (items ?? []).map((s) => s.slice(1, -1).replace(/\\"/g, '"').trim()).filter(Boolean).slice(0, 4);
  };

  const hooks = readString("hooks_for_your_icp");
  const repels = readString("repels_your_icp");
  if (!hooks && !repels) return null;

  return {
    hooks_for_your_icp: hooks ?? "",
    repels_your_icp: repels ?? "",
    we_are_better: readStringArray("we_are_better"),
    we_are_worse: readStringArray("we_are_worse"),
    stealable_ideas: readStringArray("stealable_ideas"),
    forbidden_moves: readStringArray("forbidden_moves"),
    positioning_role: readString("positioning_role"),
  };
}

const EMPTY_YOUR_LENS: Record<string, unknown> = {
  hooks_for_your_icp: "",
  repels_your_icp: "",
  we_are_better: [],
  we_are_worse: [],
};

async function runYourLensPass(
  projectContextBlock: string,
  competitorUrl: string,
  universalPayload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const compactUniversal = {
    first_screen: universalPayload.first_screen,
    scores: universalPayload.scores,
    awareness: universalPayload.awareness,
    sophistication: universalPayload.sophistication,
    positioning: universalPayload.positioning,
    cta: universalPayload.cta,
  };

  const yourLensParts: GeminiPart[] = [
    {
      text:
        `КОНТЕКСТ ВАШЕГО ПРОЕКТА:\n${projectContextBlock || "(контекст не заполнен)"}\n\n` +
        `URL конкурента: ${competitorUrl}\n` +
        `Карточка конкурента (JSON):\n${JSON.stringify(compactUniversal)}\n\n` +
        `Дай ответ ГЛАЗАМИ КЛИЕНТА из ICP вашего проекта.`,
    },
  ];

  try {
    return (await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction: yourLensSystemInstruction,
      userParts: yourLensParts,
      responseSchema: YOUR_LENS_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.35,
      maxOutputTokens: 8192,
      salvageParse: salvageYourLensJson,
    })) as Record<string, unknown>;
  } catch (e) {
    console.warn("your_lens pass failed, using empty lens:", e);
    return { ...EMPTY_YOUR_LENS };
  }
}

// ─── Один цикл (1 конкурент) ─────────────────────────────────────────────────

type CompetitorRow = {
  id: string;
  project_id: string;
  url: string;
  host: string;
  name: string | null;
  status: string;
};

async function analyzeOne(
  admin: SupabaseClient,
  competitor: CompetitorRow,
  projectContextBlock: string,
): Promise<{ ok: true; audit_id: string } | { ok: false; error: string }> {
  const auditInsert = await admin
    .from("competitor_audits")
    .insert({
      competitor_id: competitor.id,
      project_id: competitor.project_id,
      run_no: 1,
      status: "running",
    })
    .select("id")
    .single();
  if (auditInsert.error || !auditInsert.data) {
    return { ok: false, error: `insert competitor_audits: ${auditInsert.error?.message ?? "unknown"}` };
  }
  const auditId = String(auditInsert.data.id);

  await admin
    .from("competitor_profiles")
    .update({ status: "analyzing" })
    .eq("id", competitor.id);

  try {
    const pageText = await fetchPageText(competitor.url);
    if (!pageText.trim()) {
      throw new Error("Не удалось получить текст страницы (пусто).");
    }
    const page_snapshot_hash = await hashPageText(pageText);
    const screenshotUrl = await fetchFirstScreenScreenshot(competitor.url);

    // ── Проход 1 ──
    const universalParts: GeminiPart[] = [
      {
        text:
          `URL конкурента: ${competitor.url}\nИзвестное название: ${competitor.name ?? "—"}\n\n` +
          `ТЕКСТ САЙТА (сокращён):\n${pageText}`,
      },
    ];

    const universalPayload = (await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction: universalSystemInstruction,
      userParts: universalParts,
      responseSchema: UNIVERSAL_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.3,
      maxOutputTokens: 8192,
      salvageParse: extractJsonFromText,
    })) as Record<string, unknown>;

    // ── Проход 2 (не валим весь аудит, если JSON обрезался) ──
    const yourLensPayload = await runYourLensPass(
      projectContextBlock,
      competitor.url,
      universalPayload,
    );

    // ── Сжатые scores для быстрых выборок ──
    const scoresSrc = (universalPayload.scores ?? {}) as Record<string, unknown>;
    const positioningSrc = (universalPayload.positioning ?? {}) as Record<string, unknown>;
    const pricingSrc = (universalPayload.pricing ?? {}) as Record<string, unknown>;

    const compactScores = {
      hormozi: typeof scoresSrc.hormozi === "number" ? scoresSrc.hormozi : null,
      meclabs: typeof scoresSrc.meclabs === "number" ? scoresSrc.meclabs : null,
      eisenberg: typeof scoresSrc.eisenberg === "number" ? scoresSrc.eisenberg : null,
      storybrand: typeof scoresSrc.storybrand === "number" ? scoresSrc.storybrand : null,
      awareness: typeof universalPayload.awareness === "string" ? universalPayload.awareness : null,
      sophistication:
        typeof universalPayload.sophistication === "number" ? universalPayload.sophistication : null,
      positioning_role: typeof positioningSrc.role === "string" ? positioningSrc.role : null,
      promise_intensity:
        typeof positioningSrc.promise_intensity === "number"
          ? positioningSrc.promise_intensity
          : null,
    };

    const extractedPrice =
      typeof pricingSrc.extracted_price === "string" && pricingSrc.extracted_price.trim()
        ? String(pricingSrc.extracted_price).trim().slice(0, 60)
        : null;

    const updatedAudit = await admin
      .from("competitor_audits")
      .update({
        status: "completed",
        audit_payload: universalPayload,
        your_lens_payload: yourLensPayload,
        scores: compactScores,
        extracted_price: extractedPrice,
        first_screen_image_url: screenshotUrl,
        page_snapshot_hash,
        finished_at: new Date().toISOString(),
        model_meta: { primary: geminiFlashModel() },
      })
      .eq("id", auditId);

    if (updatedAudit.error) {
      throw new Error(`update competitor_audits: ${updatedAudit.error.message}`);
    }

    const aiName =
      typeof universalPayload.name === "string" && universalPayload.name.trim()
        ? String(universalPayload.name).trim().slice(0, 80)
        : null;

    const profileUpdate: Record<string, unknown> = {
      status: "analyzed",
      latest_audit_id: auditId,
      last_scanned_at: new Date().toISOString(),
      failure_reason: null,
    };
    if (!competitor.name && aiName) profileUpdate.name = aiName;

    if (screenshotUrl) profileUpdate.screenshot_url = screenshotUrl;

    await admin.from("competitor_profiles").update(profileUpdate).eq("id", competitor.id);

    return { ok: true, audit_id: auditId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("competitor_audits")
      .update({
        status: "failed",
        error: msg.slice(0, 500),
        finished_at: new Date().toISOString(),
      })
      .eq("id", auditId);
    await admin
      .from("competitor_profiles")
      .update({
        status: "failed",
        failure_reason: msg.slice(0, 280),
      })
      .eq("id", competitor.id);
    return { ok: false, error: msg };
  }
}

// ─── Точка входа ─────────────────────────────────────────────────────────────

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

  try {
    userId = await resolveUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Войдите в аккаунт" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isServiceCall = userId === "__service__";

    const body = await req.json().catch(() => ({})) as {
      competitor_id?: string;
      competitor_ids?: string[];
    };

    const requestedIds: string[] = [];
    if (body.competitor_id) requestedIds.push(body.competitor_id);
    if (Array.isArray(body.competitor_ids)) {
      for (const id of body.competitor_ids) if (typeof id === "string" && id) requestedIds.push(id);
    }
    const ids = Array.from(new Set(requestedIds)).slice(0, MAX_BATCH);

    if (!ids.length) {
      return new Response(JSON.stringify({ error: "Передайте competitor_id или competitor_ids" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Берём профили + проверяем владение через JOIN на projects.
    const { data: profileRows, error: profErr } = await admin
      .from("competitor_profiles")
      .select("id, project_id, url, host, name, status, projects!inner(user_id)")
      .in("id", ids);
    if (profErr) throw profErr;

    const rows = (profileRows ?? []) as Array<
      CompetitorRow & { projects: { user_id: string } }
    >;
    const owned = isServiceCall
      ? rows
      : rows.filter((r) => r.projects?.user_id === userId);

    if (!owned.length) {
      return new Response(JSON.stringify({ error: "Конкуренты не найдены или нет доступа" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Контекст проекта общий для всех (все профили в рамках одного user).
    // Если несколько проектов — соберём блок по каждому отдельно.
    const projectContextByProject = new Map<string, string>();
    for (const r of owned) {
      if (!projectContextByProject.has(r.project_id)) {
        const ownerId = isServiceCall ? r.projects?.user_id : userId;
        const block = ownerId && ownerId !== "__service__"
          ? await loadProjectContextBlock(admin, r.project_id, ownerId).catch(() => "")
          : await loadProjectContextBlock(admin, r.project_id, r.projects.user_id).catch(() => "");
        projectContextByProject.set(r.project_id, block);
      }
    }

    const settled = await Promise.allSettled(
      owned.map((r) =>
        analyzeOne(
          admin,
          {
            id: r.id,
            project_id: r.project_id,
            url: r.url,
            host: r.host,
            name: r.name,
            status: r.status,
          },
          projectContextByProject.get(r.project_id) ?? "",
        ),
      ),
    );

    const results = owned.map((r, i) => {
      const s = settled[i];
      if (s.status === "fulfilled") return { competitor_id: r.id, ...s.value };
      return { competitor_id: r.id, ok: false as const, error: String(s.reason) };
    });

    const successful = results.filter((r) => r.ok).length;

    await writeAdminLog(admin, {
      type: "competitor.analyze.batch",
      message: `${successful}/${owned.length} конкурентов проанализированы`,
      severity: successful === owned.length ? "info" : "warning",
      service: "analyze-competitor",
      metadata: {
        user_id: userId,
        count: owned.length,
        successful,
        duration_ms: Date.now() - startedAt,
      },
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("analyze-competitor error:", msg);
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey);
        await writeAdminLog(admin, {
          type: "competitor.analyze.error",
          message: msg.slice(0, 1900),
          severity: "error",
          service: "analyze-competitor",
          metadata: { user_id: userId },
        });
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: msg.slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
