export type ForgeLabChatRole = "kb_curator" | "copy_editor" | "test_strategist";

export type ForgeLabChatSuggestedAction = {
  type: "regenerate" | "lovable_export" | "edit_kb" | "publish";
  label: string;
  reason: string;
};

export type ForgeLabAbIdea = {
  hypothesis?: string;
  change?: string;
  metric?: string;
  min_traffic?: string;
  do_not_change?: string[];
};

export type ForgeLabChatAssistantMeta = {
  turn_mode?: string;
  kb_gaps?: string[];
  block_refs?: string[];
  cliches_found?: string[];
  suggested_actions?: ForgeLabChatSuggestedAction[];
  ab_idea?: ForgeLabAbIdea | null;
  role?: ForgeLabChatRole;
};

export type ForgeLabChatMessage = {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  meta?: ForgeLabChatAssistantMeta | Record<string, unknown>;
};

export type ForgeLabChatLoadResponse = {
  thread_id: string | null;
  role: ForgeLabChatRole;
  messages: ForgeLabChatMessage[];
  messages_remaining: number;
};

export type ForgeLabChatSendResponse = {
  reply: string;
  role: ForgeLabChatRole;
  meta?: ForgeLabChatAssistantMeta;
  thread_id: string;
  messages_remaining: number;
};

export const FORGE_LAB_CHAT_ROLE_LABELS: Record<ForgeLabChatRole, string> = {
  kb_curator: "Куратор KB",
  copy_editor: "Редактор",
  test_strategist: "Стратег тестов",
};

export const FORGE_LAB_QUICK_PROMPTS: {
  id: string;
  label: string;
  message: string;
  focus_block?: string;
}[] = [
  { id: "explain_hero", label: "Объясни hero", message: "Объясни блок hero простым языком.", focus_block: "hero" },
  {
    id: "cliche_check",
    label: "Проверь на клише",
    message: "Проверь весь прототип: клише, плейсхолдеры [...], off-topic отзывы.",
  },
  {
    id: "ab_headlines",
    label: "3 идеи A/B",
    message: "Предложи 3 гипотезы для A/B только заголовков — по одной переменной каждая.",
  },
  {
    id: "kb_gaps",
    label: "Чего не хватает в KB",
    message: "Чего не хватает в базе знаний для уверенной публикации в Директ?",
  },
  {
    id: "next_step",
    label: "Следующий шаг",
    message: "Можно ли уже вести трафик в Директ? Дай честный чеклист.",
  },
];
