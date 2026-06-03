/**
 * Discovery конкурентов: Gemini с встроенным `google_search` tool
 * возвращает 3 потенциальных набора кандидатов (context / lookalike / queries),
 * мы дедупим по host, фильтруем self-host и отдаём фронту.
 *
 * Кандидат — это ещё не запись в БД; пользователь отметит галочками
 * нужных и нажмёт «Запустить анализ» (фронт сохранит их через
 * addDiscoveredCompetitors() и затем вызовет analyze-competitor).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  extractJsonFromText,
  geminiFlashModel,
  geminiGroundedSearch,
  geminiJsonResponse,
} from "../_shared/gemini.ts";
import { writeAdminLog } from "../_shared/opsLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_CANDIDATES_PER_MODE = 7;
const MAX_TOTAL_CANDIDATES = 20;
const MAX_QUERIES = 3;

type DiscoveryMode = "context" | "lookalike" | "query";

type Candidate = {
  url: string;
  host: string;
  name: string | null;
  source: "auto_context" | "auto_lookalike" | "auto_serp";
  confidence: number;
  ai_reason: string;
  preview_tags?: string[];
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

function extractHost(rawUrl: string): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function normalizeUrl(rawUrl: string): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    // Только корневой URL — без длинных подпутей и query (они вносят шум).
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

const candidateSchema = `Верни СТРОГО валидный JSON по схеме:
{
  "candidates": [
    {
      "url": "https://example.com",
      "name": "Название компании или бренда",
      "reason": "1-2 предложения почему это конкурент именно для этого проекта",
      "confidence": 0.0-1.0,
      "tags": ["price-leader" | "premium" | "niche-expert" | "generalist" | "mechanism-led" | "category-creator"]
    }
  ]
}
Никаких комментариев вне JSON, никаких markdown-обёрток.`;

const systemInstruction = `Ты опытный маркетинговый аналитик, который ищет реальных конкурентов конкретного проекта. Главные правила:
1. Ищи только живые рабочие сайты, которые сейчас открываются.
2. НЕ предлагай маркетплейсы (avito, ozon, wildberries) и агрегаторы (yandex.market, similarweb), если проект не маркетплейс сам.
3. НЕ выдумывай URL — если не уверен, лучше верни меньше кандидатов.
4. Не предлагай сам проект пользователя.
5. confidence ставь честно: 0.9 — очевидный конкурент, 0.6 — близкая ниша/смежный продукт, 0.4 — спорно.
6. reason пиши конкретно: «продаёт такой же продукт для такой же ICP», а не «маркетинговый сервис».`;

/** Модели с google_search (пробуем по очереди). */
const GROUNDED_MODELS = [
  Deno.env.get("GEMINI_GROUNDED_MODEL") ?? "gemini-2.0-flash-001",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
].filter((v, i, a) => a.indexOf(v) === i);

const CANDIDATES_RESPONSE_SCHEMA = {
  type: "object",
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        required: ["url", "reason", "confidence"],
        properties: {
          url: { type: "string" },
          name: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

async function runDiscoveryPrompt(
  prompt: string,
  source: Candidate["source"],
  selfHost: string | null,
): Promise<Candidate[]> {
  let lastErr = "AI не вернул кандидатов";

  for (const model of GROUNDED_MODELS) {
    try {
      const { text } = await geminiGroundedSearch({
        model,
        systemInstruction,
        userParts: [{ text: prompt }],
        temperature: 0.3,
        maxOutputTokens: 4096,
      });
      const parsed = parseCandidatesText(text, source, selfHost);
      if (parsed.length) return parsed;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      console.warn(`discover grounded ${model} failed:`, lastErr);
    }
  }

  try {
    const payload = await geminiJsonResponse({
      model: geminiFlashModel(),
      systemInstruction:
        `${systemInstruction}\n\nGoogle Search недоступен — используй знание рынка. URL только реальных известных игроков ниши, без выдуманных доменов.`,
      userParts: [{ text: prompt }],
      responseSchema: CANDIDATES_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      temperature: 0.35,
      maxOutputTokens: 4096,
      salvageParse: extractJsonFromText,
    });
    const parsed = parseCandidatesObject(payload, source, selfHost);
    if (parsed.length) return parsed;
  } catch (e) {
    lastErr = e instanceof Error ? e.message : String(e);
  }

  throw new Error(lastErr);
}

async function discoverByContext(
  args: {
    projectDescription: string;
    targetAudience: string;
    productName: string | null;
    selfHost: string | null;
  },
): Promise<Candidate[]> {
  const prompt = `Найди реальных прямых конкурентов для этого проекта.

ПРОЕКТ:
- Продукт: ${args.productName ?? "—"}
- Описание: ${args.projectDescription}
- Целевая аудитория: ${args.targetAudience}
${args.selfHost ? `- Сайт самого проекта (исключи его): ${args.selfHost}` : ""}

Найди от 3 до ${MAX_CANDIDATES_PER_MODE} компаний, которые продают похожий продукт похожей аудитории на русскоязычном рынке (или англоязычном, если ниша глобальная).

${candidateSchema}`;

  return runDiscoveryPrompt(prompt, "auto_context", args.selfHost);
}

async function discoverByLookalike(
  args: { sourceUrl: string; selfHost: string | null },
): Promise<Candidate[]> {
  const prompt = `Найди сайты, похожие на ${args.sourceUrl} по позиционированию, аудитории и продукту.

Это нужно, чтобы пользователь сравнил свой проект с похожими игроками рынка.
${args.selfHost ? `Исключи: ${args.selfHost}` : ""}

Найди от 3 до ${MAX_CANDIDATES_PER_MODE} реально работающих сайтов.

${candidateSchema}`;

  return runDiscoveryPrompt(prompt, "auto_lookalike", args.selfHost);
}

async function discoverByQuery(
  args: { query: string; selfHost: string | null },
): Promise<Candidate[]> {
  const prompt = `Найди топ-${MAX_CANDIDATES_PER_MODE} компаний/сайтов по поисковому запросу: "${args.query}".

Это запрос, который вводят потенциальные клиенты. Найди реальные сайты, которые ранжируются по этому запросу.
${args.selfHost ? `Исключи сайт самого проекта: ${args.selfHost}` : ""}

${candidateSchema}`;

  return runDiscoveryPrompt(prompt, "auto_serp", args.selfHost);
}

function parseCandidatesObject(
  parsed: unknown,
  source: Candidate["source"],
  selfHost: string | null,
): Candidate[] {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const arr = (parsed as { candidates?: unknown }).candidates;
  if (!Array.isArray(arr)) return [];
  return parseCandidatesFromArray(arr, source, selfHost);
}

function parseCandidatesText(
  text: string,
  source: Candidate["source"],
  selfHost: string | null,
): Candidate[] {
  const parsed = extractJsonFromText(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  const arr = (parsed as { candidates?: unknown }).candidates;
  if (!Array.isArray(arr)) return [];
  return parseCandidatesFromArray(arr, source, selfHost);
}

function parseCandidatesFromArray(
  arr: unknown[],
  source: Candidate["source"],
  selfHost: string | null,
): Candidate[] {
  const out: Candidate[] = [];
  for (const raw of arr.slice(0, MAX_CANDIDATES_PER_MODE)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const url = normalizeUrl(String(o.url ?? ""));
    const host = url ? extractHost(url) : null;
    if (!url || !host) continue;
    if (selfHost && host === selfHost) continue;

    const confidenceRaw = typeof o.confidence === "number" ? o.confidence : Number(o.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.min(1, Math.max(0, confidenceRaw))
      : 0.5;

    const reason = String(o.reason ?? "").trim();
    if (!reason) continue;

    const tagsRaw = Array.isArray(o.tags) ? o.tags : [];
    const tags = tagsRaw.map((t) => String(t).trim()).filter(Boolean).slice(0, 4);

    out.push({
      url,
      host,
      name: o.name ? String(o.name).trim().slice(0, 80) : null,
      source,
      confidence,
      ai_reason: reason.slice(0, 280),
      preview_tags: tags,
    });
  }
  return out;
}

function dedupCandidates(input: Candidate[]): Candidate[] {
  const byHost = new Map<string, Candidate>();
  for (const c of input) {
    const existing = byHost.get(c.host);
    if (!existing || c.confidence > existing.confidence) {
      byHost.set(c.host, c);
    }
  }
  return Array.from(byHost.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_TOTAL_CANDIDATES);
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

  try {
    userId = await resolveUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Войдите в аккаунт" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({})) as {
      project_id?: string;
      modes?: { context?: boolean; lookalike?: boolean; queries?: string[] };
    };

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
      .select("id, user_id, name, product_name, product_description, target_audience, current_website_url")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    if (projErr) throw projErr;
    if (!project) {
      return new Response(JSON.stringify({ error: "Проект не найден или нет доступа" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: contextRow } = await admin
      .from("project_contexts")
      .select(
        "product_description, target_audience, market_category, positioning, current_offer, key_promise, current_website_url",
      )
      .eq("project_id", projectId)
      .maybeSingle();

    const projectRow = project as Record<string, unknown>;
    const ctxRow = (contextRow ?? {}) as Record<string, unknown>;

    const productDescription =
      (ctxRow.product_description as string | null) ||
      (projectRow.product_description as string | null) ||
      "";
    const targetAudience =
      (ctxRow.target_audience as string | null) ||
      (projectRow.target_audience as string | null) ||
      "";
    const productName = (projectRow.product_name as string | null) ?? null;
    const websiteUrl =
      String(projectRow.current_website_url ?? ctxRow.current_website_url ?? "").trim();
    const selfHost = extractHost(websiteUrl);

    const modes = body.modes ?? { context: true };
    const lookalikeRequested = modes.lookalike === true;
    const contextRequested = modes.context !== false;
    const queries = Array.isArray(modes.queries)
      ? modes.queries.map((q) => String(q).trim()).filter(Boolean).slice(0, MAX_QUERIES)
      : [];

    if (lookalikeRequested && !selfHost) {
      return new Response(
        JSON.stringify({
          error:
            "Для режима «Похожие на ваш сайт» укажите URL сайта в проекте (Контекст → URL сайта).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const wantContext = contextRequested && !!productDescription.trim();
    const wantLookalike = lookalikeRequested && !!selfHost;

    if (!wantContext && !wantLookalike && queries.length === 0) {
      const hints: string[] = [];
      if (contextRequested && !productDescription.trim()) {
        hints.push("заполните описание продукта в контексте проекта");
      }
      if (lookalikeRequested && !selfHost) {
        hints.push("укажите URL сайта");
      }
      if (modes.queries && queries.length === 0) {
        hints.push("введите хотя бы один поисковый запрос");
      }
      return new Response(
        JSON.stringify({
          error:
            hints.length > 0
              ? `Не удалось запустить поиск: ${hints.join("; ")}.`
              : "Выберите хотя бы один режим discovery",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tasks: Promise<Candidate[]>[] = [];
    const modesUsed: DiscoveryMode[] = [];

    if (wantContext && productDescription) {
      modesUsed.push("context");
      tasks.push(
        discoverByContext({
          projectDescription: productDescription,
          targetAudience: targetAudience || "не указана",
          productName,
          selfHost,
        }),
      );
    }
    if (wantLookalike && selfHost) {
      modesUsed.push("lookalike");
      tasks.push(
        discoverByLookalike({
          sourceUrl: websiteUrl,
          selfHost,
        }),
      );
    }
    for (const query of queries) {
      modesUsed.push("query");
      tasks.push(discoverByQuery({ query, selfHost }));
    }

    const settled = await Promise.allSettled(tasks);
    const all: Candidate[] = [];
    const errors: string[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled") {
        all.push(...r.value);
      } else {
        errors.push(String(r.reason instanceof Error ? r.reason.message : r.reason));
      }
    }

    const candidates = dedupCandidates(all);

    if (candidates.length === 0 && errors.length > 0) {
      const userMsg = errors[0]?.includes("GEMINI_API_KEY")
        ? "Не настроен GEMINI_API_KEY на сервере. Напишите в поддержку."
        : errors[0]?.includes("Google Search") || errors[0]?.includes("grounded")
          ? "Поиск Google временно недоступен. Попробуйте через минуту или добавьте конкурентов вручную."
          : errors[0]?.slice(0, 280) ?? "AI не смог выполнить поиск";
      return new Response(
        JSON.stringify({
          error: userMsg,
          errors,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await writeAdminLog(admin, {
      type: "competitor.discovery",
      message: `discovery: ${candidates.length} кандидатов, режимы=${modesUsed.join(",") || "—"}`,
      severity: candidates.length === 0 ? "warning" : "info",
      service: "discover-competitors",
      metadata: {
        project_id: projectId,
        user_id: userId,
        modes: modesUsed,
        queries_count: queries.length,
        candidates_count: candidates.length,
        errors_count: errors.length,
        duration_ms: Date.now() - startedAt,
      },
    });

    return new Response(
      JSON.stringify({
        candidates,
        modes_used: modesUsed,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("discover-competitors error:", msg);
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey);
        await writeAdminLog(admin, {
          type: "competitor.discovery.error",
          message: msg.slice(0, 1900),
          severity: "error",
          service: "discover-competitors",
          metadata: { project_id: projectId, user_id: userId },
        });
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: msg.slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
