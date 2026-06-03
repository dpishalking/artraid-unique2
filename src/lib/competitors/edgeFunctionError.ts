import { FunctionsHttpError } from "@supabase/supabase-js";

/** Достаёт человекочитаемый текст из ошибки edge function (вместо «non-2xx»). */
export async function edgeFunctionErrorMessage(
  error: unknown,
  data: unknown,
  fallback = "Запрос не удался",
): Promise<string> {
  if (data && typeof data === "object" && "error" in data) {
    const msg = String((data as { error: unknown }).error ?? "").trim();
    if (msg) return msg;
  }

  if (error instanceof FunctionsHttpError) {
    try {
      const ctx = error.context as Response | undefined;
      if (ctx && typeof ctx.json === "function") {
        const body = (await ctx.json()) as { error?: string };
        if (body?.error) return body.error;
      }
    } catch {
      /* ignore */
    }
    if (error.message && !/non-2xx/i.test(error.message)) return error.message;
  }

  if (error instanceof Error && error.message && !/non-2xx/i.test(error.message)) {
    return error.message;
  }

  return fallback;
}
