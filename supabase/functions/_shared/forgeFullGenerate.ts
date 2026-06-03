/**
 * Full-landing generation for Forge Lab — uses the same pipeline as generate-prototype.
 */
import type { ForgeKbRow } from "./forgeKbPrompt.ts";
import { buildForgeCompetitorContext, forgeKbToBrief } from "./forgeKbToBrief.ts";
import type { LandingScenario } from "./landingScenarios.ts";
import {
  applyFullUserPromptExtras,
  buildRegenerateFreshBlock,
  resolveFullSystemPrompt,
  type ForgeGenerationPromptConfig,
} from "./forgeGenerationPrompts.ts";
import { generateFullPrototypeContent } from "./prototypeGenerateCore.ts";
import { buildPrototypeUserPrompt } from "./prototypeUserPrompt.ts";
import { normalizeIncludedMiddleBlocks } from "./fullLandingBlocks.ts";

export type ForgeFullGenerateInput = {
  kbSection: string;
  kb: ForgeKbRow;
  projectName: string;
  scenario: LandingScenario | null;
  directionSlug?: string | null;
  scenarioId?: string | null;
  format?: string | null;
  promptsConfig?: ForgeGenerationPromptConfig | null;
  regenerateFresh?: boolean;
  previousContent?: Record<string, unknown> | null;
  variationNote?: string | null;
  includedMiddleBlocks?: string[] | null;
};

export function buildForgeFullUserPrompt(input: ForgeFullGenerateInput): string {
  const brief = forgeKbToBrief(input.kb, {
    projectName: input.projectName,
    scenarioId: input.scenarioId ?? input.scenario?.id,
    format: input.format,
  });
  const competitorMd = buildForgeCompetitorContext(input.kb);

  const base = buildPrototypeUserPrompt(brief, {
    knowledgeBaseBlock: input.kbSection,
    fromKnowledgeBase: true,
    projectName: input.projectName,
    directionSlug: input.directionSlug,
    competitorMd,
    includedMiddleBlocks: input.includedMiddleBlocks ?? undefined,
  });
  const freshBlock = input.regenerateFresh
    ? buildRegenerateFreshBlock(input.previousContent, input.variationNote)
    : "";
  const withFresh = freshBlock ? `${base}\n\n${freshBlock}` : base;
  return applyFullUserPromptExtras(withFresh, input.promptsConfig);
}

export async function generateForgeFullPrototype(
  input: ForgeFullGenerateInput,
): Promise<Record<string, unknown>> {
  const userPrompt = buildForgeFullUserPrompt(input);
  const systemInstruction = resolveFullSystemPrompt(input.promptsConfig);
  const temperature = input.regenerateFresh ? 0.82 : 0.65;
  const includedMiddleBlocks = input.includedMiddleBlocks?.length
    ? normalizeIncludedMiddleBlocks(input.includedMiddleBlocks)
    : undefined;
  return generateFullPrototypeContent(userPrompt, input.scenario, {
    systemInstruction,
    temperature,
    includedMiddleBlocks,
  });
}
