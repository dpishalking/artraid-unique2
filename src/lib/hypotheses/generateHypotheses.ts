import { supabase } from "@/integrations/supabase/client";
import type { Hypothesis, HypothesisStatus } from "./api";
import { saveHypothesisMethodology } from "./api";
import type { HypothesisChannel } from "./methodology";
import { HYPOTHESIS_CHANNELS, getChannelConfig } from "./methodology";

export type GeneratedHypothesisDraft = {
  title: string;
  why: string;
  expectedImpact: string;
  metricName: string;
  testWindow: string;
  guardrail: string;
  priority: "high" | "medium" | "low";
  channel: HypothesisChannel;
};

export async function generateHypothesesFromProblem(input: {
  projectId: string;
  problem: string;
  channel?: HypothesisChannel;
  seedTitle?: string;
}): Promise<GeneratedHypothesisDraft[]> {
  const { data, error } = await supabase.functions.invoke<{ hypotheses?: GeneratedHypothesisDraft[]; error?: string }>(
    "generate-hypotheses",
    {
      body: {
        project_id: input.projectId,
        problem: input.problem,
        channel: input.channel ?? "website",
        seed_title: input.seedTitle,
      },
    },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.hypotheses?.length) throw new Error("AI не вернул гипотезы — попробуйте ещё раз");

  return data.hypotheses.map((h) => ({
    ...h,
    channel: (HYPOTHESIS_CHANNELS.some((c) => c.id === h.channel) ? h.channel : input.channel ?? "website") as HypothesisChannel,
  }));
}

export async function persistGeneratedHypothesis(
  projectId: string,
  draft: GeneratedHypothesisDraft,
  status: HypothesisStatus = "new",
  commercialMetricId?: string,
): Promise<Hypothesis> {
  const channelConfig = getChannelConfig(draft.channel);
  const { data, error } = await supabase
    .from("hypotheses")
    .insert({
      project_id: projectId,
      commercial_metric_id: commercialMetricId ?? null,
      title: draft.title,
      description: draft.why || null,
      expected_impact: draft.expectedImpact || null,
      what_to_change: draft.title,
      why: draft.why || null,
      source_type: "ai_generated",
      status,
      priority: draft.priority,
      type: channelConfig.type,
    })
    .select("*")
    .single();

  if (error) throw error;
  const hypothesis = data as Hypothesis;

  await saveHypothesisMethodology(
    hypothesis.id,
    {
      metricName: draft.metricName,
      testWindow: draft.testWindow,
      source: draft.channel,
      guardrail: draft.guardrail,
    },
    {
      hypothesisType: channelConfig.type,
      sourceType: "ai_generated",
      commercialMetricId,
    },
  );

  return {
    ...hypothesis,
    implementation_difficulty: [
      draft.metricName && `metric:${draft.metricName}`,
      draft.testWindow && `window:${draft.testWindow}`,
      draft.guardrail && `guardrail:${draft.guardrail}`,
      `source:${draft.channel}`,
    ]
      .filter(Boolean)
      .join("|"),
  };
}

export async function persistGeneratedHypotheses(
  projectId: string,
  drafts: GeneratedHypothesisDraft[],
  takeToWork: boolean,
  commercialMetricId?: string,
): Promise<Hypothesis[]> {
  const out: Hypothesis[] = [];
  for (const draft of drafts) {
    const h = await persistGeneratedHypothesis(
      projectId,
      draft,
      takeToWork ? "selected" : "new",
      commercialMetricId,
    );
    out.push(h);
  }
  return out;
}
