import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  // IPv4 literal
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [parseInt(m[1]), parseInt(m[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type CheckResult =
  | { ok: true; original_url: string; final_url: string; status: number }
  | { ok: false; code: "invalid_url" | "unreachable"; message: string };

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function checkUrl(rawUrl: string): Promise<CheckResult> {
  const original = normalizeUrl(rawUrl);
  let parsed: URL;
  try {
    parsed = new URL(original);
  } catch {
    return { ok: false, code: "invalid_url", message: "Некорректный URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, code: "invalid_url", message: "Допустимы только http и https" };
  }
  if (!parsed.hostname || !parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
    return { ok: false, code: "invalid_url", message: "Некорректный домен" };
  }
  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, code: "invalid_url", message: "Внутренние адреса недоступны" };
  }

  let currentUrl = parsed.toString();
  let redirects = 0;

  try {
    while (true) {
      let resp: Response;
      try {
        resp = await fetchWithTimeout(currentUrl, {
          method: "GET",
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0)",
            Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          },
        });
      } catch (e) {
        const msg = (e as Error)?.message || String(e);
        return { ok: false, code: "unreachable", message: msg };
      }

      const status = resp.status;
      // Manual redirect handling
      if (status >= 300 && status < 400) {
        const loc = resp.headers.get("location");
        if (!loc) {
          return { ok: true, original_url: original, final_url: currentUrl, status };
        }
        if (redirects >= MAX_REDIRECTS) {
          return { ok: false, code: "unreachable", message: "Слишком много редиректов" };
        }
        try {
          currentUrl = new URL(loc, currentUrl).toString();
        } catch {
          return { ok: false, code: "unreachable", message: "Некорректный редирект" };
        }
        const nextHost = new URL(currentUrl).hostname;
        if (isPrivateHost(nextHost)) {
          return { ok: false, code: "unreachable", message: "Редирект на внутренний адрес" };
        }
        redirects++;
        continue;
      }

      if (status >= 200 && status < 400) {
        return { ok: true, original_url: original, final_url: currentUrl, status };
      }
      return { ok: false, code: "unreachable", message: `HTTP ${status}` };
    }
  } catch (e) {
    return { ok: false, code: "unreachable", message: (e as Error)?.message || "Ошибка" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== "string" || !url.trim()) {
      return new Response(
        JSON.stringify({ ok: false, code: "invalid_url", message: "URL обязателен" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const result = await checkUrl(url);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, code: "unreachable", message: (e as Error)?.message || "Ошибка" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});