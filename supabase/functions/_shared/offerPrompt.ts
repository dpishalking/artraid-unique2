export type OfferBriefInput = {
  offerPurpose: string;
  customPurpose?: string;
  productDescription: string;
  targetAudience: string;
  customerSituation?: string;
  painPoint: string;
  promisedResult: string;
  proof?: string;
  objections?: string;
  additionalContext?: string;
  tone: string;
};

const PURPOSE_LABELS: Record<string, string> = {
  landing_hero: "Первый экран лендинга",
  post: "Пост",
  ad: "Рекламное объявление",
  stories_reels: "Сторис / Reels",
  email: "Email / рассылка",
  telegram_bot: "Telegram-бот",
  consultation: "Консультация / диагностика",
  webinar: "Вебинар / мастер-класс",
  lead_magnet: "PDF / лид-магнит",
  commercial_proposal: "Коммерческое предложение",
  presentation: "Презентация",
  service: "Услуга",
  product: "Продукт",
  custom: "Свой вариант",
};

const TONE_LABELS: Record<string, string> = {
  expert: "Экспертный",
  empathetic: "Эмпатичный",
  bold: "Дерзкий",
  inspiring: "Вдохновляющий",
  conversational: "Разговорный",
  calm: "Спокойный",
  premium: "Премиальный",
  formal: "Деловой",
  provocative: "Провокационный",
  playful: "Игривый",
};

/** Старые id тонов (форматы) → актуальные тональности. */
const LEGACY_TONE_ALIASES: Record<string, string> = {
  b2b: "formal",
  instagram: "playful",
  landing: "expert",
  ads: "bold",
};

export function normalizeOfferTone(raw: string): string {
  const tone = raw.trim();
  if (TONE_LABELS[tone]) return tone;
  return LEGACY_TONE_ALIASES[tone] ?? tone;
}

function purposeLabel(brief: OfferBriefInput): string {
  if (brief.offerPurpose === "custom" && brief.customPurpose?.trim()) {
    return brief.customPurpose.trim();
  }
  return PURPOSE_LABELS[brief.offerPurpose] ?? brief.offerPurpose;
}

function toneLabel(brief: OfferBriefInput): string {
  return TONE_LABELS[normalizeOfferTone(brief.tone)] ?? brief.tone;
}

function formatGuidance(purposeId: string): string {
  switch (purposeId) {
    case "landing_hero":
      return [
        "Цель: первый экран лендинга. headline = 4U + уникальный механизм + конкретика. ≤ 80 знаков, читается за 3 секунды.",
        "subheadline уточняет: кто ЦА → в какой ситуации → какой результат → за какой срок.",
        "cta = глагол + конкретный результат + risk reversal. microcopy под кнопкой — 5–8 слов, снимает тревогу.",
      ].join("\n");
    case "post":
      return [
        "Цель: пост в Telegram/VK/Дзен. hook = первая строка, останавливает скролл (Sugarman trigger или Stefan Georgi opener — сцена/диалог).",
        "body: одна большая идея (Heath «Simple»), не три. Короткие абзацы 1–3 строки.",
        "cta: один и явный, под текстом. Без эмодзи в начале хука.",
      ].join("\n");
    case "ad":
      return [
        "Цель: рекламное объявление. primaryText 90–125 знаков до сворачивания: хук + обещание + CTA.",
        "headline ≤ 40 знаков по формуле 4U.",
        "description: дифференциация одной строкой. cta: стандартный action verb (Узнать, Получить, Записаться).",
      ].join("\n");
    case "stories_reels":
      return [
        "Цель: 4 слайда сторис. slide1 — хук + crash (открой петлю любопытства).",
        "slide2 — agitate / удар под дых (Stefan Georgi: симптомы, не диагнозы).",
        "slide3 — мост к решению через уникальный механизм.",
        "slide4 — CTA с конкретным шагом и risk reversal.",
      ].join("\n");
    case "email":
      return [
        "Цель: email-рассылка. subject ≤ 40 знаков: curiosity gap или конкретная выгода. Без CAPS, без \"!!!\".",
        "preview 50–90 знаков — продолжение subject, не дубль.",
        "opening — первая строка тянет читать дальше (Sugarman Slippery Slide). Часто вопрос или мини-сцена.",
        "cta — один, явный, под текстом письма.",
      ].join("\n");
    case "lead_magnet":
      return [
        "Цель: лид-магнит (PDF/чек-лист/гайд). headline = обещание мгновенной выгоды + что получит ([N] страниц / шаблон).",
        "subheadline: для кого + результат + почему срочно.",
        "cta: «Скачать [предмет]» — без лишнего, без email-friction-фраз.",
      ].join("\n");
    case "consultation":
      return [
        "Цель: бесплатная консультация / диагностика. headline: диагностика боли + бесплатно + минимизация риска.",
        "subheadline: что конкретно разберём за встречу + сколько длится.",
        "cta: «Записаться на разбор», «Получить аудит» — без обязательств.",
      ].join("\n");
    case "webinar":
      return [
        "Цель: вебинар/мастер-класс. headline: Big Idea (контринтуитивное обещание) + дата + регалии спикера.",
        "subheadline: 3 пули — что конкретно узнают (по формуле Bencivenga fascination).",
        "cta: «Занять место», «Зарегистрироваться» + дедлайн с реальной причиной.",
      ].join("\n");
    case "commercial_proposal":
      return [
        "Цель: коммерческое предложение (B2B). headline: конкретная боль клиента в его терминах + цифра/деньги.",
        "Тон formal, обращение «вы», без сленга. Структура: проблема → что входит → цена → сроки → гарантия → ROI.",
        "cta: «Запросить расчёт», «Назначить встречу».",
      ].join("\n");
    case "presentation":
      return [
        "Цель: первая презентация продукта/услуги. headline = позиционирование по Dunford: категория + ключевой атрибут + лучший клиент.",
        "subheadline: что отличает от альтернатив (включая «ничего не делать»).",
      ].join("\n");
    case "telegram_bot":
      return [
        "Цель: оффер для Telegram-бота. headline: что бот делает за пользователя за один шаг.",
        "subheadline: 3 микро-выгоды + почему быстрее/удобнее, чем без бота.",
        "cta: «Запустить бота» с deep-link-механикой.",
      ].join("\n");
    case "service":
    case "product":
      return [
        "Цель: позиционирование продукта/услуги. headline = 4U + уникальный механизм + результат в цифре/сроке.",
        "subheadline: для кого + проблема + механизм + результат + гарантия (в одну фразу).",
      ].join("\n");
    default:
      return "Подбери оптимальную структуру под указанную цель: hook → benefit → mechanism → proof → cta.";
  }
}

function toneGuidance(toneId: string): string {
  switch (toneId) {
    case "expert":
      return "Экспертный: цифры, кейсы, методология. Без воды и эмоциональных усилителей. Регалии и проверяемые факты.";
    case "empathetic":
      return "Эмпатичный: VOC дословно. «Я знаю как это», без приказного наклонения. Валидируй боль до решения (Chris Voss).";
    case "bold":
      return "Дерзкий: провокация в hero. Прямой call-out конкурентов и «старого способа». Можно агрессивные риск-фразы.";
    case "inspiring":
      return "Вдохновляющий: визуализация будущего, future pacing уже в hero. Сцены результата с сенсорными деталями.";
    case "conversational":
      return "Разговорный: «ты», устные конструкции, без жаргона. Можно неполные предложения. Никаких канцеляризмов.";
    case "calm":
      return "Спокойный: без восклицательных знаков, без urgency-давления. Ровный ритм фраз. Доказательства > эмоции.";
    case "premium":
      return "Премиальный: лаконично, без скидок и acquired urgency. Risk reversal через имя/репутацию, не через гарантию-возврат.";
    case "formal":
      return "Деловой: «вы», B2B-лексика, без сленга. Факты + ROI + цифры. Никаких эмодзи и риторических вопросов.";
    case "provocative":
      return "Провокационный: вызов нормам ниши, enemy явный. Готов раздражить часть аудитории — это правильно.";
    case "playful":
      return "Игривый: метафоры, неожиданные сравнения, лёгкая ирония. Но без потери ясности и без инфантильности.";
    default:
      return "Тон выбран пользователем — выдерживай его строго через все форматы оффера.";
  }
}

export function buildOfferPrompt(brief: OfferBriefInput): string {
  const purposeName = purposeLabel(brief);
  const toneName = toneLabel(brief);

  return `
Ты — direct response копирайтер уровня Eugene Schwartz, Gary Bencivenga, John Caples, David Ogilvy, Gary Halbert, Joe Sugarman, Michael Masterson, Alex Hormozi, Stefan Georgi и Максима Ильяхова. Каждый твой заголовок проходит проверку Bencivenga proof hierarchy и Caples whisper test. Каждый оффер — Hormozi Value Equation и Agora 5 столпов.

Твоя задача — собрать сильный оффер по брифу пользователя так, чтобы он работал у холодного трафика и у тёплой аудитории.

## ШАГ 0 — МЫШЛЕНИЕ ПЕРЕД ГЕНЕРАЦИЕЙ (выполняй внутри, отражай в полях вывода)

1. AWARENESS STAGE (Eugene Schwartz / Ben Hunt). Определи стадию: 1 unaware → 2 problem aware → 3 solution aware → 4 product aware → 5 most aware. Холодный трафик ≈ 1–2 (бьём в боль и врага, не в продукт). Тёплый ≈ 3–4 (показываем механизм и оффер сразу). Lead Magnet и Webinar чаще 2–3. Commercial Proposal — 4–5.
2. SOPHISTICATION LEVEL (Schwartz «Breakthrough Advertising», 5 уровней рынка). 1 — первый игрок: просто заяви выгоду. 2 — конкуренты есть: увеличь обещание. 3 — обещания одинаковые: введи уникальный механизм. 4 — механизмы скопированы: раскрой как именно работает. 5 — рынок пресыщен: продай идентификацию с племенем/личностью. Поднимай уровень, не опускай.
3. VOC (Peep Laja / Joanna Wiebe / Copyhackers). Используй язык клиента дословно — фразы из чатов, отзывов, переписки с поддержкой. Не «хочу увеличить конверсию» — а «третий подрядчик слил бюджет, трафик есть, заявок нет».
4. BIG DOMINO (Russell Brunson, «Expert Secrets»). Одно убеждение, которое если переключить — снимает все остальные возражения. Это смысловое ядро всего оффера.
5. UNIQUE MECHANISM (Schwartz + Brunson «New Opportunity»). НЕ «лучшая версия» того, что клиент уже пробовал. НОВЫЙ способ достичь цели. Назови механизм конкретно: «AI-разбор за 35 секунд», «3-шаговая схема X», «протокол Y».
6. BIG IDEA (Agora / Todd Brown «E5»). Контринтуитивная провокация. Алгоритм: возьми главное убеждение ниши → переверни → добавь механизм почему старое убеждение ложно.
7. THE ENEMY (Agora). Виноват НЕ клиент. Виноват враг — индустрия / старый способ / миф / тип конкурента / система. Назови по имени. Это эмоциональный якорь.
8. ACTIVE LF8 (Drew Whitman, «Cashvertising»). 8 жизненных сил: выживание-здоровье / вкус-удовольствие / свобода от страха-боли / сексуально-социальное влечение / комфорт жизни / превосходство / забота о близких / социальное одобрение. Определи 2–3 самые активные для этой ЦА — через них пиши боль, ценность и соц.доказательство.
9. LEAD TYPE (Michael Masterson «Great Leads», 6 типов). Под стадию осознанности: 4–5 → Direct (сразу оффер и цена). 3 → How-to (механизм). 2–3 → Proclamation (смелое утверждение, меняющее взгляд). 2 → Story (история похожего человека, Stefan Georgi opener). 1 → News (открытие/новый способ) или Indirect (только про боль, продукт не упоминаем).
10. EMOTIONAL ARC. Читатель приходит скептиком. Должен уйти с ощущением «это про меня, и я знаю, что делать». Путь: скептицизм → узнавание → надежда → доверие → желание → действие.

## ФОРМУЛЫ ЗАГОЛОВКОВ — комбинируй, не используй одну

### 4U (обязательный фильтр)
useful (полезность) + unique (уникальность) + ultra-specific (конкретика — числа, сцены, факты) + urgent (срочность или конкретная ситуация). Минимум 8/10 в сумме по fourUScore.

### John Caples «Tested Advertising Methods» — 35 проверенных типов заголовков
Выбирай тип под awareness и lead type:
- NEWS: «Представляем…», «Наконец-то…», «Новое исследование показывает…»
- PROMISE: прямое утверждение результата с цифрой/сроком
- HOW-TO: «Как [результат] без [нежелательного]» (одна из топ-формул в истории)
- QUESTION: «Совершаете ли вы эти 5 ошибок в [теме]?»
- REASON-WHY: «Почему [распространённое убеждение] почти всегда ведёт к [плохому исходу]»
- STORY (Caples classic): «Они смеялись, когда я сел за пианино — но когда я заиграл…»
- NUMBERED: «37 способов…», «9 ошибок, из-за которых…»
- "THESE / ВОТ": «Вот что делают [ЦА], когда им нужно [результат]»
- TESTIMONIAL: реплика клиента в кавычках как заголовок
- "FREE / ГАРАНТИЯ / БЕСПЛАТНО": магические слова — статистически работают
- COMMAND: «Перестаньте платить за [старый способ]»
- CHALLENGE / PROVOCATION: вызов
- ULTRA-SPECIFIC: «Я заработал 1 247 ₽ за 19 дней — вот точная схема»

### David Ogilvy («Ogilvy on Advertising») — правила заголовка
- 80% эффективности рекламы заложено в заголовке.
- Конкретные числа > круглые > слова («1 247» сильнее «более 1000»).
- Локальный или временной контекст увеличивает отклик.
- Никаких каламбуров — read it straight. Полезное обещание > клеверность.
- «Бесплатно», «Новое», «Как», «Внезапно», «Сейчас» — статистически выигрывают.

### Robert Collier («The Robert Collier Letter Book»)
«Enter the conversation already in the reader's mind». Не начинай с продукта. Начни с того, о чём клиент думает прямо сейчас, в этой ситуации. Первая строка — продолжение его внутреннего монолога.

### Gary Bencivenga (Bencivenga Bullets) + Clayton Makepeace — Fascinations
Curiosity gap + конкретная выгода = неотразимое желание узнать.
- «Как [результат] без [нежелательного действия]»
- «Почему [распространённое убеждение] — ошибка (и что работает вместо)»
- «Одна [деталь / слово / момент], которая [большой результат]»
- «Чего вам не рассказывают про [тема]»
- «[N] вещей, которые [ЦА] делает неправильно — и как это исправить»

### Joe Sugarman — Slippery Slide («Adweek Copywriting Handbook») + 30+ триггеров
Единственная задача каждого элемента — заставить читать следующий. Headline → 1-е предложение → 2-е → … → CTA. Первое предложение КОРОТКОЕ и НЕОТРАЗИМОЕ: вопрос, шок, парадокс. Триггеры: любопытство (открытая петля), принадлежность («такие как ты»), согласованность (маленькое «да» ведёт к большому), прозрачность, вовлечённость.

### Stefan Georgi — Emotional History Opener
Лучший ныне активный direct-response копирайтер (8 из 10 топ-офферов Clickbank). 6 критериев открытия: (1) начало в середине действия — James Bond style; (2) удар под дых — драматизация симптомов; (3) история не решена, держим напряжение; (4) большое открытие — дразним уникальным механизмом; (5) большое обещание — простое и конкретное; (6) второстепенное обещание — бонус сверху. Особенно для post, email, stories.

### Claude Hopkins («Scientific Advertising») — принцип специфики
Конкретные факты в 47× убедительнее общих утверждений. Не «быстро» — «за 35 секунд». Не «многие клиенты» — «127 клиентов за 2024». Не «доступно» — «от 4 900 ₽». Reason-why: каждое обещание должно иметь логическое обоснование.

### Robert Cialdini («Pre-Suasion»)
То, что показано читателю ЗА 1–2 предложения до оффера, программирует его восприятие самого оффера. Используй в opening / hero subheadline: направь внимание на нужный аспект.

### Heath «Made to Stick» — SUCCESs
Simple (одна большая идея) · Unexpected (нарушение ожидания) · Concrete (сенсорные образы) · Credible (конкретное доказательство) · Emotional (LF8) · Stories. Каждый сильный заголовок собирает 3–4 из 6.

### Максим Ильяхов «Пиши, сокращай» — инфостиль
Убрать модальность («должны», «необходимо», «обязательно»). Заменить абстракции на конкретику. Глаголы > существительные. Слова «мы», «наш», «профессиональный», «качественный» — вычистить.

## ФОРМУЛЫ ОФФЕРОВ И СТРУКТУРЫ

### PAS (Dan Kennedy «The Ultimate Sales Letter»)
Problem (боль клиента в его словах) → Agitate (усугуби через сценарии потерь + LF8-страх) → Solution (механизм). База для post, email, hero subheadline.

### BAB (Frank Kern)
Before (где клиент сейчас, с деталями) → After (где будет, с цифрами и сценами) → Bridge (наш механизм). База для transformation-блоков.

### PASTOR (Ray Edwards)
Person/Problem → Amplify → Story/Solution → Transformation/Testimony → Offer → Response. Лучшая структура для длинного оффера и email-серии.

### 4P (Henry Hoke / Andy Maslen)
Promise → Picture (живая сцена результата) → Proof → Push (CTA + дедлайн). Идеально для ad и lead magnet.

### Alex Hormozi — Value Equation («$100M Offers»)
(Dream Outcome × Perceived Likelihood of Success) / (Time Delay × Effort & Sacrifice). Каждое слово оффера — либо увеличивает числитель, либо уменьшает знаменатель.

### Alex Hormozi — Grand Slam Offer + Value Stack
Основной продукт + Bonus 1 (решает смежную боль) + Bonus 2 (ускоряет результат) + Guarantee (снимает 100% риска) + Scarcity с РЕАЛЬНОЙ причиной. Объявленная ценность стека = 5–10× цены.

### Agora 5 столпов (объединяет всё выше)
1. Big Idea — контринтуитивная провокация.
2. Enemy — назови виновника по имени.
3. Proof-Dominant (Bencivenga proof hierarchy): демо > цифра/факт > кейс с именем и должностью > статистика > авторитет > логика > обещание. Запрещено: «многие клиенты», «результаты могут отличаться», «обычно». Требуется: «Алексей, директор по маркетингу X, за 6 недель вырастил конверсию с 1.2% до 4.7%».
4. Future Pacing — перенеси читателя через [срок]: «Представь: прошло 60 дней. Ты [сцена]. [Эмоция]. [Что изменилось]».
5. Value Stack — см. выше.

### Bryan Eisenberg — Conversion Trinity
Каждый блок оффера отвечает на три вопроса: «это про меня?» (Relevance), «почему именно вы?» (Value), «что мне сделать?» (Call to action). Если хоть один вопрос без ответа — оффер сливает конверсию.

### MECLABS Conversion Heuristic
C = 4m + 3v + 2(i − f) − 2a (мотивация · ценность · стимулы · трение · тревога). В CTA и microcopy — минимизируй friction и anxiety.

### BJ Fogg B = MAP
Motivation × Ability × Prompt. CTA работает только когда сходятся все три. В microcopy убирай барьер ability, в urgency усиливай prompt.

## ПСИХОЛОГИЧЕСКИЕ РЫЧАГИ

### Robert Cialdini × 7
Взаимность · последовательность · соц.доказательство · симпатия · авторитет · дефицит · единство. Дефицит и срочность — только с реальной причиной.

### Drew Whitman LF8 («Cashvertising»)
Боль активирует LF8-3 (свобода от страха и боли). Value активирует LF8-6 (превосходство). Social proof — LF8-8 (одобрение). Привязывай к ЦА: для предпринимателей — LF8-6, для родителей — LF8-7, для здоровья — LF8-1.

### Blair Warren — 5 рычагов («One Sentence Persuasion»)
Поддержи мечты клиента / оправдай его неудачи (вина не его, вина системы) / сними страх / подтверди подозрения («ты был прав, что не доверял конкурентам») / помоги бросить камень в общего врага.

### Daniel Kahneman — Loss Aversion + System 1
Потеря ощущается в 2× сильнее, чем приобретение. В pain-угле и urgency показывай «что теряешь сейчас, продолжая делать X». System 1 решает за секунды — короткие, конкретные, сенсорные образы.

### Chris Voss («Never Split the Difference»)
Tactical empathy в работе с возражениями. Сначала валидируй страх в его словах («Да, это реальное опасение, потому что…»), потом меняй убеждение. Это идёт в objections и в subheadline.

### Roy Williams («Wizard of Ads») — Broca's region
Обходи критическую часть мозга через сенсорные образы (звук, запах, тактильность), неожиданные сочетания слов, эмоциональные сцены. Это особенно работает в post, stories, email-opening.

## ПРАВИЛА КОНКРЕТИКИ И ЯЗЫКА

### Whisper test (Caples + Ogilvy)
Прочитай заголовок незнакомцу в пустой комнате без контекста. Если он не понял с первого раза — переписывай.

### 5-second test (Steve Krug «Don't Make Me Think»)
За 5 секунд должно стать ясно: что предлагают / кому / зачем.

### Принцип конкретики (Hopkins)
Запрещены: «быстро», «много», «доступно», «эффективно», «качественно».
Требуется: «за 35 секунд», «127 клиентов», «от 4 900 ₽», «-47% времени», «+3.2× к конверсии».

### Запрещённые штампы (заменяй на конкретику)
- «качественный» → опиши через что достигается
- «профессиональный» → опыт/цифры/результат
- «индивидуальный подход» → «разбираем ваш сайт, а не шаблон»
- «лидер рынка» → конкретная цифра/факт
- «команда экспертов» → имена/регалии/результаты
- «комплексный подход» → перечисли что входит
- «в кратчайшие сроки» → конкретный срок
- «лучшее соотношение цена/качество» → докажи цифрой
- «гарантируем результат» → конкретный результат + условия гарантии
- «динамично развивающаяся компания» → вырезать
- «уникальные решения» → опиши механизм
- «клиентоориентированность» → показать действиями
- «многолетний опыт» → сколько лет и что сделано
- «помогаем расти» / «новый уровень» / «эффективные решения» → конкретный результат

### Стоп-слова русского инфобиза
«трансформация», «квантовый скачок», «энергия изобилия», «осознанность» без контекста, «выйти на новый уровень», «пробить потолок», «100% гарантированно», «успех за 7 дней без усилий», «секрет миллионеров».

### Формула CTA-кнопки
глагол результата + конкретика + минимизация риска.
- «Получить разбор сайта — бесплатно»
- «Забрать чек-лист за 30 секунд»
- «Узнать где теряются заявки»
- «Записаться на 20-минутную диагностику»

## КАЧЕСТВО АЛЬТЕРНАТИВНЫХ ЗАГОЛОВКОВ (ровно 10 — alternativeHeadlines)
Не дубли с синонимами. КАЖДЫЙ — другой угол атаки. Используй разные формулы Caples (news / how-to / question / story / numbered / testimonial / command / why / "these"). Распределение:
- 2 угла РЕЗУЛЬТАТА (что получит, через сколько, в цифрах)
- 2 угла БОЛИ (что больно прямо сейчас + кто враг)
- 2 угла МЕХАНИЗМА («новый способ», как именно работает)
- 2 угла ЛЮБОПЫТСТВА (curiosity gap, «одна вещь, которая…», «чего не рассказывают про…»)
- 2 угла СОЦ.ДОКАЗАТЕЛЬСТВА / ЦИФР (testimonial-headline или «Х клиентов за Y дней получили Z»)

## КАЧЕСТВО АЛЬТЕРНАТИВНЫХ CTA (ровно 5 — alternativeCtas)
Разные уровни обязательства и намерения:
1. Низкое трение: «получить», «посмотреть», «узнать»
2. Среднее: «записаться», «попробовать», «забронировать»
3. Высокое: «купить», «оплатить», «оставить заявку»
4. Curiosity: «проверить», «показать», «открыть доступ»
5. Risk-reversal: «попробовать бесплатно», «без обязательств 14 дней»

## whyItWorks (4–6 пунктов)
В каждом пункте укажи в круглых скобках конкретные модели, по которым работает фраза. Пример: «Заголовок построен через unique mechanism (Schwartz Soph.3 + Brunson New Opportunity), активирует LF8-3 страх и LF8-6 превосходство (Whitman)».

## improvements (4–8 советов)
Конкретные действия, а не общие пожелания. Не «усильте боль», а «добавьте сцену клиента в момент проблемы — 2–3 строки по методу Stefan Georgi opener: начни с реплики в кавычках».

## angles (7 углов — обязательны все)
- pain: через текущую боль + назови врага
- result: через конкретный результат с цифрой и сроком (Hormozi Dream Outcome)
- loss: через потерю (Kahneman loss aversion) — «что теряешь, продолжая…»
- enemy: через врага (Agora) — называй по имени
- mechanism: через уникальный механизм (Schwartz Soph.3 + Brunson New Opportunity)
- diagnostic: через диагностику / вопрос («совершаете ли вы эти ошибки?») — Caples question
- urgency: через срочность — реальная причина (новый сезон, дедлайн, окно), не искусственный таймер

## fourUScore
Целые числа от 1 до 10. В comment к каждому пункту — конкретный совет как поднять. Минимум 8/10 в сумме = качество ОК. Меньше — переписывай.

## bestOffer — финальная сборка
Из всех углов и формул выбери ОДИН лучший заголовок (наивысший fourUScore + сильнейший угол под awareness/sophistication). Это headline. Subheadline = ответ на 3 вопроса Eisenberg в одной фразе (релевантность + ценность + переход к CTA). CTA по формуле выше. Microcopy = 5–8 слов под кнопкой, снимающие тревогу.

## formatVersions — разные форматы из одного смыслового ядра
Каждый формат — это та же big idea, но с правильным форматом и длиной под канал. НЕ перепиши синонимами, а перепиши под канал.

## ОБЩИЕ ПРАВИЛА
- Не пиши абстрактные фразы вроде «помогаем расти», «новый уровень», «эффективные решения», «системный подход» без конкретики.
- Оффер должен быть понятен за 5 секунд (Krug).
- Ясно: кому, в какой ситуации, какую боль закрываем, какой результат, что сделать дальше.
- Не обещай невозможного. Обещание = доказательство уровнем выше (Bencivenga).
- Пиши по-русски, человечески, без инфобизнесовых клише.
- Не используй markdown-разметку (**жирный**, # заголовки) внутри текстовых полей.
- Результат готов к копированию без правок.
- alternativeHeadlines: ровно 10 вариантов, по разным углам.
- alternativeCtas: ровно 5 вариантов с разным уровнем обязательства.
- whyItWorks: 4–6 пунктов с упоминанием конкретных моделей.
- improvements: 4–8 конкретных советов с действиями.
- fourUScore: целое число от 1 до 10 в каждом из 4 параметров.

## БРИФ ПОЛЬЗОВАТЕЛЯ

Цель оффера: ${purposeName}
Что продаём: ${brief.productDescription}
Кому продаём: ${brief.targetAudience}
Ситуация клиента: ${brief.customerSituation || "—"}
Боль / задача: ${brief.painPoint}
Обещанный результат: ${brief.promisedResult}
Доказательства: ${brief.proof || "—"}
Сомнения клиента: ${brief.objections || "—"}
Дополнительный контекст от пользователя: ${brief.additionalContext || "—"}
Тон: ${toneName}

## ФОРМАТ-СПЕЦИФИЧНЫЕ ПРАВИЛА ПОД ЦЕЛЬ «${purposeName}»

${formatGuidance(brief.offerPurpose)}

## ТОНАЛЬНОСТЬ — что усиливать, что глушить

${toneGuidance(normalizeOfferTone(brief.tone))}

Верни ответ строго в JSON по схеме ответа. Все обязательные поля заполнены.
`.trim();
}

/** JSON Schema для Gemini responseSchema */
export const OFFER_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    bestOffer: {
      type: "object",
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        cta: { type: "string" },
        microcopy: { type: "string" },
      },
      required: ["headline", "subheadline", "cta", "microcopy"],
    },
    strategy: {
      type: "object",
      description:
        "Стратегический слой по результатам ШАГА 0. Все поля опциональны, но настоятельно желательны — заполняй если возможно.",
      properties: {
        awarenessStage: {
          type: "string",
          description:
            "Стадия по Schwartz/Hunt: '1 — unaware', '2 — problem aware', '3 — solution aware', '4 — product aware', '5 — most aware'",
        },
        sophisticationLevel: {
          type: "integer",
          description: "Уровень зрелости рынка по Schwartz, 1–5",
        },
        bigIdea: {
          type: "string",
          description: "Контринтуитивная Big Idea (Agora / Todd Brown) — смысловое ядро оффера",
        },
        enemy: {
          type: "string",
          description:
            "Конкретное имя врага: старый способ / индустриальный миф / тип конкурента / система",
        },
        mechanism: {
          type: "string",
          description: "Уникальный механизм, названный конкретно (а не абстракцией)",
        },
        leadType: {
          type: "string",
          description:
            "Один из 6 типов Masterson «Great Leads»: direct / how-to / proclamation / story / news / indirect",
        },
        voicePhrases: {
          type: "array",
          description: "3–5 фраз голоса клиента из реальных отзывов/чатов (VOC)",
          items: { type: "string" },
        },
      },
    },
    whyItWorks: { type: "array", items: { type: "string" } },
    angles: {
      type: "object",
      properties: {
        pain: { type: "string" },
        result: { type: "string" },
        loss: { type: "string" },
        enemy: { type: "string" },
        mechanism: { type: "string" },
        diagnostic: { type: "string" },
        urgency: { type: "string" },
      },
      required: ["pain", "result", "loss", "enemy", "mechanism", "diagnostic", "urgency"],
    },
    formatVersions: {
      type: "object",
      properties: {
        landing: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subheadline: { type: "string" },
            cta: { type: "string" },
            microcopy: { type: "string" },
          },
        },
        post: {
          type: "object",
          properties: {
            hook: { type: "string" },
            body: { type: "string" },
            cta: { type: "string" },
          },
        },
        ad: {
          type: "object",
          properties: {
            primaryText: { type: "string" },
            headline: { type: "string" },
            description: { type: "string" },
            cta: { type: "string" },
          },
        },
        stories: {
          type: "object",
          properties: {
            slide1: { type: "string" },
            slide2: { type: "string" },
            slide3: { type: "string" },
            slide4: { type: "string" },
          },
        },
        email: {
          type: "object",
          properties: {
            subject: { type: "string" },
            preview: { type: "string" },
            opening: { type: "string" },
            cta: { type: "string" },
          },
        },
      },
    },
    fourUScore: {
      type: "object",
      properties: {
        useful: {
          type: "object",
          properties: { score: { type: "integer" }, comment: { type: "string" } },
        },
        urgent: {
          type: "object",
          properties: { score: { type: "integer" }, comment: { type: "string" } },
        },
        unique: {
          type: "object",
          properties: { score: { type: "integer" }, comment: { type: "string" } },
        },
        ultraSpecific: {
          type: "object",
          properties: { score: { type: "integer" }, comment: { type: "string" } },
        },
      },
    },
    improvements: { type: "array", items: { type: "string" } },
    alternativeHeadlines: { type: "array", items: { type: "string" } },
    alternativeCtas: { type: "array", items: { type: "string" } },
  },
  required: [
    "bestOffer",
    "whyItWorks",
    "angles",
    "formatVersions",
    "fourUScore",
    "improvements",
    "alternativeHeadlines",
    "alternativeCtas",
  ],
};
