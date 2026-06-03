import type { IdeaLabStageId } from "./types";

export const IDEA_LAB_STAGES: {
  id: IdeaLabStageId;
  title: string;
  hint: string;
}[] = [
  { id: "idea", title: "Исходная идея", hint: "Что хотите создать и почему это важно" },
  { id: "problem", title: "Проблема", hint: "Какую боль или задачу решаете" },
  { id: "audience", title: "Аудитория", hint: "Для кого это ценно" },
  { id: "value", title: "Ценность", hint: "Что изменится у клиента" },
  { id: "format", title: "Формат продукта", hint: "Самый простой способ проверить" },
  { id: "validation", title: "Проверка идеи", hint: "Первые 10 человек и тест" },
  { id: "offer", title: "Суть продукта", hint: "Что продаёте, кому и зачем — одной ясной фразой" },
  { id: "actions", title: "Следующие шаги", hint: "Что сделать в сервисе дальше" },
];

export function stageIndex(id: IdeaLabStageId): number {
  return IDEA_LAB_STAGES.findIndex((s) => s.id === id);
}

export function nextStageId(id: IdeaLabStageId): IdeaLabStageId {
  const i = stageIndex(id);
  if (i < 0 || i >= IDEA_LAB_STAGES.length - 1) return "actions";
  return IDEA_LAB_STAGES[i + 1].id;
}
