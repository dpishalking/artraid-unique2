/**
 * Прогрессивный аудит: блоки следующего разбора.
 * Новые шаги добавляются здесь и подхватываются аудит-хабом по полю id.
 */

import type { LucideIcon } from "lucide-react";
import {
  Layers,
  Lightbulb,
  ShieldAlert,
  UserRound,
  LayoutGrid,
  Sparkles,
  MousePointerClick,
  Hammer,
  LineChart,
  Target,
} from "lucide-react";

export type AuditFocusNextKind =
  | "generate_offer"
  | "prototype_hero"
  | "trust_blocks"
  /** Без перехода в инструмент */
  | "none";

export type AuditFocusSectionId =
  | "offer"
  | "first_screen"
  | "trust_gap"
  | "cta_friction"
  | "structure"
  | "client_lens"
  | "money_map"
  | "quick_wins";

export type AuditFocusSectionMeta = {
  id: AuditFocusSectionId;
  /** Совпадает с подписями в интерфейсе раскрытого блока (для будущего авто-сопоставления) */
  resultFields?: readonly ResultField[];
  title: string;
  shortDescription: string;
  icon: LucideIcon;
  nextAction?: {
    label: string;
    kind: AuditFocusNextKind;
  };
};

export const STANDARD_AUDIT_FOCUS_FIELDS = [
  "currentState",
  "conversionProblem",
  "visitorFeeling",
  "improvement",
  "nextStep",
] as const;

export type ResultField = (typeof STANDARD_AUDIT_FOCUS_FIELDS)[number];

export const AUDIT_FOCUS_SECTIONS: AuditFocusSectionMeta[] = [
  {
    id: "offer",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Разобрать оффер",
    shortDescription:
      "Цепляет ли обещание, правдоподобность и момент действия так, чтобы хотелось ответить «да».",
    icon: Lightbulb,
    nextAction: { label: "Сгенерировать усиленный оффер", kind: "generate_offer" },
  },
  {
    id: "first_screen",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Усилить первый экран",
    shortDescription: "Что человек понимает за первые секунды и успевает решить до скролла.",
    icon: Target,
    nextAction: { label: "Собрать новый первый экран", kind: "prototype_hero" },
  },
  {
    id: "trust_gap",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Найти потери доверия",
    shortDescription:
      "Где сайт торопится или молчит там, где мозгу нужны доказательства и чуть больше ясности.",
    icon: ShieldAlert,
    nextAction: {
      label: "Сгенерировать блоки доверия в прототипе",
      kind: "trust_blocks",
    },
  },
  {
    id: "cta_friction",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Понять, почему посетитель не оставляет заявку",
    shortDescription:
      "Что между «понял ценность» и кликом: страх формы, длина пути, неясный следующий шаг.",
    icon: MousePointerClick,
    nextAction: { label: "Собрать новый первый экран с чёткой кнопкой", kind: "prototype_hero" },
  },
  {
    id: "structure",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Усилить структуру страницы",
    shortDescription: "Порядок блоков: что торчит без контекста и что приходится додумывать.",
    icon: LayoutGrid,
    nextAction: { label: "Собрать новый первый экран", kind: "prototype_hero" },
  },
  {
    id: "client_lens",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Посмотреть сайт глазами клиента",
    shortDescription:
      "Короткие мысли посетителя в самых дорогих по конверсии точках того, что мы уже увидели на сайте.",
    icon: UserRound,
  },
  {
    id: "quick_wins",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Найти быстрые правки на один день",
    shortDescription: "Что даст заметное движение по заявкам без перезапуска всего маркетинга.",
    icon: Hammer,
    nextAction: { label: "Сгенерировать усиленный оффер", kind: "generate_offer" },
  },
  {
    id: "money_map",
    resultFields: STANDARD_AUDIT_FOCUS_FIELDS,
    title: "Показать, где теряются деньги",
    shortDescription: "Этапы воронки внимания: где трафик и интерес утекают до ответа вашему офферу.",
    icon: LineChart,
    nextAction: { label: "Собрать новый первый экран под эту экономику", kind: "prototype_hero" },
  },
];

export const AUDIT_CLOSING_CTAS = [
  {
    id: "tile_generate_offer",
    title: "Сгенерировать улучшенный оффер",
    shortDescription:
      "Забираем уже разложенные по полочкам смыслы в пошаговый конструктор текста оффера.",
    icon: Sparkles,
    nextAction: { label: "Открыть генератор оффера", kind: "generate_offer" as const },
  },
  {
    id: "tile_prototype",
    title: "Собрать новый прототип первого экрана",
    shortDescription:
      "Каркас лендинга: заголовки, блоки доказательств и понятное действие в одном связном скелете.",
    icon: Layers,
    nextAction: { label: "Открыть сборщик прототипа", kind: "prototype_hero" as const },
  },
] as const;
