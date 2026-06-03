import type { MainGoal } from "./types";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";

export type BriefAnswers = Partial<Record<string, string>>;

export type BriefDraft = {
  startedAt: number;
  currentStep: number;
  answers: BriefAnswers;
  projectId?: string;
};

const STORAGE_KEY = "project_brief_draft_v2";

export function loadBriefDraft(): BriefDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BriefDraft;
  } catch {
    return null;
  }
}

export function saveBriefDraft(draft: BriefDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

export function clearBriefDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export type BriefQuestionId =
  | "product_name"
  | "product_description"
  | "product_format"
  | "product_result"
  | "target_audience"
  | "best_customer"
  | "main_pain"
  | "main_desire"
  | "main_goal"
  | "current_offer"
  | "key_promise"
  | "differentiation"
  | "guarantee"
  | "testimonials"
  | "proof_numbers"
  | "price_points"
  | "website"
  | "extra_context";

export type BriefInputType = "text" | "textarea" | "url" | "choice";

export function questionAcceptsAiHints(inputType: BriefInputType): boolean {
  return inputType !== "choice";
}

export type BriefChoice = { value: string; label: string; hint?: string };

export type BriefQuestion = {
  id: BriefQuestionId;
  category: string;
  categoryEmoji: string;
  emoji: string;
  title: string;
  subtitle: string;
  inputType: BriefInputType;
  placeholder: string;
  required: boolean;
  choices?: BriefChoice[];
  celebration: string;
  celebrationDetail: string;
};

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  {
    id: "product_name",
    category: "Продукт",
    categoryEmoji: "📦",
    emoji: "🏷️",
    title: "Как называется ваш продукт или бизнес?",
    subtitle: "Короткое и точное название — как вы его называете сами.",
    inputType: "text",
    placeholder: "Например: «AI-клуб для предпринимателей» или «Студия Реклама360»",
    required: true,
    celebration: "Отличное начало!",
    celebrationDetail: "Имя — это первое, что запоминают. Хороший выбор.",
  },
  {
    id: "product_description",
    category: "Продукт",
    categoryEmoji: "📦",
    emoji: "✍️",
    title: "Что именно вы продаёте?",
    subtitle: "Опишите продукт/услугу как клиенту — 2-4 предложения.",
    inputType: "textarea",
    placeholder: "Например: онлайн-курс из 8 модулей по запуску рекламы в Яндексе для экспертов и консультантов. Включает живые разборы, чат и шаблоны…",
    required: true,
    celebration: "Продукт описан!",
    celebrationDetail: "AI уже видит суть — это будет основой для всех генераций.",
  },
  {
    id: "product_format",
    category: "Продукт",
    categoryEmoji: "📦",
    emoji: "🎯",
    title: "В каком формате?",
    subtitle: "Выберите один или несколько — это влияет на шаблоны прототипов.",
    inputType: "choice",
    placeholder: "",
    required: true,
    choices: [
      { value: "online_course", label: "Онлайн-курс / программа", hint: "Обучение в записи или в прямом эфире" },
      { value: "consulting", label: "Консалтинг / менторство", hint: "Личная работа с клиентом" },
      { value: "service", label: "Услуга / агентство", hint: "Делаете что-то за клиента" },
      { value: "saas", label: "SaaS / продукт", hint: "Программное обеспечение или сервис" },
      { value: "physical", label: "Физический товар", hint: "Производство или дистрибуция" },
      { value: "community", label: "Сообщество / клуб", hint: "Подписка, доступ к комьюнити" },
      { value: "event", label: "Мероприятие / интенсив", hint: "Конференции, воркшопы, форумы" },
    ],
    celebration: "Формат зафиксирован!",
    celebrationDetail: "Теперь прототипы и офферы будут точнее попадать в вашу модель.",
  },
  {
    id: "product_result",
    category: "Продукт",
    categoryEmoji: "📦",
    emoji: "🚀",
    title: "Что конкретно получает клиент в результате?",
    subtitle: "Главный измеримый или ощутимый результат. Не что вы делаете — а что они получают.",
    inputType: "textarea",
    placeholder: "Например: первые 3-5 заявок уже в течение 2 недель, готовая рекламная кампания и понимание, что делать дальше без агентств.",
    required: true,
    celebration: "Это сильно!",
    celebrationDetail: "Конкретный результат — это сердце любого хорошего оффера.",
  },
  {
    id: "target_audience",
    category: "Аудитория",
    categoryEmoji: "👥",
    emoji: "🧭",
    title: "Кто ваш клиент?",
    subtitle: "Сегмент, ситуация, уровень. Чем конкретнее — тем точнее AI-генерации.",
    inputType: "textarea",
    placeholder: "Например: Эксперты и консультанты с 2+ годами опыта, которые сделали $5-20k/мес на личных продажах, но хотят выйти на онлайн-аудиторию…",
    required: true,
    celebration: "Аудитория найдена!",
    celebrationDetail: "Теперь все тексты будут говорить с вашим клиентом.",
  },
  {
    id: "best_customer",
    category: "Аудитория",
    categoryEmoji: "👥",
    emoji: "⭐",
    title: "Опишите вашего лучшего клиента",
    subtitle: "Тот, кто получил максимум и кого вы хотите клонировать. Кто он? Что его отличало?",
    inputType: "textarea",
    placeholder: "Например: Анна, 34 года, психолог. Пришла с 3 клиентами в месяц. Через 2 месяца сделала запуск на 800к. Главное отличие — готовность действовать быстро и доверие к процессу.",
    required: false,
    celebration: "Идеальный клиент описан!",
    celebrationDetail: "Это золото для таргетинга и написания кейсов.",
  },
  {
    id: "main_pain",
    category: "Боли и желания",
    categoryEmoji: "💡",
    emoji: "🔥",
    title: "Главная боль или проблема вашего клиента",
    subtitle: "Что не даёт ему спать? Что он уже пробовал решить и не смог?",
    inputType: "textarea",
    placeholder: "Например: Клиент уже потратил 200к на рекламу и не получил ни одной заявки. Чувствует, что рынок перегрет и не понимает, что делать иначе…",
    required: true,
    celebration: "Боль зафиксирована!",
    celebrationDetail: "Понимание боли — половина продажи. AI будет на неё опираться.",
  },
  {
    id: "main_desire",
    category: "Боли и желания",
    categoryEmoji: "💡",
    emoji: "✨",
    title: "Главная мечта или желание клиента",
    subtitle: "К чему он реально стремится? Не только в контексте продукта — в жизни.",
    inputType: "textarea",
    placeholder: "Например: Хочет работать меньше, зарабатывать стабильно, не зависеть от сарафанного радио. Иметь систему, которая работает без него.",
    required: true,
    celebration: "Мечта клиента записана!",
    celebrationDetail: "Лучший маркетинг — это про желание, а не про продукт.",
  },
  {
    id: "main_goal",
    category: "Стратегия",
    categoryEmoji: "🗺️",
    emoji: "🎯",
    title: "Ваша главная задача прямо сейчас",
    subtitle: "Выберите то, что важнее всего в ближайшие 2-3 месяца.",
    inputType: "choice",
    placeholder: "",
    required: true,
    choices: [
      { value: "increase_conversion", label: "Увеличить конверсию", hint: "Больше покупателей из того же трафика" },
      { value: "new_launch", label: "Запустить новый продукт", hint: "С нуля или перезапуск" },
      { value: "scale_ads", label: "Масштабировать рекламу", hint: "Увеличить бюджет с сохранением ROAS" },
      { value: "improve_offer", label: "Улучшить оффер", hint: "Переупаковать, усилить, переформулировать" },
      { value: "build_funnel", label: "Выстроить воронку", hint: "Автоматизация и последовательность касаний" },
      { value: "enter_market", label: "Выйти на новый рынок", hint: "Новый сегмент, регион или канал" },
      { value: "reduce_churn", label: "Снизить отток / повысить LTV", hint: "Удержание и повторные продажи" },
    ],
    celebration: "Фокус задан!",
    celebrationDetail: "Теперь все рекомендации AI будут направлены на эту цель.",
  },
  {
    id: "current_offer",
    category: "Оффер",
    categoryEmoji: "💬",
    emoji: "📝",
    title: "Ваш текущий оффер",
    subtitle: "Как вы сейчас предлагаете купить? Заголовок сайта, текст в объявлении или фраза продажника.",
    inputType: "textarea",
    placeholder: "Например: «Запустите стабильный поток заявок из интернета за 30 дней или верну деньги» — 3-месячная программа для экспертов.",
    required: false,
    celebration: "Оффер зафиксирован!",
    celebrationDetail: "Теперь AI знает точку старта — и сможет предложить усиление.",
  },
  {
    id: "key_promise",
    category: "Оффер",
    categoryEmoji: "💬",
    emoji: "🤝",
    title: "Ваше ключевое обещание клиенту",
    subtitle: "Самое главное, что вы обещаете. Конкретно и без «воды».",
    inputType: "textarea",
    placeholder: "Например: За 6 недель вы выйдете на первые 3 заявки в день с Яндекс.Директ, даже если раньше никогда не настраивали рекламу.",
    required: true,
    celebration: "Обещание записано!",
    celebrationDetail: "Сильное обещание — это магнит для нужных клиентов.",
  },
  {
    id: "differentiation",
    category: "Оффер",
    categoryEmoji: "💬",
    emoji: "🏆",
    title: "Чем вы отличаетесь от конкурентов?",
    subtitle: "Почему должны выбрать именно вас? Что вы делаете, чего другие не делают?",
    inputType: "textarea",
    placeholder: "Например: Единственный курс, где вы работаете на живом бюджете с первого дня. Личный разбор каждого аккаунта раз в неделю. Закрытое комьюнити бывших учеников.",
    required: true,
    celebration: "УТП зафиксировано!",
    celebrationDetail: "Это основа для позиционирования во всех материалах.",
  },
  {
    id: "guarantee",
    category: "Доверие",
    categoryEmoji: "🛡️",
    emoji: "✅",
    title: "Какую гарантию вы даёте?",
    subtitle: "Гарантия снимает риск клиента. Даже простая — лучше, чем никакой.",
    inputType: "textarea",
    placeholder: "Например: Если за 30 дней не будет ни одной заявки — верну 100% оплаты. Или: индивидуальная работа до результата, сколько бы времени ни потребовалось.",
    required: false,
    celebration: "Гарантия добавлена!",
    celebrationDetail: "Это один из самых мощных конверсионных триггеров.",
  },
  {
    id: "testimonials",
    category: "Доверие",
    categoryEmoji: "🛡️",
    emoji: "💬",
    title: "Ваш лучший кейс или отзыв",
    subtitle: "Конкретная история трансформации. Было → стало. Имя, цифры, эмоция.",
    inputType: "textarea",
    placeholder: "Например: Михаил, владелец стоматологии. Пришёл с 10 пациентами в день. За 3 месяца увеличил до 28. Оборот вырос с 800к до 2.1 млн/мес.",
    required: false,
    celebration: "Кейс золотой!",
    celebrationDetail: "Хорошая история продаёт лучше любого аргумента.",
  },
  {
    id: "proof_numbers",
    category: "Доверие",
    categoryEmoji: "🛡️",
    emoji: "📊",
    title: "Цифры и факты о вашем продукте",
    subtitle: "Всё, что можно измерить: клиенты, результаты, статистика, сертификаты, медиа.",
    inputType: "textarea",
    placeholder: "Например: 847 учеников, средний рост конверсии +156%, упоминание в Forbes, 4.9/5 в отзывах, 12 лет на рынке…",
    required: false,
    celebration: "Цифры внушают доверие!",
    celebrationDetail: "AI будет использовать их в заголовках и буллетах.",
  },
  {
    id: "price_points",
    category: "Экономика",
    categoryEmoji: "💰",
    emoji: "💎",
    title: "Ценообразование",
    subtitle: "Основные цены, пакеты, тарифы. Это нужно для прайс-блоков в прототипах.",
    inputType: "textarea",
    placeholder: "Например: Базовый — 29 000 ₽ (только курс), Стандарт — 49 000 ₽ (курс + кураторство), VIP — 120 000 ₽ (личная работа 3 мес.).",
    required: false,
    celebration: "Цены зафиксированы!",
    celebrationDetail: "Прайс-блоки в прототипах будут с реальными данными.",
  },
  {
    id: "website",
    category: "Онлайн-присутствие",
    categoryEmoji: "🌐",
    emoji: "🔗",
    title: "Ссылка на ваш сайт или лендинг",
    subtitle: "По желанию — сразу подставим в инструмент «Аудит сайта». Можно пропустить.",
    inputType: "url",
    placeholder: "https://example.com",
    required: false,
    celebration: "Сайт привязан!",
    celebrationDetail: "Аудит найдёт слабые места и улучшения — запустите его первым.",
  },
  {
    id: "extra_context",
    category: "Контекст",
    categoryEmoji: "🧠",
    emoji: "📎",
    title: "Что ещё важно знать AI о вашем проекте?",
    subtitle: "Ограничения, особенности рынка, специфика, что нельзя говорить — всё, что не вошло выше.",
    inputType: "textarea",
    placeholder: "Например: Работаем только с B2B, средний цикл сделки 3 месяца. Нельзя упоминать конкурентов по имени. Рынок — СНГ, основная аудитория Казахстан и Россия…",
    required: false,
    celebration: "Контекст добавлен!",
    celebrationDetail: "AI теперь понимает вас на 360°. Память проекта заполнена.",
  },
];

export type BriefMainGoal =
  | "increase_conversion"
  | "new_launch"
  | "scale_ads"
  | "improve_offer"
  | "build_funnel"
  | "enter_market"
  | "reduce_churn";

export function mapBriefAnswersToMemory(
  answers: BriefAnswers,
): Partial<ProjectMemorySections> {
  return {
    product: {
      product_name: answers.product_name,
      product_description: answers.product_description,
      product_format: answers.product_format,
      product_core_result: answers.product_result,
    },
    audience: {
      target_audience: answers.target_audience,
      best_customers: answers.best_customer,
    },
    pains_desires: {
      main_pain: answers.main_pain,
      main_desire: answers.main_desire,
    },
    offer_positioning: {
      current_offer: answers.current_offer,
      key_promise: answers.key_promise,
      differentiation: answers.differentiation,
      guarantee: answers.guarantee,
    },
    proofs: {
      testimonials: answers.testimonials,
      numbers: answers.proof_numbers,
    },
    pricing: {
      price_points: answers.price_points,
    },
    websites: {
      main_website_url: answers.website,
    },
    constraints: {
      important_notes: answers.extra_context,
    },
    business_metrics: {
      business_goal: answers.main_goal,
    },
  };
}
