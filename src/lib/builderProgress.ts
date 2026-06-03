import type { LandingScenario } from "@/config/landingScenarios";

export function getActiveStructureIndex(
  scenario: LandingScenario,
  questionIndex: number,
  questionCount: number,
  isFinalStep: boolean,
): number {
  const blocks = scenario.landingStructure;
  if (blocks.length === 0) return 0;
  if (isFinalStep) return blocks.length - 1;
  if (questionIndex < 0 || questionCount <= 0) return 0;
  const ratio = (questionIndex + 1) / questionCount;
  return Math.min(Math.floor(ratio * blocks.length), blocks.length - 1);
}

export function getFilledStructureCount(
  scenario: LandingScenario,
  answers: Record<string, string>,
): number {
  const answered = scenario.questions.filter((q) => (answers[q.id]?.trim().length ?? 0) >= 2).length;
  const total = scenario.questions.length;
  if (total === 0) return 0;
  return Math.round((answered / total) * scenario.landingStructure.length);
}
