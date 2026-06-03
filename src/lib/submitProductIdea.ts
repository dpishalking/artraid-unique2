import { supabase } from "@/integrations/supabase/client";

export async function submitProductIdea(payload: {
  message: string;
  email?: string;
  page_path?: string;
  source?: string;
}): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error("Supabase не настроен");
  }

  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? anonKey;

  const resp = await fetch(`${baseUrl}/functions/v1/submit-product-idea`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Не удалось отправить");
  }
}
