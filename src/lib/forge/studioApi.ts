import type {
  StudioGenerateParams,
  StudioGenerateResult,
  StudioPortalConfig,
} from "./studioTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function studioInvoke<T>(name: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON}`,
        apikey: SUPABASE_ANON,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.");
  }
  const text = await res.text().catch(() => "");
  let parsed: { error?: string; detail?: string } & T = {} as T & { error?: string };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    parsed = { error: text } as typeof parsed;
  }
  if (!res.ok) {
    throw new Error(parsed.error ?? parsed.detail ?? `Ошибка ${res.status}`);
  }
  return parsed as T;
}

export const studioApi = {
  getConfig(token: string): Promise<StudioPortalConfig> {
    return studioInvoke("forge-studio-config", { token });
  },

  generate(params: StudioGenerateParams): Promise<StudioGenerateResult> {
    return studioInvoke("forge-studio-generate", params);
  },
};
