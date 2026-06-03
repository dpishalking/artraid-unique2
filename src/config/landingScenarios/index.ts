export type {
  BriefQuestion,
  BriefQuestionType,
  LandingBlockStructure,
  LandingScenario,
  ScenarioBriefPayload,
  ScenarioSnapshot,
} from "./types.ts";

export { landingScenarios } from "./scenarios.ts";

import { landingScenarios } from "./scenarios.ts";
import type { LandingScenario, ScenarioSnapshot } from "./types.ts";

export function getScenarioById(id: string | undefined | null): LandingScenario | undefined {
  if (!id) return undefined;
  return landingScenarios.find((s) => s.id === id);
}

export function scenarioToSnapshot(scenario: LandingScenario): ScenarioSnapshot {
  return {
    id: scenario.id,
    title: scenario.title,
    goal: scenario.goal,
    logic: scenario.logic,
    primaryCTA: scenario.primaryCTA,
    landingStructure: scenario.landingStructure,
  };
}

export function validateScenarioAnswers(
  scenario: LandingScenario,
  answers: Record<string, string>,
): string | null {
  for (const q of scenario.questions) {
    if (!q.required) continue;
    const val = answers[q.id]?.trim() ?? "";
    if (val.length < 2) {
      return `Заполните обязательные поля, чтобы сервис собрал лендинг под выбранный сценарий.`;
    }
  }
  return null;
}

export function calcBriefCompleteness(
  scenario: LandingScenario,
  answers: Record<string, string>,
): { score: number; label: string; color: string } {
  const required = scenario.questions.filter((q) => q.required);
  if (required.length === 0) return { score: 100, label: "Максимальный", color: "text-emerald-400" };

  let pts = 0;
  const max = required.length * 10;
  for (const q of required) {
    const len = (answers[q.id]?.trim() ?? "").length;
    if (len >= 2) pts += 6;
    if (len >= 50) pts += 2;
    if (len >= 120) pts += 2;
  }

  const score = Math.round((pts / max) * 100);
  let label = "Базовый";
  let color = "text-muted-foreground";
  if (score >= 85) {
    label = "Максимальный";
    color = "text-emerald-400";
  } else if (score >= 65) {
    label = "Высокий";
    color = "text-money";
  } else if (score >= 40) {
    label = "Хороший";
    color = "text-yellow-400";
  }
  return { score, label, color };
}

export function briefDisplayTitle(brief: Record<string, unknown> | null | undefined): string {
  if (!brief) return "Прототип";
  const answers = brief.answers as Record<string, string> | undefined;
  if (answers) {
    return (
      answers.product ||
      answers.eventTitle ||
      answers.hypothesis ||
      answers.consultationType ||
      "Прототип"
    );
  }
  return (brief.product as string) || (brief.niche as string) || "Прототип";
}
