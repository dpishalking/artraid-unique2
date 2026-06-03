import type { MainGoal } from "./types";

export const MAIN_GOAL_OPTIONS: { value: MainGoal; label: string }[] = [
  { value: "strengthen_offer", label: "Усилить оффер" },
  { value: "increase_conversion", label: "Увеличить конверсию лендинга" },
  { value: "compare_competitors", label: "Сравнить себя с конкурентами" },
  { value: "new_prototype", label: "Создать новый прототип лендинга" },
  { value: "find_weak_points", label: "Найти слабые места в упаковке" },
  { value: "test_hypothesis", label: "Проверить новую гипотезу" },
  { value: "new_launch", label: "Подготовить новый запуск" },
];

export function mainGoalLabel(value: string): string {
  return MAIN_GOAL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
