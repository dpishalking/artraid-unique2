import { supabase } from "@/integrations/supabase/client";
import { saveProjectMemorySection } from "@/lib/projectMemory/api";
import type { IdeaLabCard, IdeaLabState } from "./types";

/** Перенос выводов Idea Lab в проект и память. */
export async function syncIdeaLabToProject(
  projectId: string,
  card: IdeaLabCard,
  state?: IdeaLabState,
): Promise<void> {
  const name = card.idea_name?.trim() || "Проект с нуля";
  const product = card.short_description?.trim() || card.idea_name?.trim() || "";
  const audience = card.target_audience?.trim() || "";
  const offer = card.primary_offer?.trim() || "";

  await supabase
    .from("projects")
    .update({
      name,
      product_description: product || "Уточняется в Idea Lab",
      target_audience: audience || "Уточняется в Idea Lab",
      current_offer: offer || null,
      updated_at: new Date().toISOString(),
      ...(state
        ? {
            idea_lab_state: {
              ...state,
              completedAt: state.completedAt ?? new Date().toISOString(),
            },
          }
        : {}),
    })
    .eq("id", projectId);

  if (product) {
    await saveProjectMemorySection(projectId, "product", {
      product_description: product,
      product_name: name,
    });
  }
  if (audience) {
    await saveProjectMemorySection(projectId, "audience", { target_audience: audience });
  }
  if (card.main_problem) {
    await saveProjectMemorySection(projectId, "pains_desires", {
      main_pain: card.main_problem,
      main_desire: card.desired_outcome,
    });
  }
  if (offer) {
    await saveProjectMemorySection(projectId, "offer_positioning", {
      current_offer: offer,
      key_promise: card.desired_outcome,
    });
  }

  await supabase.from("project_events").insert({
    project_id: projectId,
    event_type: "idea_lab_completed",
    title: "Проект с нуля: концепция собрана",
    metadata: { clarity: state?.clarityPercent },
  });
}
