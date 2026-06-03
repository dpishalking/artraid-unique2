/** JSON Schema для ответа forge-lab-chat (Gemini). */
export const FORGE_LAB_CHAT_SCHEMA = {
  type: "object",
  required: ["reply", "turn_mode"],
  properties: {
    reply: {
      type: "string",
      description: "Ответ пользователю на русском, markdown-lite, до ~1200 символов",
    },
    turn_mode: {
      type: "string",
      description: "answer | clarify | checklist | suggestion",
    },
    kb_gaps: {
      type: "array",
      items: { type: "string" },
      description: "Чего не хватает в базе знаний",
    },
    block_refs: {
      type: "array",
      items: { type: "string" },
      description: "Ссылки на поля blocks.*",
    },
    cliches_found: {
      type: "array",
      items: { type: "string" },
      description: "Найденные клише или плейсхолдеры",
    },
    suggested_actions: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "label", "reason"],
        properties: {
          type: {
            type: "string",
            description: "regenerate | lovable_export | edit_kb | publish",
          },
          label: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    ab_idea: {
      type: "object",
      properties: {
        hypothesis: { type: "string" },
        change: { type: "string" },
        metric: { type: "string" },
        min_traffic: { type: "string" },
        do_not_change: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

export type ForgeLabChatRole = "kb_curator" | "copy_editor" | "test_strategist";

export const FORGE_LAB_CHAT_ROLES: ForgeLabChatRole[] = [
  "kb_curator",
  "copy_editor",
  "test_strategist",
];
