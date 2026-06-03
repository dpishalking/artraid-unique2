// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  geminiFlashModel,
  geminiForcedFunctionCall,
} from "../_shared/gemini.ts";
import { buildScenarioPromptSection, getScenarioById } from "../_shared/landingScenarios.ts";
import { finishGeneration, startGeneration, writeAdminLog } from "../_shared/opsLog.ts";
import { loadProjectContextBlock } from "../_shared/projectContextForAI.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Schemas for each regeneratable block
const BLOCK_SCHEMAS: Record<string, any> = {
  hero: {
    type: "object",
    required: ["headline", "headline_variants", "subheadline", "cta", "trust"],
    properties: {
      headline: { type: "string" },
      headline_variants: { type: "array", minItems: 3, items: { type: "string" } },
      subheadline: { type: "string" },
      cta: { type: "string", description: "Формула: глагол + конкретный результат + минимизация риска" },
      trust: { type: "array", items: { type: "string" } },
      note: { type: "string" },
      story_opening: { type: "string" },
      story_bridge: { type: "string" },
    },
  },
  paradigm_shift: {
    type: "object",
    required: ["headline", "old_belief", "new_belief", "bridge", "note"],
    properties: {
      headline: { type: "string" },
      old_belief: { type: "string", description: "Распространённый миф — что люди думают или пробуют" },
      new_belief: { type: "string", description: "Как на самом деле / настоящая причина" },
      bridge: { type: "string", description: "Почему миф не работает" },
      transition_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  pain: {
    type: "object",
    required: ["title", "intro", "points", "note"],
    properties: {
      title: { type: "string" },
      intro: { type: "string", description: "Первый абзац — эмоциональный удар под дых. Без списка." },
      points: { type: "array", minItems: 5, items: { type: "string" } },
      transition_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  enemy_section: {
    type: "object",
    required: ["headline", "enemy_name", "how_enemy_works", "proof", "note"],
    properties: {
      headline: { type: "string" },
      enemy_name: { type: "string" },
      how_enemy_works: { type: "string" },
      proof: { type: "string" },
      transition_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  solution: {
    type: "object",
    required: ["title", "steps", "note"],
    properties: {
      title: { type: "string" },
      steps: {
        type: "array", minItems: 3,
        items: { type: "object", required: ["title", "desc"], properties: { title: { type: "string" }, desc: { type: "string" } } },
      },
      transition_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  transformation: {
    type: "object",
    required: ["headline", "before", "after", "timeline", "note"],
    properties: {
      headline: { type: "string" },
      before: { type: "array", minItems: 3, items: { type: "string" } },
      after: { type: "array", minItems: 3, items: { type: "string" } },
      timeline: { type: "string" },
      note: { type: "string" },
    },
  },
  value: {
    type: "object",
    required: ["title", "metrics", "note"],
    properties: {
      title: { type: "string" },
      metrics: {
        type: "array", minItems: 3,
        items: {
          type: "object", required: ["number", "label"],
          properties: {
            number: { type: "string" },
            label: { type: "string" },
            loss_framing: { type: "string" },
            fascination: { type: "string" },
          },
        },
      },
      note: { type: "string" },
    },
  },
  product: {
    type: "object",
    required: ["title", "tiers", "note"],
    properties: {
      title: { type: "string" },
      anchor_context: { type: "string" },
      tiers: {
        type: "array",
        items: {
          type: "object", required: ["name", "price", "features"],
          properties: {
            name: { type: "string" }, price: { type: "string" },
            description: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            cta: { type: "string" },
          },
        },
      },
      note: { type: "string" },
    },
  },
  process: {
    type: "object",
    required: ["title", "steps", "note"],
    properties: {
      title: { type: "string" },
      steps: {
        type: "array", minItems: 3,
        items: {
          type: "object", required: ["title", "desc"],
          properties: { title: { type: "string" }, desc: { type: "string" }, duration: { type: "string" } },
        },
      },
      note: { type: "string" },
    },
  },
  founder: {
    type: "object",
    required: ["headline", "story", "credentials", "why_this", "note"],
    properties: {
      headline: { type: "string" },
      story: { type: "string" },
      credentials: { type: "array", minItems: 3, items: { type: "string" } },
      why_this: { type: "string" },
      transition_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  comparison: {
    type: "object",
    required: ["title", "us_label", "them_label", "rows", "note"],
    properties: {
      title: { type: "string" }, us_label: { type: "string" }, them_label: { type: "string" },
      differentiation_angle: { type: "string" },
      rows: {
        type: "array", minItems: 4,
        items: {
          type: "object", required: ["feature", "us", "them"],
          properties: { feature: { type: "string" }, us: { type: "string" }, them: { type: "string" } },
        },
      },
      note: { type: "string" },
    },
  },
  social_proof: {
    type: "object",
    required: ["title", "items", "note"],
    properties: {
      title: { type: "string" },
      items: {
        type: "array", minItems: 3,
        items: {
          type: "object", required: ["quote", "author", "role", "result"],
          properties: {
            quote: { type: "string" }, author: { type: "string" }, role: { type: "string" },
            result: { type: "string" }, before_state: { type: "string" },
          },
        },
      },
      note: { type: "string" },
    },
  },
  not_for: {
    type: "object",
    required: ["title", "points", "note"],
    properties: {
      title: { type: "string" },
      intro: { type: "string" },
      points: { type: "array", minItems: 4, items: { type: "string" } },
      note: { type: "string" },
    },
  },
  objections: {
    type: "object",
    required: ["title", "items", "note"],
    properties: {
      title: { type: "string" },
      items: {
        type: "array", minItems: 5,
        items: {
          type: "object", required: ["objection", "answer"],
          properties: {
            objection: { type: "string" }, answer: { type: "string" },
            reframe: { type: "string" }, frequency: { type: "string" },
          },
        },
      },
      note: { type: "string" },
    },
  },
  faq: {
    type: "object",
    required: ["title", "items", "note"],
    properties: {
      title: { type: "string" },
      items: {
        type: "array", minItems: 4,
        items: {
          type: "object", required: ["q", "a"],
          properties: { q: { type: "string" }, a: { type: "string" } },
        },
      },
      note: { type: "string" },
    },
  },
  future_pacing: {
    type: "object",
    required: ["headline", "scene", "emotions", "contrast", "note"],
    properties: {
      headline: { type: "string" },
      scene: { type: "string" },
      emotions: { type: "string" },
      contrast: { type: "string" },
      note: { type: "string" },
    },
  },
  guarantee: {
    type: "object",
    required: ["headline", "type", "duration", "conditions", "emotional_hook", "note"],
    properties: {
      headline: { type: "string" },
      type: { type: "string" },
      duration: { type: "string" },
      conditions: { type: "string" },
      emotional_hook: { type: "string" },
      note: { type: "string" },
    },
  },
  final_cta: {
    type: "object",
    required: ["headline", "subheadline", "cta", "note"],
    properties: {
      headline: { type: "string" }, subheadline: { type: "string" }, cta: { type: "string" },
      urgency: { type: "string" }, risk_reversal: { type: "string" }, note: { type: "string" },
    },
  },
  micro_copy: {
    type: "object",
    required: ["form_placeholder", "form_submit", "form_success", "trust_badge"],
    properties: {
      form_placeholder: { type: "string" }, form_submit: { type: "string" },
      form_success: { type: "string" }, trust_badge: { type: "string" },
      nav_cta: { type: "string" }, hero_badge: { type: "string" },
    },
  },
};

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero / первый экран",
  paradigm_shift: "Миф и правда",
  pain: "Боль",
  enemy_section: "Враг",
  solution: "Решение",
  transformation: "Трансформация (ДО/ПОСЛЕ)",
  value: "Ценность в цифрах",
  product: "Продукт / тарифы",
  process: "Процесс / как работаем",
  founder: "Основатель",
  comparison: "Сравнение с конкурентами",
  social_proof: "Социальные доказательства",
  not_for: "Кому не подходит",
  objections: "Возражения",
  faq: "FAQ",
  future_pacing: "Future Pacing",
  guarantee: "Гарантия",
  final_cta: "Финальный CTA",
  micro_copy: "Micro-copy",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { prototype_id, block_key } = body as { prototype_id: string; block_key: string };

    if (!prototype_id || !block_key) {
      return new Response(JSON.stringify({ error: "Нужны prototype_id и block_key" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!BLOCK_SCHEMAS[block_key]) {
      return new Response(JSON.stringify({ error: `Неизвестный блок: ${block_key}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const startedAt = Date.now();
    const generationId = await startGeneration(admin, {
      user_id: user.id,
      type: "block_regeneration",
      prototype_id,
      input_data: { block_key },
      model: geminiFlashModel(),
    });

    // Load the prototype
    const { data: proto, error: protoErr } = await admin
      .from("prototypes")
      .select("brief, content, project_id")
      .eq("id", prototype_id)
      .eq("user_id", user.id)
      .single();

    if (protoErr || !proto) {
      return new Response(JSON.stringify({ error: "Прототип не найден" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const brief = proto.brief as Record<string, unknown>;
    const currentContent = proto.content as any;
    const blockLabel = BLOCK_LABELS[block_key] ?? block_key;

    const scenario = getScenarioById(brief.scenario_id as string);
    const answers = brief.answers as Record<string, string> | undefined;

    let briefText: string;
    if (scenario && answers) {
      briefText = scenario.questions
        .map((q) => {
          const val = answers[q.id]?.trim();
          return val ? `${q.label}: ${val}` : null;
        })
        .filter(Boolean)
        .join("\n");
    } else {
      briefText = [
        brief.niche ? `Ниша: ${brief.niche}` : "",
        brief.product ? `Продукт: ${brief.product}` : "",
        brief.audience ? `Аудитория: ${brief.audience}` : "",
        brief.offer ? `Оффер: ${brief.offer}` : "",
        brief.price ? `Цена: ${brief.price}` : "",
        brief.guarantee ? `Гарантия: ${brief.guarantee}` : "",
        brief.mechanism ? `Уникальный механизм: ${brief.mechanism}` : "",
        brief.bigidea ? `BIG Idea: ${brief.bigidea}` : "",
        brief.enemy ? `Враг: ${brief.enemy}` : "",
        brief.traffic ? `Трафик: ${brief.traffic}` : "",
        brief.format ? `Формат сайта: ${brief.format}` : "",
      ].filter(Boolean).join("\n");
    }

    // Include context from other blocks for coherence
    const contextBlocks = ["hero", "pain", "solution"].filter(k => k !== block_key && currentContent?.blocks?.[k]);
    const contextText = contextBlocks.map(k => {
      const bl = currentContent.blocks[k];
      if (k === "hero" && bl?.headline) return `Hero заголовок: ${bl.headline}`;
      if (k === "pain" && bl?.title) return `Боль: ${bl.title}`;
      if (k === "solution" && bl?.title) return `Решение: ${bl.title}`;
      return "";
    }).filter(Boolean).join("\n");

    let projectAiContext = "";
    const linkedPid = proto.project_id ? String(proto.project_id) : "";
    if (linkedPid) {
      try {
        projectAiContext = await loadProjectContextBlock(admin, linkedPid, user.id);
      } catch (e) {
        console.warn("loadProjectContextBlock (regenerate-block)", e);
      }
    }

    const memoryTail = projectAiContext.trim().length > 40
      ? `\n\n## ПЕРЕДАННЫЙ ИЗ ПРОЕКТА КОНТЕКСТ\n${projectAiContext}\n(Используй как память пользователя при переписке блока при отсутствии прямых противоречий с текущими блоками ниже по брифу.)`
      : "";

    const systemPrompt =
      `Ты — старший копирайтер и продакт-маркетолог. Твоя задача — переписать ОДИН блок лендинга, сохраняя связность с остальным контентом.

Принципы:
- Конкретика вместо общих слов (цифры, сцены, факты)
- Голос клиента (VOC) — используй язык из реальных отзывов, не маркетинговые клише
- Запрещено: "качественный", "профессиональный", "индивидуальный подход", "команда экспертов"
- НЕ используй markdown-разметку внутри текстовых полей
- Если в поле transition_hook — пиши одно предложение-крюк по методу Sugarman (тянет к следующему экрану)
- Если в поле reframe в objections — сначала валидируй страх, потом разрушай убеждение (Chris Voss)` +
      memoryTail;

    const scenarioSection = scenario
      ? `\n\n${buildScenarioPromptSection(scenario, answers ?? {})}`
      : "";
    const userPrompt = `## БРИФ\n${briefText}${scenarioSection}\n\n## КОНТЕКСТ ДРУГИХ БЛОКОВ\n${contextText || "нет"}\n\n## ЗАДАЧА\nПерепиши блок "${blockLabel}" (ключ: ${block_key}). Он должен быть сильнее предыдущей версии — конкретнее, эмоциональнее, убедительнее. Соблюдай minItems для массивов.${scenario ? ` CTA и тон — под сценарий «${scenario.title}», основной CTA: «${scenario.primaryCTA}».` : ""}`;

    const toolSchema = {
      type: "object",
      required: [block_key],
      properties: { [block_key]: BLOCK_SCHEMAS[block_key] },
    };

    let parsed: Record<string, unknown>;
    try {
      const r = await geminiForcedFunctionCall({
        model: geminiFlashModel(),
        systemInstruction: systemPrompt,
        userParts: [{ text: userPrompt }],
        functionName: "emit_block",
        functionDescription: `Возвращает переписанный блок ${blockLabel}`,
        parameters: toolSchema as Record<string, unknown>,
        temperature: 0.7,
        maxOutputTokens: 16_384,
      });
      parsed = r.args as Record<string, unknown>;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("regenerate-block Gemini:", msg);
      await finishGeneration(admin, generationId, {
        status: "failed",
        error_message: msg.slice(0, 900),
        duration_ms: Date.now() - startedAt,
        prototype_id,
      });
      await writeAdminLog(admin, {
        type: "block_regeneration_failed",
        message: `${prototype_id}/${block_key}: ${msg.slice(0, 280)}`,
        severity: "error",
        service: "regenerate-block",
        metadata: { user_id: user.id, prototype_id, block_key },
      });
      if (/HTTP 429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg)) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте через минуту" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBlock = parsed[block_key];
    if (!newBlock) throw new Error("Блок не найден в ответе AI");

    const updatedContent = {
      ...currentContent,
      blocks: { ...currentContent.blocks, [block_key]: newBlock },
    };
    await admin.from("prototypes").update({ content: updatedContent }).eq("id", prototype_id);

    await finishGeneration(admin, generationId, {
      status: "success",
      duration_ms: Date.now() - startedAt,
      prototype_id,
    });

    return new Response(JSON.stringify({ block_key, block: newBlock }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-block error", e);
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      await writeAdminLog(admin, {
        type: "block_regeneration_failed",
        message: e instanceof Error ? e.message : "Ошибка регенерации",
        severity: "error",
        service: "regenerate-block",
      });
    } catch {
      /* ignore */
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ошибка регенерации" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
