/**
 * Схемы JSON-вывода Gemini для шаблонов Лаборатории.
 * Зеркалирует структуру forge_templates.steps и публичный рендер ClipStepRenderer.
 */
import { clip4SystemInstruction } from "./forgeClipReference.ts";

export { clip4SystemInstruction };

export const FORGE_CLIP4_SCHEMA = {
  type: "object",
  required: ["meta", "steps"],
  properties: {
    meta: {
      type: "object",
      required: ["project_name", "target_action", "tone_of_voice"],
      properties: {
        project_name: { type: "string" },
        target_action: { type: "string", description: "Что должен сделать пользователь" },
        tone_of_voice: { type: "string" },
        support_phone: { type: "string", description: "Телефон в шапке clip-лендинга" },
        live_readers_hint: {
          type: "number",
          description: "Базовое число для «Сейчас читают» (8–18)",
        },
      },
    },
    steps: {
      type: "array",
      description: "СТРОГО 4 шага в порядке: hook, why, proof, apply",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        required: ["key", "label"],
        properties: {
          key: { type: "string", description: "hook | why | proof | apply" },
          label: { type: "string" },
          hero: {
            type: "object",
            properties: {
              headline: { type: "string", description: "Главный заголовок шага. Короткий, бьющий, на боль/выгоду." },
              subheadline: { type: "string" },
              badge: { type: "string" },
            },
          },
          pain: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Обычно: «Если вам знакомо хотя бы что-то из этого:»",
              },
              points: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4,
                description: "Ровно 4 конкретных симптома-сцены",
              },
            },
          },
          pain_escalation: {
            type: "object",
            description: "Усиление боли — последствия бездействия перед CTA",
            properties: {
              headline: { type: "string", description: "К чему это ведёт, если ничего не менять" },
              body: { type: "string", description: "2–3 предложения эскалации ставок, без shock-маркетинга" },
            },
          },
          old_loop: {
            type: "object",
            description: "Петля старых способов — что пробовали и не сработало",
            properties: {
              title: { type: "string", description: "Например: «Что обычно пробуют — и почему не помогает»" },
              items: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 4,
              },
            },
          },
          mechanism: {
            type: "object",
            properties: {
              title: { type: "string" },
              body: { type: "string", description: "Как продукт решает проблему. 2-4 предложения." },
            },
          },
          benefits: {
            type: "object",
            description: "3–4 выгоды после механизма (экран why)",
            properties: {
              title: { type: "string" },
              items: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 4,
              },
            },
          },
          paradigm_shift: {
            type: "object",
            properties: {
              headline: { type: "string" },
              old_belief: { type: "string" },
              new_belief: { type: "string" },
              bridge: { type: "string", description: "Почему миф не работает" },
            },
          },
          story: {
            type: "object",
            description: "Главная история клиента (экран proof)",
            properties: {
              headline: { type: "string" },
              body: { type: "string", description: "Ситуация → что сделали → что изменилось" },
              author: { type: "string" },
              result: { type: "string", description: "Конкретный результат в цифрах или быту" },
            },
          },
          social_proof: {
            type: "object",
            properties: {
              title: { type: "string" },
              items: {
                type: "array",
                minItems: 2,
                items: {
                  type: "object",
                  required: ["quote", "author"],
                  properties: {
                    quote: { type: "string" },
                    author: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          metrics: {
            type: "object",
            properties: {
              title: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  required: ["number", "label"],
                  properties: {
                    number: { type: "string" },
                    label: { type: "string" },
                  },
                },
              },
            },
          },
          who_for: {
            type: "object",
            description: "Кому подойдёт / кому рано",
            properties: {
              title: { type: "string" },
              for_items: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
              },
              not_for_items: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          guarantee: {
            type: "object",
            properties: {
              headline: { type: "string" },
              body: { type: "string" },
            },
          },
          micro_trust: {
            type: "object",
            properties: {
              items: { type: "array", items: { type: "string" } },
            },
          },
          objections: {
            type: "object",
            description: "Короткие Q&A перед формой (экран apply)",
            properties: {
              items: {
                type: "array",
                minItems: 2,
                maxItems: 3,
                items: {
                  type: "object",
                  required: ["question", "answer"],
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                },
              },
            },
          },
          lead_form_personal: {
            type: "object",
            description: "ТОЛЬКО для шага apply",
            properties: {
              headline: { type: "string" },
              subheadline: { type: "string" },
              persona_name: { type: "string" },
              persona_role: { type: "string" },
              persona_status: { type: "string", description: "например: Сейчас онлайн" },
              cta: { type: "string" },
              consent_text: { type: "string" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  required: ["id", "placeholder"],
                  properties: {
                    id: { type: "string", description: "name | phone | email" },
                    placeholder: { type: "string" },
                  },
                },
              },
            },
          },
          cta: {
            type: "object",
            description: "Кнопка перехода на следующий шаг. Для apply — null/опускается.",
            properties: {
              label: { type: "string" },
              next_step: { type: "string" },
            },
          },
        },
      },
    },
  },
};
