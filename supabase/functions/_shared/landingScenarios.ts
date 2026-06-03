/** Сценарии лендинга для edge functions (синхронизировать с src/config/landingScenarios) */

import { landingScenarios } from "./scenarios.ts";
import type { LandingScenario } from "./scenarioTypes.ts";

export type { LandingScenario } from "./scenarioTypes.ts";
export { landingScenarios };

export function getScenarioById(id: string | undefined | null): LandingScenario | undefined {
  if (!id) return undefined;
  return landingScenarios.find((s) => s.id === id);
}

export function validateScenarioAnswers(
  scenario: LandingScenario,
  answers: Record<string, string>,
): string | null {
  for (const q of scenario.questions) {
    if (!q.required) continue;
    if ((answers[q.id]?.trim() ?? "").length < 2) {
      return "Заполните обязательные поля, чтобы сервис собрал лендинг под выбранный сценарий.";
    }
  }
  return null;
}

export function buildScenarioPromptSection(
  scenario: LandingScenario,
  answers: Record<string, string>,
): string {
  const structureLines = scenario.landingStructure
    .map((b, i) => `${i + 1}. ${b.title} (id: ${b.id}) — ${b.goal}`)
    .join("\n");

  const answerLines = scenario.questions
    .map((q) => {
      const val = answers[q.id]?.trim();
      if (!val) return null;
      return `- ${q.label}: ${val}`;
    })
    .filter(Boolean)
    .join("\n");

  return `## ВЫБРАННЫЙ СЦЕНАРИЙ ЛЕНДИНГА

Название: ${scenario.title}
ID сценария: ${scenario.id}
Цель страницы: ${scenario.goal}
Логика страницы: ${scenario.logic}
Основной CTA: ${scenario.primaryCTA}
Стиль копирайтинга: ${scenario.copywritingStyle}

Структура лендинга (соблюдай порядок и смысл блоков; маппи на ключи JSON-схемы hero, pain, paradigm_shift, solution, product, social_proof, faq, final_cta и др.):
${structureLines}

Ответы пользователя на бриф:
${answerLines || "(нет ответов)"}

Важно:
- Не генерируй универсальный лендинг — только под сценарий «${scenario.title}».
- meta.target_action и CTA в hero/final_cta/micro_copy ведут к: «${scenario.primaryCTA}».
- sequence отражает логику: ${scenario.logic}
- Не добавляй блоки из других сценариев, если они не нужны для этой цели.
- Каждый блок работает на действие: ${scenario.primaryCTA}.`;
}

/** Legacy brief (старые прототипы до сценарного брифа) */
export function isLegacyBrief(brief: Record<string, unknown>): boolean {
  return Boolean(brief.niche && brief.product && !brief.answers);
}
