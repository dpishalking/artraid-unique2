import type { OfferPurpose, OfferTone } from "./types";

/** Первичная иерархия: сначала вектор, затем конкретный формат оффера. */
export type OfferPurposeVectorId =
  | "site_pages"
  | "social_chat"
  | "ads_email"
  | "sales_materials";

export const OFFER_PURPOSE_VECTORS: ReadonlyArray<{
  id: OfferPurposeVectorId;
  label: string;
  description: string;
  purposes: readonly OfferPurpose[];
}> = [
  {
    id: "site_pages",
    label: "Сайт и страницы",
    description: "Экран на сайте: первый экран, лид-магнит",
    purposes: ["landing_hero", "lead_magnet"],
  },
  {
    id: "social_chat",
    label: "Соцсети и чаты",
    description: "Лента, короткие ролики, диалог в мессенджере",
    purposes: ["post", "stories_reels", "telegram_bot"],
  },
  {
    id: "ads_email",
    label: "Реклама и письма",
    description: "Кампании с оплатой за охват и email-рассылки",
    purposes: ["ad", "email"],
  },
  {
    id: "sales_materials",
    label: "Продажи и материалы",
    description: "Созвоны, эфиры, КП, слайды, упаковка услуги или продукта",
    purposes: [
      "consultation",
      "webinar",
      "commercial_proposal",
      "presentation",
      "service",
      "product",
    ],
  },
];

const PURPOSE_TO_VECTOR: Record<Exclude<OfferPurpose, "custom">, OfferPurposeVectorId> = {
  landing_hero: "site_pages",
  lead_magnet: "site_pages",
  post: "social_chat",
  stories_reels: "social_chat",
  telegram_bot: "social_chat",
  ad: "ads_email",
  email: "ads_email",
  consultation: "sales_materials",
  webinar: "sales_materials",
  commercial_proposal: "sales_materials",
  presentation: "sales_materials",
  service: "sales_materials",
  product: "sales_materials",
};

export function offerPurposeVector(purpose: OfferPurpose): OfferPurposeVectorId | null {
  if (purpose === "custom") return null;
  return PURPOSE_TO_VECTOR[purpose];
}

export const OFFER_PURPOSE_OPTIONS: {
  id: OfferPurpose;
  label: string;
  description: string;
}[] = [
  { id: "landing_hero", label: "Первый экран лендинга", description: "Заголовок, подзаголовок и CTA above the fold" },
  { id: "post", label: "Пост", description: "Соцсети, Telegram-канал, лента" },
  { id: "ad", label: "Рекламное объявление", description: "Таргет, контекст, лид-формы" },
  { id: "stories_reels", label: "Сторис / Reels", description: "4 слайда с цепочкой внимания" },
  { id: "email", label: "Email / рассылка", description: "Тема, превью, первый экран письма" },
  { id: "telegram_bot", label: "Telegram-бот", description: "Приветствие и первый шаг в воронке" },
  { id: "consultation", label: "Консультация / диагностика", description: "Запись на созвон или разбор" },
  { id: "webinar", label: "Вебинар / мастер-класс", description: "Регистрация на эфир" },
  { id: "lead_magnet", label: "PDF / лид-магнит", description: "Обещание ценности за контакт" },
  { id: "commercial_proposal", label: "Коммерческое предложение", description: "B2B-оффер в документе" },
  { id: "presentation", label: "Презентация", description: "Питч на слайдах" },
  { id: "service", label: "Услуга", description: "Упаковка сервиса" },
  { id: "product", label: "Продукт", description: "Физический или цифровой продукт" },
  { id: "custom", label: "Свой вариант", description: "Укажите формат вручную" },
];

export function offerPurposeOptionsForVector(
  vectorId: OfferPurposeVectorId,
): { id: OfferPurpose; label: string; description: string }[] {
  const ids = new Set(OFFER_PURPOSE_VECTORS.find((v) => v.id === vectorId)?.purposes ?? []);
  return OFFER_PURPOSE_OPTIONS.filter((o) => o.id !== "custom" && ids.has(o.id));
}

export const OFFER_TONE_OPTIONS: { id: OfferTone; label: string; hint: string }[] = [
  { id: "expert", label: "Экспертный", hint: "Чёткие факты, авторитет, без воды" },
  { id: "empathetic", label: "Эмпатичный", hint: "Понимаю вас, говорю от человека к человеку" },
  { id: "bold", label: "Дерзкий", hint: "Провоцирует, бросает вызов, запоминается" },
  { id: "inspiring", label: "Вдохновляющий", hint: "Про возможности, рост и трансформацию" },
  { id: "conversational", label: "Разговорный", hint: "Как будто пишет живой человек другу" },
  { id: "calm", label: "Спокойный", hint: "Без давления, доверительный, уверенный" },
  { id: "premium", label: "Премиальный", hint: "Лаконично, статусно, без суеты" },
  { id: "formal", label: "Деловой", hint: "Официальный стиль для B2B и КП" },
  { id: "provocative", label: "Провокационный", hint: "Шокирует, нарушает ожидания" },
  { id: "playful", label: "Игривый", hint: "Лёгкий, с юмором и энергией" },
];

export const BRIEF_STEPS = [
  {
    key: "productDescription" as const,
    question: "Что вы продаёте?",
    hint: "Опишите продукт, услугу или предложение простыми словами.",
    placeholder:
      "Например: бесплатный разбор сайта, консультация по управлению, курс по AI, аудит рекламы, PDF-гайд, услуга разработки лендинга.",
    required: true,
  },
  {
    key: "targetAudience" as const,
    question: "Кому продаёте?",
    hint: "Кто ваш клиент?",
    placeholder:
      "Например: собственники бизнеса с выручкой от 50 млн ₽, у которых есть сайт, трафик и отдел продаж.",
    required: true,
  },
  {
    key: "customerSituation" as const,
    question: "В какой ситуации находится клиент?",
    hint: "Опишите ситуацию, в которой человеку нужен этот оффер.",
    placeholder:
      "Например: он запускает рекламу, но не понимает, почему сайт не даёт заявок.",
    required: false,
  },
  {
    key: "painPoint" as const,
    question: "Какую боль или задачу закрываем?",
    hint: "Что человека раздражает, пугает или тормозит прямо сейчас?",
    placeholder:
      "Например: рекламный бюджет тратится, заявки дорогие, сайт выглядит нормально, но люди не оставляют форму.",
    required: true,
  },
  {
    key: "promisedResult" as const,
    question: "Какой результат обещаем?",
    hint: "Что человек должен получить после взаимодействия с вами?",
    placeholder:
      "Например: список слабых мест сайта, новый оффер, план правок, больше заявок, ясность, первый шаг.",
    required: true,
  },
  {
    key: "proof" as const,
    question: "Почему клиент должен поверить?",
    hint: "Какие есть доказательства?",
    placeholder:
      "Например: опыт, кейсы, цифры, клиенты, методика, количество разборов, экспертность.",
    required: false,
  },
  {
    key: "objections" as const,
    question: "Какие сомнения есть перед действием?",
    hint: "Что может мешать человеку оставить заявку, купить или написать вам?",
    placeholder:
      "Например: дорого, нет времени, боится продажи, не верит, что это поможет, уже пробовал похожее.",
    required: false,
  },
] as const;

export const LOADING_STEPS = [
  "Анализируем аудиторию",
  "Ищем главную боль",
  "Формулируем big idea",
  "Проверяем по 4U",
  "Собираем готовые варианты",
];
