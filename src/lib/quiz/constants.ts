import type { MainGoal } from "@/lib/projects/types";
import type { StartupMode } from "@/lib/ideaLab/types";
import {
  ScanSearch,
  Megaphone,
  Layers,
  Users,
  type LucideIcon,
} from "lucide-react";

export const QUIZ_WELCOME_CREDITS = 30;

export const QUIZ_STORAGE_KEY = "mm_quiz_draft_v1";

/** Два пути в «Проект с нуля»; полный квиз — отдельная ссылка на шаге situation */
export const QUIZ_SITUATION_OPTIONS: {
  value: Extract<StartupMode, "has_idea" | "find_idea">;
  title: string;
  description: string;
}[] = [
  {
    value: "has_idea",
    title: "Есть идея, но хочу упаковать в продукт и продавать",
    description: "Коротко опишете задумку — дальше наставник поможет прояснить, кому и что вы продаёте",
  },
  {
    value: "find_idea",
    title: "Нет идеи, но хочу найти, что запускать",
    description: "Сразу в диалог с ИИ — вместе найдём направление, аудиторию и первый тест",
  },
];

export const QUIZ_GOAL_OPTIONS: { value: MainGoal; label: string; hint: string }[] = [
  {
    value: "increase_conversion",
    label: "Поднять конверсию",
    hint: "Найти, где сайт теряет заявки",
  },
  {
    value: "strengthen_offer",
    label: "Усилить оффер",
    hint: "Hero, пост, письмо, реклама",
  },
  {
    value: "new_prototype",
    label: "Собрать лендинг",
    hint: "Прототип с блоками и текстами",
  },
  {
    value: "find_weak_points",
    label: "Найти слабые места",
    hint: "Диагностика упаковки",
  },
  {
    value: "compare_competitors",
    label: "Сравнить с конкурентами",
    hint: "Отстройка и идеи",
  },
];

export const QUIZ_FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
  soon?: boolean;
}[] = [
  {
    icon: ScanSearch,
    title: "Аудит сайта",
    description: "Где теряете заявки и что переписать на лендинге",
  },
  {
    icon: Megaphone,
    title: "Генератор офферов",
    description: "Письмо, пост, hero, сторис — в контексте проекта",
  },
  {
    icon: Layers,
    title: "Прототип лендинга",
    description: "Структура и тексты блоков за минуты",
  },
  {
    icon: Users,
    title: "Анализ конкурентов",
    description: "Сравнение и гипотезы отстройки",
    soon: true,
  },
];
