/**
 * User prompt builder for full 18-block + micro_copy prototype generation.
 * Shared by generate-prototype and forge-generate-prototype (Lab).
 */
import { buildScenarioPromptSection, getScenarioById } from "./landingScenarios.ts";
import { ARTRAID_HEALTH_FULL_LANDING_STRUCTURE } from "./fullLandingReference.ts";
import {
  buildBlockConstructorPromptSection,
  normalizeIncludedMiddleBlocks,
  type FullLandingMiddleBlockKey,
} from "./fullLandingBlocks.ts";

export type PrototypeBrief = {
  scenario_id?: string;
  answers?: Record<string, string>;
  competitor_url?: string;
  own_site_url?: string;
  niche?: string;
  product?: string;
  audience?: string;
  offer?: string;
  price?: string;
  guarantee?: string;
  mechanism?: string;
  bigidea?: string;
  traffic?: string;
  enemy?: string;
  format?: string;
};

export type BuildPrototypeUserPromptOptions = {
  competitorMd?: string;
  ownMd?: string;
  projectContextBlock?: string;
  /** Forge Lab: KB-секция — главный источник фактов */
  knowledgeBaseBlock?: string;
  projectName?: string;
  directionSlug?: string | null;
  /** Если true — не дублируем legacy-бриф (факты уже в KB) */
  fromKnowledgeBase?: boolean;
  /** Конструктор: только эти средние блоки (hero/final_cta/micro_copy добавляются автоматически) */
  includedMiddleBlocks?: string[];
};

export async function fetchSiteContext(
  url: string,
  firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY"),
): Promise<string> {
  if (!firecrawlKey) return "";
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    const d = await r.json();
    const md: string = d?.data?.markdown || "";
    return md.slice(0, 4000);
  } catch {
    return "";
  }
}

function appendFullPrototypeTaskInstructions(
  parts: string[],
  projectName?: string,
  includedMiddleBlocks?: FullLandingMiddleBlockKey[],
) {
  if (projectName) {
    parts.push(`meta.project_name = «${projectName}».`);
  }
  if (includedMiddleBlocks?.length) {
    parts.push(buildBlockConstructorPromptSection(includedMiddleBlocks));
  } else {
    parts.push(ARTRAID_HEALTH_FULL_LANDING_STRUCTURE);
    parts.push(
      `Это ОДИН из примеров смысловой дуги (expert-lecture → mechanism → proof → application), а не обязательный шаблон. Если тема, продукт или сценарий лучше раскрываются другой логикой — выстраивай дугу под них и отрази её в meta.sequence. Главное — продать именно этот оффер, а не повторить пример.`,
    );
  }
  parts.push(`Сначала выполни ШАГ 0 (мышление): определи стадию осознанности, выпиши голос клиента, сформулируй уникальный механизм и эмоциональную дугу.`);
  parts.push(`Затем собери полный смысловой прототип лендинга по схеме:`);
  if (includedMiddleBlocks?.length) {
    parts.push(`- Только выбранные блоки конструктора — раскрой каждый глубоко под тему и KB`);
  } else {
    parts.push(
      `- Блоки схемы: hero, paradigm_shift, pain, enemy_section, solution, transformation, value, product, process, founder, comparison, social_proof, not_for, objections, faq, future_pacing, guarantee, final_cta, micro_copy. Заполни их под тему: релевантные раскрой глубоко, слабо релевантные оставь короткими и честными (не выдумывай факты ради объёма)`,
    );
  }
  parts.push(`- В hero: 3 варианта заголовка (результат / боль / механизм)`);
  parts.push(`- В каждом блоке note для дизайнера с указанием моделей`);
  parts.push(`- В objections: основные возражения по частоте (если блок выбран)`);
  parts.push(`- В social_proof: кейсы из KB (если блок выбран)`);
  parts.push(`- Без воды, штампов, общих слов. Каждое слово либо снижает трение, либо усиливает желание.`);
  parts.push(`- НЕ используй markdown-разметку (**жирный**, *курсив*, # заголовки) внутри текстовых полей. Только чистый текст.`);
  parts.push(`- sequence[0] ОБЯЗАН быть "hero", sequence[последний] ОБЯЗАН быть "final_cta".`);
  parts.push(
    `- В полях transition_hook каждого блока напиши одно цепляющее предложение — оно будет последним на этом экране и должно тянуть читать дальше (принцип Slippery Slide Sugarman).`,
  );
}

export function buildPrototypeUserPrompt(
  brief: PrototypeBrief,
  options: BuildPrototypeUserPromptOptions = {},
): string {
  const competitorMd = options.competitorMd ?? "";
  const ownMd = options.ownMd ?? "";
  const projectContextBlock = options.projectContextBlock ?? "";
  const knowledgeBaseBlock = options.knowledgeBaseBlock ?? "";
  const fromKb = options.fromKnowledgeBase === true;
  const includedMiddleBlocks = options.includedMiddleBlocks?.length
    ? normalizeIncludedMiddleBlocks(options.includedMiddleBlocks)
    : undefined;
  const parts: string[] = [];

  if (knowledgeBaseBlock.trim()) {
    parts.push(knowledgeBaseBlock.trim());
    parts.push("");
    parts.push("ВАЖНО: база знаний выше — единственный источник фактов о продукте. Не выдумывай характеристики.");
    if (options.directionSlug) {
      parts.push(
        "Строго придерживайся выбранного направления из базы — не подмешивай боли других тем.",
      );
    }
    parts.push("");
  }

  if (projectContextBlock.trim()) {
    parts.push(projectContextBlock.trim());
    parts.push("");
  }

  const scenario = getScenarioById(brief.scenario_id);
  if (scenario && brief.answers && Object.values(brief.answers).some((v) => v?.trim())) {
    parts.push(buildScenarioPromptSection(scenario, brief.answers));
    parts.push(`\n## ЗАДАЧА`);
    parts.push(`Собери полный смысловой прототип лендинга строго под сценарий «${scenario.title}».`);
    if (includedMiddleBlocks?.length) {
      parts.push(`Структура landingStructure сценария — ориентир смыслов, но meta.sequence = только блоки конструктора (см. ниже).`);
    } else {
      parts.push(`Используй структуру landingStructure сценария — отрази её в meta.sequence и наполнении блоков.`);
      parts.push(`Все 18 ключей blocks в схеме заполни, но акценты и порядок — под этот сценарий.`);
    }
    parts.push(`sequence[0] = "hero", sequence[последний] = "final_cta".`);
    parts.push(`Не используй markdown в текстовых полях.`);
    appendFullPrototypeTaskInstructions(parts, options.projectName, includedMiddleBlocks);
    if (competitorMd) parts.push(`\n## АНАЛИЗ КОНКУРЕНТА\n${competitorMd}`);
    if (ownMd) parts.push(`\n## ТЕКУЩИЙ САЙТ КЛИЕНТА\n${ownMd}`);
    return parts.join("\n");
  }

  if (scenario) {
    parts.push(buildScenarioPromptSection(scenario, brief.answers ?? {}));
    parts.push("");
  }

  if (fromKb) {
    parts.push(`## СТРУКТУРИРОВАННЫЕ АКЦЕНТЫ (из базы знаний)`);
    if (brief.guarantee?.trim()) {
      parts.push(`- Гарантия: ${brief.guarantee}`);
      parts.push(`  → Используй дословно в блоке "guarantee".`);
    }
    if (brief.mechanism?.trim()) {
      parts.push(`- Уникальный механизм: ${brief.mechanism}`);
      parts.push(`  → Основа блока "solution" и угол [2] hero.headline_variants.`);
    }
    if (brief.bigidea?.trim()) {
      parts.push(`- BIG Idea: ${brief.bigidea}`);
      parts.push(`  → Смысловое ядро: hero, paradigm_shift, pain intro.`);
    }
    if (brief.enemy?.trim()) {
      parts.push(`- Враг: ${brief.enemy}`);
      parts.push(`  → enemy_section, pain, comparison.`);
    }
    if (brief.traffic?.trim()) {
      parts.push(`- Трафик / осведомлённость: ${brief.traffic}`);
    }
    if (brief.format?.trim()) {
      parts.push(`- Формат лендинга: ${brief.format}`);
    }
    parts.push("");
  } else {
    parts.push(`## БРИФ КЛИЕНТА`);
    parts.push(`- Ниша: ${brief.niche}`);
    parts.push(`- Продукт / услуга: ${brief.product}`);
    parts.push(`- Целевая аудитория: ${brief.audience}`);
    parts.push(`- Оффер (обещание результата): ${brief.offer}`);
    parts.push(`- Цена: ${brief.price}`);
    if (brief.guarantee?.trim()) {
      parts.push(`- Гарантия: ${brief.guarantee}`);
      parts.push(`  → Используй это дословно в блоке "guarantee".`);
    }
    if (brief.mechanism?.trim()) {
      parts.push(`- Уникальный механизм/метод: ${brief.mechanism}`);
      parts.push(`  → Используй как ОСНОВУ блока "solution" и угол [2] hero.headline_variants.`);
    }
    if (brief.bigidea?.trim()) {
      parts.push(`- BIG Idea: ${brief.bigidea}`);
    }
    if (brief.enemy?.trim()) {
      parts.push(`- Враг / главный злодей: ${brief.enemy}`);
    }
    if (brief.traffic?.trim()) {
      parts.push(`- Источник трафика: ${brief.traffic}`);
    }
    if (brief.format?.trim()) {
      parts.push(`- Желаемый формат/стиль: ${brief.format}`);
    }
  }

  if (brief.format?.trim()) {
    const KITCHEN_VOICE = [
      `ФОРМАТ: Разговор на кухне (Стефан Джорджи + Robert Collier). Весь лендинг — будто один живой человек рассказывает историю читателю за чашкой чая, а не корпоративный сайт.`,
      `- Один рассказчик от первого лица ("я", "мы с мужем", "соседка показала"). Держи его до конца, не сбивайся на безличное "большинство людей думает".`,
      `- hero.story_opening ОБЯЗАТЕЛЕН: начни с конкретной живой сцены из быта (вечер, снимаешь носок, след от резинки), а не с вопроса-заголовка и не с "меня зовут".`,
      `- Тон тёплый, простой, как письмо близкому. Короткие фразы. Прямая речь. Никакого канцелярита и продающих штампов.`,
      `- pain — через сцену и узнавание ("знакомо? любимые туфли к обеду начинают резать"), НЕ списком симптомов.`,
      `- founder идёт рано — читатель должен полюбить человека до того, как увидит цену.`,
      `- objections оформляй как живые сомнения в кавычках ("да это очередная разводка из телемагазина"), потом спокойный честный ответ.`,
    ].join("\n");
    const formatDescriptions: Record<string, string> = {
      story: KITCHEN_VOICE,
      storytelling: KITCHEN_VOICE,
      kitchen: KITCHEN_VOICE,
      agora: `ФОРМАТ: Agora Method. Акцент на enemy_section и paradigm_shift, но без лобовых формул — через сцену.`,
      classic: `ФОРМАТ: Классический лендинг. Ясность, цифры, доверие. Но живым языком, без штампов.`,
      longread: `ФОРМАТ: Лонгрид. Расширенные блоки: pain 7-10 пунктов, objections 7+, social_proof 5+.`,
    };
    const desc = formatDescriptions[brief.format] ?? `ФОРМАТ: ${brief.format}`;
    parts.push(`  → ${desc}`);
  }

  if (competitorMd) {
    parts.push(`\n## АНАЛИЗ КОНКУРЕНТА / РЕФЕРЕНСЫ`);
    parts.push(`Вычлени слабые места конкурентов. НЕ копируй формулировки. Дифференцируй наш продукт.`);
    parts.push(`\n${competitorMd}`);
  }

  if (ownMd) {
    parts.push(`\n## ТЕКУЩИЙ САЙТ КЛИЕНТА (${brief.own_site_url})`);
    parts.push(`Используй реальные формулировки и факты дословно где уместно.`);
    parts.push(`\n${ownMd}`);
  }

  parts.push(`\n## ЗАДАЧА`);
  if (scenario) {
    parts.push(`Собери полный смысловой прототип лендинга строго под сценарий «${scenario.title}».`);
    parts.push(`meta.target_action = «${scenario.primaryCTA}» или близкая формулировка.`);
    if (includedMiddleBlocks?.length) {
      parts.push(`landingStructure сценария — ориентир смыслов; порядок секций — только блоки конструктора.`);
    } else {
      parts.push(`Используй landingStructure сценария в meta.sequence.`);
    }
  } else if (fromKb) {
    parts.push(`Собери полный смысловой прототип лендинга на основе базы знаний.`);
  }
  appendFullPrototypeTaskInstructions(parts, options.projectName, includedMiddleBlocks);

  return parts.join("\n");
}
