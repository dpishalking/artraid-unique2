/**
 * Регистрация Idea Lab по логину/паролю без отправки auth-писем (обход email rate limit).
 * verify_jwt = false — публичный endpoint только для sign-up.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveLogin(raw: string): { login: string; email: string } {
  const login = raw.trim();
  if (!login) throw new Error("Укажите логин или email");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    return { login, email: login.toLowerCase() };
  }

  const safe = login
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe) throw new Error("Недопустимый логин");

  return { login: safe, email: `${safe}@login.local` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const identity = String(body.identity ?? "").trim();
    const password = String(body.password ?? "");
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!identity) return json({ error: "Укажите логин или email" }, 400);
    if (password.length < 8) return json({ error: "Пароль минимум 8 символов" }, 400);
    if (password.length > 72) return json({ error: "Пароль слишком длинный" }, 400);

    const { login, email } = resolveLogin(identity);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Server not configured" }, 500);

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || undefined,
        login,
        source: "idea_lab_register",
      },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message ?? "Не удалось создать аккаунт";
      if (/already registered|already exists|duplicate/i.test(msg)) {
        return json({ error: "Такой логин или email уже занят — войдите" }, 409);
      }
      return json({ error: msg }, 400);
    }

    const userId = created.user.id;

    await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          email,
          display_name: name || login,
          source: "idea_lab_register",
        },
        { onConflict: "user_id" },
      )
      .then(() => null)
      .catch(() => null);

    return json({ ok: true, email, login });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "register_failed" }, 500);
  }
});
