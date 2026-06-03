import { supabase } from "@/integrations/supabase/client";
import { resolveAuthEmail } from "@/lib/auth/login";

/** Email или логин → адрес для Supabase Auth. */
export function resolveAuthIdentity(raw: string): string {
  const login = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    return login.toLowerCase();
  }
  return resolveAuthEmail(login);
}

type SignUpResult = Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

/**
 * Регистрация Idea Lab: edge создаёт пользователя без auth-писем, затем вход по паролю.
 */
export async function signUpWithPassword(params: {
  identity: string;
  password: string;
  name?: string;
  redirectNext?: string;
}): Promise<SignUpResult> {
  const email = resolveAuthIdentity(params.identity);
  const { data, error: fnError } = await supabase.functions.invoke("idea-lab-register", {
    body: {
      identity: params.identity.trim(),
      password: params.password,
      name: params.name?.trim() || undefined,
    },
  });

  if (fnError) {
    return { data: { user: null, session: null }, error: fnError };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload?.error) {
    return {
      data: { user: null, session: null },
      error: { message: payload.error, name: "AuthApiError", status: 400 } as SignUpResult["error"],
    };
  }

  return supabase.auth.signInWithPassword({ email, password: params.password });
}

export async function signInWithLoginPassword(params: { identity: string; password: string }) {
  const email = resolveAuthIdentity(params.identity);
  return supabase.auth.signInWithPassword({ email, password: params.password });
}
