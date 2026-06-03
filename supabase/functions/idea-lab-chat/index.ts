import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiJsonResponse,
  requireGeminiKey,
  stripGeminiUnsafeSchema,
} from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAGES = [
  "idea",
  "problem",
  "audience",
  "value",
  "format",
  "validation",
  "offer",
  "actions",
] as const;

type StageId = (typeof STAGES)[number];

const STAGE_PLAYBOOK: Record<StageId, string> = {
  idea: "Один вопрос: что хотите создать и зачем это важно лично вам.",
  problem: "Один вопрос: какую конкретную боль или задачу снимаете (ситуация, не абстракция).",
  audience: "Один вопрос: для кого именно (возраст, контекст жизни, не «все»).",
  value: "Один вопрос: что изменится у клиента после (измеримо или ощутимо).",
  format: "Один вопрос: в каком формате проще всего проверить (сессия, курс, чек-лист…).",
  validation: "Один вопрос: как за 2–3 дня проверить интерес (кому спросить, что показать).",
  offer:
    "Сформулируй в card.primary_offer одну ясную фразу: что продаёте и кому. Цель — кристальная ясность продукта, не рекламный текст. handoff в offer_generator только если пользователь явно просит готовый текст.",
  actions: "Один вопрос о следующем шаге ИЛИ handoff, если просят текст.",
};

const SHARED_RULES = `## Правила (для всех ролей)
- Один короткий вопрос за раз (до 2 предложений + вопрос). Русский язык.
- **Цель Idea Lab** — кристальная ясность продукта: кому продаём, что продаём, какую боль снимаем, в каком формате. Не пиши готовые рекламные тексты, посты и лендинги в reply.
- Если ответ общий — уточни: **кому**, **в какой ситуации**, **какой результат**.
- **proposals** — почти всегда []. Исключение: этап format и clarity ≥ 70 — максимум 2 конкретных формата.
- **assumptions** — пустой массив.
- **insight** — только при смене этапа, одна короткая фраза.
- **card** — только подтверждённое из слов пользователя, до 100 символов на поле.
- **stage**: idea → problem → audience → value → format → validation → offer → actions.
- **clarity_percent** — 0–100 по заполненности card.
- **reply** — максимум 280 символов: короткое отражение + **один** вопрос.
- **turn_mode**: explore | clarify | summarize | handoff.

## Handoff в генератор текстов
Только если stage=offer (или явная просьба готового текста при clarity ≥ 65), card заполнена (аудитория, боль, результат, формат), clarity ≥ 62.

## Playbook по этапам
${Object.entries(STAGE_PLAYBOOK).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

## Антипаттерны
- Несколько вопросов в одном reply.
- handoff раньше offer.
- Упоминание JSON, схемы, «как ИИ».`;

const ROLE_INTROS: Record<string, string> = {
  coach: `Ты — коуч по запуску продукта «Проект с нуля». Тёплый, деловой тон. Веди коучинговым диалогом вопросами — помогай собрать идею без давления.`,
  investor: `Ты — венчурный инвестор на питч-сессии. Прямой, деловой тон без воды. Спрашивай про: рынок и масштаб, монетизацию, почему сейчас, конкурентов, защиту (moat), риски, что уже проверено. Не хвали без оснований — ищи доказательства. Если идея сырая — скажи честно и спроси, что проверят первым.`,
  critic: `Ты — жёсткий разборщик бизнес-идей. Без сантиментов, но конструктивно. Ищи: логические дыры, необоснованные допущения, слабую монетизацию, неясную аудиторию, риски провала. Задавай неудобные вопросы «почему это может не сработать» — чтобы усилить идею, не чтобы обесценить.`,
};

function buildSystem(coachRole: string): string {
  const role = ["coach", "investor", "critic"].includes(coachRole) ? coachRole : "coach";
  return `${ROLE_INTROS[role]}\n\n${SHARED_RULES}`;
}

const PROPOSAL_SCHEMA = {
  type: "object",
  required: ["title", "for_who", "promise", "format"],
  properties: {
    title: { type: "string", description: "Коротое название концепции, 3-6 слов" },
    for_who: { type: "string", description: "Сегмент, до 80 символов" },
    promise: { type: "string", description: "Обещание результата, до 100 символов" },
    format: { type: "string", description: "Формат продукта, до 80 символов" },
  },
};

const CARD_FIELD_KEYS = [
  "idea_name",
  "short_description",
  "target_audience",
  "main_problem",
  "desired_outcome",
  "product_format",
  "primary_offer",
  "mvp",
  "demand_hypotheses",
  "next_step",
] as const;

const COACH_RESPONSE_SCHEMA = stripGeminiUnsafeSchema({
  type: "object",
  required: ["reply", "stage", "clarity_percent", "card", "turn_mode"],
  properties: {
    reply: { type: "string", description: "Текст наставника пользователю" },
    insight: { type: "string", description: "Одна фраза инсайта хода" },
    interim_summary: { type: "string", description: "Вывод этапа" },
    assumptions: {
      type: "array",
      items: { type: "string" },
      description: "1-2 непроверенные гипотезы",
    },
    proposals: {
      type: "array",
      items: PROPOSAL_SCHEMA,
      description: "2-3 концепции продукта",
    },
    turn_mode: {
      type: "string",
      enum: ["explore", "clarify", "summarize", "handoff"],
    },
    handoff: {
      type: "object",
      properties: {
        service: {
          type: "string",
          enum: ["offer_generator", "prototype", "audit", "quiz"],
        },
        purpose: { type: "string" },
        label: { type: "string" },
        reason: { type: "string" },
      },
    },
    stage: { type: "string", enum: [...STAGES] },
    clarity_percent: { type: "number", description: "0-100 ясность проекта" },
    card: {
      type: "object",
      properties: Object.fromEntries(
        CARD_FIELD_KEYS.map((k) => [k, { type: "string" }]),
      ),
    },
  },
}) as Record<string, unknown>;

type CoachProposal = {
  title: string;
  for_who: string;
  promise: string;
  format: string;
};

function countFilledCard(card: Record<string, string>): number {
  return CARD_FIELD_KEYS.filter((k) => (card[k] ?? "").trim().length >= 3).length;
}

function normalizeProposals(raw: unknown): CoachProposal[] {
  if (!Array.isArray(raw)) return [];
  const out: CoachProposal[] = [];
  for (const item of raw.slice(0, 3)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = String(o.title ?? "").trim();
    const for_who = String(o.for_who ?? "").trim();
    const promise = String(o.promise ?? "").trim();
    const format = String(o.format ?? "").trim();
    if (title.length < 2 || promise.length < 4) continue;
    out.push({
      title: title.slice(0, 80),
      for_who: for_who.slice(0, 100),
      promise: promise.slice(0, 120),
      format: format.slice(0, 100),
    });
  }
  return out;
}

type ServiceHandoff = {
  service: "offer_generator" | "prototype" | "audit" | "quiz";
  purpose?: string;
  label: string;
  reason: string;
};

function normalizeHandoff(raw: unknown): ServiceHandoff | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const service = String(o.service ?? "");
  if (!["offer_generator", "prototype", "audit", "quiz"].includes(service)) return undefined;
  const label = String(o.label ?? "").trim().slice(0, 60);
  const reason = String(o.reason ?? "").trim().slice(0, 200);
  if (label.length < 4 || reason.length < 8) return undefined;
  const purpose = typeof o.purpose === "string" && o.purpose.trim()
    ? o.purpose.trim().slice(0, 40)
    : undefined;
  return {
    service: service as ServiceHandoff["service"],
    purpose,
    label,
    reason,
  };
}

function isReadyForOfferHandoff(
  stage: StageId,
  clarity: number,
  card: Record<string, string>,
  message: string,
): boolean {
  const audience = (card.target_audience ?? "").trim();
  const problem = (card.main_problem ?? "").trim();
  const outcome = (card.desired_outcome ?? "").trim();
  const format = (card.product_format ?? "").trim();
  const hasCore =
    audience.length >= 8 &&
    problem.length >= 8 &&
    outcome.length >= 6 &&
    format.length >= 4;
  if (!hasCore || clarity < 62) return false;
  if (stage === "offer") return true;
  const msg = message.toLowerCase();
  const asksCopy = /черновик|напиш|состав.*(пост|оффер)|готов.*текст|собери пост/i.test(msg);
  if (asksCopy && clarity >= 65 && (stage === "actions" || stage === "validation")) return true;
  return false;
}

function buildOfferHandoff(message: string): ServiceHandoff {
  const msg = message.toLowerCase();
  let purpose: string | undefined;
  if (/пост|промо|stories|рилс|соцсет/i.test(msg)) purpose = "post";
  else if (/лендинг|hero|главн/i.test(msg)) purpose = "landing_hero";
  else if (/email|письм/i.test(msg)) purpose = "email";
  else if (/реклам|объявлен/i.test(msg)) purpose = "ad";
  return {
    service: "offer_generator",
    purpose,
    label: purpose === "post" ? "Собрать пост в генераторе" : "Открыть генератор текстов",
    reason:
      "Продукт прояснён — готовые тексты для поста или лендинга собираются в мастерской, карточка подставится.",
  };
}

function replyWithHandoff(reply: string, handoff?: ServiceHandoff): string {
  if (!handoff) return reply;
  if (/вот черновик|вот текст|ниже пост|вот пост|уже ждёт|собран/i.test(reply)) {
    return "Готовый текст — в генераторе в мастерской. Нажмите кнопку ниже — контекст подставится.";
  }
  if (reply.length > 380) return reply.slice(0, 380);
  return reply;
}

function normalizeAssumptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => String(a ?? "").trim())
    .filter((s) => s.length >= 6)
    .slice(0, 2)
    .map((s) => s.slice(0, 120));
}

/** Восстановление ответа, если Gemini обрезал JSON. */
function salvageCoachJson(
  text: string,
  existingCard: Record<string, string>,
): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed.reply === "string" && parsed.reply.trim()) return parsed;
  } catch {
    /* continue */
  }

  const replyKey = '"reply"';
  const idx = trimmed.indexOf(replyKey);
  if (idx < 0) return null;

  const colon = trimmed.indexOf(":", idx + replyKey.length);
  if (colon < 0) return null;

  let start = trimmed.indexOf('"', colon + 1);
  if (start < 0) return null;
  start += 1;

  let reply = trimmed.slice(start);
  const nextField = reply.search(
    /",\s*"(insight|stage|interim_summary|clarity_percent|card|proposals|assumptions|turn_mode)"/,
  );
  if (nextField > 0) {
    reply = reply.slice(0, nextField);
  } else {
    reply = reply.replace(/"\s*}\s*$/, "").replace(/"\s*,\s*$/, "");
  }
  reply = reply
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();

  if (reply.length < 8) return null;

  const stageMatch = trimmed.match(/"stage"\s*:\s*"([^"]+)"/);
  const clarityMatch = trimmed.match(/"clarity_percent"\s*:\s*(\d+)/);
  const insightMatch = trimmed.match(/"insight"\s*:\s*"([^"]*)"/);
  const turnMatch = trimmed.match(/"turn_mode"\s*:\s*"([^"]+)"/);
  const stageRaw = stageMatch?.[1] ?? "idea";
  const stage = STAGES.includes(stageRaw as StageId) ? stageRaw : "idea";

  let card = { ...existingCard };
  const cardIdx = trimmed.indexOf('"card"');
  if (cardIdx > 0) {
    try {
      const cardSlice = trimmed.slice(cardIdx);
      const open = cardSlice.indexOf("{");
      if (open >= 0) {
        const partial = cardSlice.slice(open);
        const closed = partial.indexOf("}");
        if (closed > 0) {
          const parsedCard = JSON.parse(partial.slice(0, closed + 1)) as Record<string, string>;
          card = { ...card, ...parsedCard };
        }
      }
    } catch {
      /* keep existing card */
    }
  }

  const result: Record<string, unknown> = {
    reply,
    stage,
    clarity_percent: clarityMatch ? Number(clarityMatch[1]) : 0,
    card,
    turn_mode: turnMatch?.[1] ?? "explore",
  };
  if (insightMatch?.[1]) result.insight = insightMatch[1];

  return result;
}

async function requestCoachJson(
  prompt: string,
  existingCard: Record<string, string>,
  coachRole: string,
  attempt: number,
): Promise<Record<string, unknown>> {
  const strictNote =
    attempt > 0
      ? "\n\nВАЖНО: reply до 220 символов, один вопрос. proposals=[], assumptions=[]. card — макс. 2 поля."
      : "";

  const raw = await geminiJsonResponse({
    model: geminiFlashModel(),
    systemInstruction: buildSystem(coachRole),
    userParts: [{ text: prompt + strictNote }],
    responseSchema: COACH_RESPONSE_SCHEMA,
    temperature: attempt > 0 ? 0.45 : 0.65,
    maxOutputTokens: 8192,
    salvageParse: (t) => salvageCoachJson(t, existingCard),
  });

  return raw as Record<string, unknown>;
}

function formatHistoryMessage(m: { role?: string; content?: string; coach?: unknown }): string {
  const role = m.role === "user" ? "Пользователь" : "Наставник";
  let line = `${role}: ${String(m.content ?? "").slice(0, 500)}`;
  const coach = m.coach;
  if (coach && typeof coach === "object") {
    const c = coach as Record<string, unknown>;
    if (typeof c.insight === "string" && c.insight.trim()) {
      line += `\n  [инсайт: ${c.insight.slice(0, 120)}]`;
    }
    if (Array.isArray(c.proposals) && c.proposals.length > 0) {
      const titles = c.proposals
        .slice(0, 3)
        .map((p) => (p && typeof p === "object" ? String((p as Record<string, unknown>).title ?? "") : ""))
        .filter(Boolean);
      if (titles.length) line += `\n  [предлагал варианты: ${titles.join("; ")}]`;
    }
  }
  return line;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    requireGeminiKey();
    const body = await req.json().catch(() => ({}));
    const isDemo = body.demo === true;
    const projectId = String(body.project_id ?? "");
    const message = String(body.message ?? "").trim();
    const history = Array.isArray(body.messages) ? body.messages : [];

    if (!message) {
      return new Response(JSON.stringify({ error: "message обязателен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isDemo && !projectId) {
      return new Response(JSON.stringify({ error: "project_id обязателен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coachRoleRaw = String(body.coach_role ?? "coach");
    const coachRole = ["coach", "investor", "critic"].includes(coachRoleRaw) ? coachRoleRaw : "coach";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    let project: {
      name?: string;
      startup_mode?: string;
      product_description?: string;
    } | null = null;
    let existingCard: Record<string, string> = {};

    if (isDemo) {
      const userTurns = history.filter((m: { role?: string }) => m.role === "user").length;
      if (userTurns >= 24) {
        return new Response(JSON.stringify({ error: "Лимит демо-сообщений. Создайте проект, чтобы продолжить." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      project = {
        name: "Демо · Проект с нуля",
        startup_mode: String(body.startup_mode ?? "find_idea"),
        product_description: body.seed_idea ? String(body.seed_idea) : undefined,
      };
      existingCard =
        body.card && typeof body.card === "object"
          ? (body.card as Record<string, string>)
          : {};
    } else {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token && token !== anon) {
        const userClient = createClient(supabaseUrl, anon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: proj } = await admin.from("projects").select("user_id").eq("id", projectId).maybeSingle();
          if (proj && proj.user_id !== user.id) {
            return new Response(JSON.stringify({ error: "Нет доступа" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      const { data: row } = await admin
        .from("projects")
        .select("name, product_description, target_audience, startup_mode, idea_lab_state")
        .eq("id", projectId)
        .maybeSingle();

      project = row;
      const existingState = (row?.idea_lab_state ?? {}) as Record<string, unknown>;
      existingCard = (existingState.card ?? {}) as Record<string, string>;
    }

    const filledCount = countFilledCard(existingCard);
    const historyText = history.slice(-16).map(formatHistoryMessage).join("\n");

    const prompt = `Контекст проекта: ${project?.name ?? "новый"}
Режим старта: ${project?.startup_mode ?? "unclear"}
Роль наставника: ${coachRole === "investor" ? "венчурный инвестор" : coachRole === "critic" ? "разборщик" : "коуч"}
Заполнено полей карточки: ${filledCount} из ${CARD_FIELD_KEYS.length}
Уже в карточке: ${JSON.stringify(existingCard)}

История диалога:
${historyText}

Новое сообщение пользователя:
${message}

Верни JSON. Коучинг: один вопрос в reply. proposals и assumptions — пустые массивы, кроме 2 форматов на этапе format при clarity ≥ 70.
handoff — только на этапе offer при заполненной карточке (аудитория, боль, результат, формат).`;

    let args: Record<string, unknown> | null = null;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        args = await requestCoachJson(prompt, existingCard, coachRole, attempt);
        break;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        console.warn("idea-lab-chat attempt", attempt + 1, lastErr.message);
      }
    }
    if (!args) throw lastErr ?? new Error("Не удалось получить ответ наставника");

    const stageRaw = String(args.stage ?? "idea");
    const stage: StageId = STAGES.includes(stageRaw as StageId) ? (stageRaw as StageId) : "idea";
    const clarity = Math.min(100, Math.max(0, Number(args.clarity_percent) || 0));
    const cardRaw = args.card;
    const card: Record<string, string> = {};
    if (cardRaw && typeof cardRaw === "object" && !Array.isArray(cardRaw)) {
      for (const key of CARD_FIELD_KEYS) {
        const v = (cardRaw as Record<string, unknown>)[key];
        if (typeof v === "string" && v.trim()) card[key] = v.trim();
      }
    }

    let handoff: ServiceHandoff | undefined = undefined;
    if (isReadyForOfferHandoff(stage, clarity, card, message)) {
      handoff = normalizeHandoff(args.handoff) ?? buildOfferHandoff(message);
    }
    const reply = replyWithHandoff(
      String(args.reply ?? "Расскажите чуть подробнее — что вас тянет создать?"),
      handoff,
    );

    let proposals = normalizeProposals(args.proposals);
    if (stage !== "format" || clarity < 70) proposals = [];
    const assumptions: string[] = [];
    const insight = typeof args.insight === "string" && args.insight.trim()
      ? args.insight.trim().slice(0, 200)
      : undefined;
    const interim_summary =
      typeof args.interim_summary === "string" && args.interim_summary.trim()
        ? args.interim_summary.trim().slice(0, 280)
        : undefined;
    const turn_mode =
      typeof args.turn_mode === "string" ? args.turn_mode : "explore";

    return new Response(
      JSON.stringify({
        reply,
        stage,
        clarity_percent: clarity,
        card,
        insight,
        interim_summary,
        assumptions,
        proposals,
        turn_mode,
        handoff,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("idea-lab-chat", e);
    const msg = e instanceof Error ? e.message : "Ошибка Idea Lab";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
