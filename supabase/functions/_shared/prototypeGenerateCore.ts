/**
 * Shared Gemini call for full 18-block + micro_copy prototype (emit_prototype).
 */
import { geminiForcedFunctionCall, geminiProModel } from "./gemini.ts";
import type { LandingScenario } from "./landingScenarios.ts";
import { PROTOTYPE_SCHEMA, PROTOTYPE_SYSTEM_PROMPT } from "./prototypeGenerationCore.ts";
import {
  buildPrototypeSchemaForBlocks,
  normalizeIncludedMiddleBlocks,
  type FullLandingMiddleBlockKey,
} from "./fullLandingBlocks.ts";

export async function generateFullPrototypeContent(
  userPrompt: string,
  scenario: LandingScenario | null | undefined,
  opts?: {
    systemInstruction?: string;
    temperature?: number;
    includedMiddleBlocks?: FullLandingMiddleBlockKey[];
  },
): Promise<Record<string, unknown>> {
  const modelName = geminiProModel();
  const systemInstruction = opts?.systemInstruction ?? PROTOTYPE_SYSTEM_PROMPT;
  const temperature = opts?.temperature ?? 0.65;
  const middleBlocks = opts?.includedMiddleBlocks?.length
    ? normalizeIncludedMiddleBlocks(opts.includedMiddleBlocks)
    : null;
  const parameters = middleBlocks
    ? buildPrototypeSchemaForBlocks(middleBlocks)
    : (PROTOTYPE_SCHEMA as unknown as Record<string, unknown>);

  const callAI = () =>
    geminiForcedFunctionCall({
      model: modelName,
      systemInstruction,
      userParts: [{ text: userPrompt }],
      functionName: "emit_prototype",
      functionDescription: "Возвращает готовый смысловой прототип лендинга",
      parameters: parameters,
      temperature,
      maxOutputTokens: 65536,
    });

  let content: Record<string, unknown>;
  try {
    const r1 = await callAI();
    content = r1.args as Record<string, unknown>;
  } catch (e1) {
    console.warn("emit_prototype attempt 1 failed, retrying…", e1);
    await new Promise((r) => setTimeout(r, 2000));
    const r2 = await callAI();
    content = r2.args as Record<string, unknown>;
  }

  if (scenario && content?.meta && typeof content.meta === "object") {
    (content.meta as Record<string, unknown>).scenario = {
      id: scenario.id,
      title: scenario.title,
      goal: scenario.goal,
      logic: scenario.logic,
      primaryCTA: scenario.primaryCTA,
      landingStructure: scenario.landingStructure,
    };
  }

  return content;
}
