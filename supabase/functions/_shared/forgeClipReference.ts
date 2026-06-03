/**
 * Эталон clip-4 — структура и промпт для Gemini.
 * Приоритет: загруженные clip-ленды (PDF + URL) из KB → fallback Artraid.
 */
import type { ForgeKbRow } from "./forgeKbPrompt.ts";

export const CLIP4_DESIGN_RULES = `
## ВИЗУАЛЬНЫЙ ЭТАЛОН (рендер на сайте уже под это свёрстан)
- Фон: светлый #F9F9F9, аккуратная сетка.
- Верх: телефон поддержки + «Сейчас читают: N».
- Прогресс: «Шаг X из 4» — жёлтые/тёмные сегменты.
- Hero: вопрос на боль, подзаголовок — узнавание (не «сигнал который нельзя игнорировать»).
- Блок боли: тёмная карточка #12141D, красные маркеры, белый текст, заголовок «Если вам знакомо…».
- CTA: жёлтая кнопка на всю ширину, глагол + результат (→ в тексте label).

## ЗАПРЕЩЕНО в текстах
- Заезженные клише вне темы (например «NASA / космонавты / аэрокосмическая медицина», если этого нет в KB)
- Штампы-страшилки без конкретики («сигнал, который нельзя игнорировать» и подобное) — заменяй на конкретную сцену из жизни ЦА
- Квадратные скобки [...] в видимом тексте
- Выдуманные цифры — только из KB
`;

const CLIP_REF_PATTERN =
  /clip|клип|clartz|clart|спин|spin|прототип|ленд|landing|воронк|otek|отек|отёк|podagra|sustav|sleep|artraid|4\s*экран|экран\s*[1-4]|шаг\s*[1-4]/i;

const ARTRAIDE_CLIP_FUNNEL_FALLBACK = `
## FALLBACK: базовая логика clip-воронки (только если в референсах пользователя не хватает экрана)
1. hook — боль, узнавание, эскалация, CTA «узнать причину».
2. why — миф/старый способ → новый механизм из KB.
3. proof — история + отзывы/факты из KB.
4. apply — гарантия + форма + консультант.
`;

export const ARTRAIDE_CLIP_FUNNEL_STRUCTURE = `
## СМЫСЛОВОЙ ЭТАЛОН МНОГОШАГОВОГО CLIP-ЛЕНДА
Источники наблюдения:
- https://artraide.pro/podagra-clip1 → /podagra-clip2 → /podagra-clip3
- https://artraid-dem.ru/otek_clip → /otek_clip2 → /otek_clip3 → /otek_clip4
- https://artraid-dem.ru/sleep-clip → /sleep-clip2 → /sleep-clip3
- https://artraid-dem.ru/sustav_clip/ → /sustav_clip2/ → /sustav_clip3/ → /sustav_clip4/
Это НЕ текст для копирования. Это логика, которую нужно переносить на другие ниши через KB/VOC.

### Экран 1 — тревога + узнавание + петля старых способов + первый переход
- Шапка доверия: бренд/телефон + "Сейчас читают".
- Большой результатный или тревожный заголовок.
- 2-3 узнаваемые сцены + блок «Знакомо?» с петлёй старых решений.
- Контринтуитивная причина + мягкая эскалация + CTA «Узнать причину».

### Экран 2 — развенчание мифа + механизм
- Миф в кавычках → новый механизм 01→02→03 из KB.
- 3-4 преимущества применения. CTA к доказательствам.

### Экран 3 — история + доказательства + «для кого»
- Главная история клиента + отзывы/факты из KB.

### Экран 4 — гарантия + заявка
- Снятие риска + форма + консультант «онлайн».

### Маппинг в clip-4
hook → why → proof → apply.
`;

export type ClipReferencePrompt = {
  prompt: string;
  hasUserReferences: boolean;
  sourceCount: number;
};

type ClipReferenceSource = {
  title: string;
  excerpt: string;
  kind: "document" | "site";
  note?: string;
  url?: string;
  clipLike: boolean;
};

function isClipLike(...parts: (string | undefined)[]): boolean {
  return parts.some((p) => p && CLIP_REF_PATTERN.test(p));
}

function normalizeExcerpt(text: string, maxLen: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function collectClipReferenceSources(kb: ForgeKbRow): ClipReferenceSource[] {
  const sources: ClipReferenceSource[] = [];

  for (const doc of kb.source_documents ?? []) {
    const clipLike = isClipLike(doc.filename, doc.text.slice(0, 1200));
    sources.push({
      title: doc.filename,
      excerpt: doc.text,
      kind: "document",
      clipLike,
    });
  }

  for (const ref of kb.reference_sites ?? []) {
    const text = ref.meaning_notes ?? ref.scraped_text ?? "";
    if (!text.trim()) continue;
    const clipLike = isClipLike(ref.url, ref.label, ref.note, text.slice(0, 1200));
    sources.push({
      title: ref.label ? `${ref.url} — ${ref.label}` : ref.url,
      excerpt: text,
      kind: "site",
      url: ref.url,
      note: ref.note,
      clipLike,
    });
  }

  const clipLikeSources = sources.filter((s) => s.clipLike);
  const siteSources = sources.filter((s) => s.kind === "site");
  const docSources = sources.filter((s) => s.kind === "document");

  const pool: ClipReferenceSource[] = [];
  for (const list of [clipLikeSources, siteSources, docSources]) {
    for (const item of list) {
      if (pool.length >= 4) break;
      if (!pool.some((p) => p.title === item.title && p.kind === item.kind)) {
        pool.push(item);
      }
    }
  }

  return pool;
}

/** @deprecated используй buildClipReferencePrompt */
export function buildClipReferenceFromDocuments(
  sourceDocuments: Array<{ filename: string; text: string }> | undefined,
): string {
  return buildClipReferencePrompt({ source_documents: sourceDocuments ?? [] } as ForgeKbRow).prompt;
}

export function buildClipReferencePrompt(kb: ForgeKbRow): ClipReferencePrompt {
  const sources = collectClipReferenceSources(kb);
  if (!sources.length) {
    return { prompt: "", hasUserReferences: false, sourceCount: 0 };
  }

  const lines: string[] = [
    "## РЕФЕРЕНСЫ CLIP-ЛЕНДОВ ПОЛЬЗОВАТЕЛЯ (PDF + скачанные clip-страницы)",
    "Это главный источник СМЫСЛОВОЙ структуры. Разбери каждый референс по экранам/шагам.",
    "Для каждого экрана выпиши: hook, боль, петля старых способов, поворот, механизм, история, CTA.",
    "Затем перенеси эту логику на продукт из KB — тексты и факты только из KB, структура — из референсов.",
    "Не копируй чужой бренд дословно, если KB про другой продукт.",
    "",
  ];

  for (const src of sources) {
    const header = src.kind === "site" ? `### Сайт: ${src.title}` : `### Файл: ${src.title}`;
    lines.push(header);
    if (src.note) lines.push(`Зачем смотрим: ${src.note}`);
    lines.push(normalizeExcerpt(src.excerpt, src.clipLike ? 10_000 : 7000));
    lines.push("");
  }

  lines.push(`### Маппинг в наш clip-4 (hook → why → proof → apply)
1. **hook** — возьми структуру экрана 1 из референса: заголовок, узнавание, тёмная карточка симптомов, CTA.
2. **why** — экран 2: миф/старый способ, механизм, почему подход другой.
3. **proof** — экран 3: история, отзывы, «для кого», доказательства.
4. **apply** — последний экран: гарантия, форма, консультант, финальный CTA.
Если в референсе больше 4 экранов — сожми логику, не теряя ключевые смысловые блоки.`);

  return {
    prompt: lines.join("\n"),
    hasUserReferences: true,
    sourceCount: sources.length,
  };
}

export function clip4SystemInstruction(opts?: { hasUserReferences?: boolean }): string {
  const structureBlock = opts?.hasUserReferences
    ? `## ПРИОРИТЕТ СТРУКТУРЫ
1. Сначала разбери блок «РЕФЕРЕНСЫ CLIP-ЛЕНДОВ ПОЛЬЗОВАТЕЛЯ» в user prompt.
2. Смысловая структура каждого из 4 шагов — из этих референсов (экран за экраном).
3. Копирайт, факты, VOC, телефон, гарантии — только из KB продукта.
4. Generic-эталон ниже — только если в референсах не хватает блока для шага.

${ARTRAIDE_CLIP_FUNNEL_FALLBACK}`
    : ARTRAIDE_CLIP_FUNNEL_STRUCTURE;

  return `Ты — арт-директор перформанс-маркетинга. Собираешь клип-лендинг из 4 полноэкранных шагов для холодного трафика (Яндекс.Директ).

## ПРИНЦИП АДАПТИВНОСТИ (главный)
Сначала пойми тему и продукт из KB и собирай клип под них, а не под пример ниже.
- Логика 4 шагов (боль → причина → доказательства → заявка) — каркас, но заголовки, угол, формулировки и CTA подбирай под тему творчески.
- Тексты-образцы и счётчики ниже — ориентир, не дословный шаблон. Не копируй фразы из примеров.
- Жёсткие только две вещи: имена ключей шагов (hook/why/proof/apply) и структура полей JSON. Содержание — гибкое.

${CLIP4_DESIGN_RULES}

${structureBlock}

## ОРИЕНТИР ПО 4 ШАГАМ (каркас — адаптируй формулировки под тему)

### Шаг 1 · key=hook · label=Боль
- hero.headline: цепляющий вход в боль из VOC (обычно вопрос, коротко). Угол выбирай под тему.
- hero.subheadline: 1–2 предложения узнавания, без штампов-запугиваний.
- pain.title: подводка к списку узнаваемых сцен (например «Если вам знакомо хотя бы что-то из этого:» — но можно своя формулировка под тему).
- pain.points: ровно 4 пункта — конкретные бытовые сцены/симптомы из направления.
- pain_escalation (если в конструкторе): headline + body — последствия бездействия, эскалация ставок перед CTA. Не дублируй pain.points.
- old_loop (если в конструкторе): title + items — что уже пробовали и почему не сработало.
- cta.label: из референса или по смыслу шага (например «Узнать причину»), cta.next_step: «why»

### Шаг 2 · key=why · label=Причина
- hero.headline: контринтуитивный поворот (почему привычные действия не решают корень).
- mechanism ИЛИ paradigm_shift: миф («что пробуют») → правда («как на самом деле») → bridge («почему миф не работает»). Поля old_belief/new_belief — не «убеждения», а миф и факт.
- mechanism.body: причина → как продукт работает → несколько бытовых эффектов.
- benefits (если в конструкторе): title + 3–4 items — конкретные выгоды после механизма.
- cta.label: из референса или по смыслу (например «Смотреть доказательства»), next_step: «proof»

### Шаг 3 · key=proof · label=Доказательства
- hero.headline: социальное доказательство, история или «что изменится».
- story (если в конструкторе): headline + body + author + result — главная история клиента из KB.
- social_proof: 2–3 цитаты по теме, с author + role + result (только реальные из KB, не выдумывай).
- metrics: метрики ТОЛЬКО если есть в KB.
- who_for (если в конструкторе): for_items + not_for_items — кому подойдёт.
- cta.label: из референса или по смыслу (например «Хочу так же»), next_step: «apply»

### Шаг 4 · key=apply · label=Заявка
- hero.headline: короткий призыв к действию.
- lead_form_personal: headline, subheadline, persona_name, persona_role, persona_status «Сейчас онлайн», cta, consent_text, fields [name, phone].
- guarantee + micro_trust (несколько пунктов доверия).
- objections (если в конструкторе): 2–3 Q&A — последние страхи перед формой.
- БЕЗ cta.next_step.

## meta
- project_name, target_action, tone_of_voice — обязательны.
- support_phone: из KB или материалов.
- live_readers_hint: число 8–18.

Используй VOC и СДВ из базы знаний. Факты — только из KB.`;
}
