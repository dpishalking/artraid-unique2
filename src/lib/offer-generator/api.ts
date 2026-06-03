import { supabase } from "@/integrations/supabase/client";
import type { OfferBrief, OfferResult } from "./types";
import { offerSupabaseConfig } from "./supabaseConfig";

export async function generateOffer(
  brief: OfferBrief,
  options?: { projectId?: string },
): Promise<OfferResult> {
  const { url: baseUrl, anonKey } = offerSupabaseConfig();
  if (!baseUrl || !anonKey) {
    throw new Error("Не настроены переменные Supabase для генератора офферов.");
  }
  const url = `${baseUrl}/functions/v1/generate-offer`;
  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? anonKey;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      brief,
      ...(options?.projectId ? { project_id: options.projectId } : {}),
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Не удалось сгенерировать оффер. Попробуйте ещё раз или сократите описание.",
    );
  }
  if (!data?.result) {
    throw new Error("AI не вернул результат. Попробуйте ещё раз.");
  }
  return data.result as OfferResult;
}
