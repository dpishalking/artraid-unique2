import type { QuickWinScenarioId } from "./types";

export type QuickWinScenario = {
  id: QuickWinScenarioId;
  title: string;
  description: string;
  result: string;
  credits: number;
  durationLabel: string;
  path: (projectId: string) => string;
};

export const QUICK_WIN_SCENARIOS: QuickWinScenario[] = [
  {
    id: "audit",
    title: "Проверить сайт и найти слабые места",
    description: "Экспресс-аудит упаковки и конверсии по вашему URL.",
    result: "Отчёт с проблемами, быстрыми правками и приоритетами.",
    credits: 0,
    durationLabel: "2–3 мин",
    path: (id) => `/audit?projectId=${id}&onboarding=1`,
  },
  {
    id: "offer",
    title: "Собрать сильный оффер",
    description: "5–7 вариантов оффера под вашу аудиторию и цель.",
    result: "Готовые формулировки + проверка по 4U.",
    credits: 0,
    durationLabel: "3–5 мин",
    path: (id) => `/offer-generator?projectId=${id}&onboarding=1`,
  },
  {
    id: "prototype",
    title: "Получить структуру нового лендинга",
    description: "Смысловой прототип из 19 блоков под ваш продукт.",
    result: "Структура страницы, которую можно отдать в вёрстку.",
    credits: 1,
    durationLabel: "4–6 мин",
    path: (id) => `/prototype?projectId=${id}&onboarding=1`,
  },
  {
    id: "conversion_gaps",
    title: "Найти, почему люди не оставляют заявки",
    description: "Разбор воронки и точек потери на основе сайта и контекста.",
    result: "3 главные причины + что исправить в первую очередь.",
    credits: 0,
    durationLabel: "2–3 мин",
    path: (id) => `/audit?projectId=${id}&onboarding=1&focus=conversion`,
  },
  {
    id: "hero_variants",
    title: "Придумать 5 вариантов первого экрана",
    description: "Заголовки и подзаголовки для hero-блока лендинга.",
    result: "5 готовых связок «заголовок + обещание + CTA».",
    credits: 0,
    durationLabel: "3–4 мин",
    path: (id) => `/offer-generator?projectId=${id}&onboarding=1&purpose=landing_hero`,
  },
];

export const ROUTE_STEPS_META: {
  id: import("./types").OnboardingRouteStepId;
  label: string;
  description: string;
  to: (projectId: string) => string;
}[] = [
  {
    id: "project_card",
    label: "Проверить карточку проекта",
    description: "Дополнить данные из квиза",
    to: (id) => `/projects/${id}/onboarding?step=project_card`,
  },
  {
    id: "offer",
    label: "Сгенерировать оффер",
    description: "Сильные формулировки под аудиторию",
    to: (id) => `/offer-generator?projectId=${id}`,
  },
  {
    id: "audit",
    label: "Сделать анализ сайта",
    description: "Слабые места и быстрые правки",
    to: (id) => `/audit?projectId=${id}`,
  },
  {
    id: "hero",
    label: "Собрать новый первый экран",
    description: "Hero под цель и трафик",
    to: (id) => `/offer-generator?projectId=${id}&purpose=landing_hero`,
  },
  {
    id: "prototype",
    label: "Создать прототип лендинга",
    description: "19 смысловых блоков",
    to: (id) => `/prototype?projectId=${id}`,
  },
];
