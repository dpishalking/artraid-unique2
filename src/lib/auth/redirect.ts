import {
  getCurrentSiteOrigin,
  isIdeaLabHost,
  LEGACY_SITE_HOST,
  PRIMARY_SITE_HOST,
  SITE_ORIGIN,
} from "@/constants/site";
import { ideaLabDashboardPath } from "@/lib/ideaLab/constants";
import { CABINET_PATH, MARKETING_SITE_PATH } from "@/lib/navigation/flowExit";

function isMarketingLandingPath(pathname: string, search: string): boolean {
  if (pathname === MARKETING_SITE_PATH) return true;
  return new URLSearchParams(search).get("public") === "1";
}

const AUTH_ORIGIN_KEY = "mm_auth_origin";
const AUTH_NEXT_KEY = "mm_auth_next";
const RETURN_ORIGIN_PARAM = "return_origin";
const NEXT_PARAM = "next";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isAllowedAuthOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.replace(/^www\./, "");
    return (
      host === PRIMARY_SITE_HOST ||
      host === "ideas.pishalking.ru" ||
      host === "ideas.localhost" ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function resolveAuthOrigin(): string {
  if (typeof window !== "undefined" && isIdeaLabHost()) {
    return getCurrentSiteOrigin();
  }
  return SITE_ORIGIN;
}

export function defaultAuthNextPath(): string {
  return isIdeaLabHost() ? ideaLabDashboardPath() : CABINET_PATH;
}

/** Любой визит на pishalking.biz → pishalking.ru (тот же path, query, hash). */
export function redirectLegacyHostIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.replace(/^www\./, "");
  if (host !== LEGACY_SITE_HOST) return false;

  window.location.replace(
    `${SITE_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
  return true;
}

export function rememberAuthOrigin(nextPath?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    AUTH_ORIGIN_KEY,
    JSON.stringify({ origin: resolveAuthOrigin(), ts: Date.now() }),
  );
  if (nextPath) {
    const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    localStorage.setItem(AUTH_NEXT_KEY, path);
  }
}

function readSavedOrigin(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_ORIGIN_KEY);
    if (!raw) return null;
    const { origin, ts } = JSON.parse(raw) as { origin?: string; ts?: number };
    if (!origin || !ts || Date.now() - ts > TTL_MS) {
      localStorage.removeItem(AUTH_ORIGIN_KEY);
      return null;
    }
    if (!isAllowedAuthOrigin(origin)) return null;
    return origin;
  } catch {
    return null;
  }
}

export function getDesiredAuthOrigin(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get(RETURN_ORIGIN_PARAM);
  if (fromUrl && isAllowedAuthOrigin(fromUrl)) {
    try {
      return new URL(fromUrl).origin;
    } catch {
      /* ignore */
    }
  }
  return readSavedOrigin();
}

export function getAuthNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get(NEXT_PARAM);
  if (fromUrl && fromUrl.startsWith("/")) return fromUrl;
  const saved = localStorage.getItem(AUTH_NEXT_KEY);
  return saved?.startsWith("/") ? saved : null;
}

/**
 * PKCE OAuth часто возвращает на корень сайта (`/`) или на `/auth`, хотя redirect в приложении был `/auth?next=…`.
 * Переносим query (`code`, `state`) на целевой path из `next`, иначе обмен кода выполняется на главной и пользователь «остаётся» на лендинге.
 */
export function bounceOAuthCallbackToSavedNextIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (!params.get("code")) return false;

  const pathname = window.location.pathname;
  if (isMarketingLandingPath(pathname, window.location.search)) return false;
  if (pathname !== "/" && pathname !== "/auth") return false;

  const next = getAuthNextPath();
  if (!next || pathname === next) return false;

  const qs = params.toString();
  const tail = qs ? `?${qs}${window.location.hash}` : `${window.location.hash}`;
  const origin = getDesiredAuthOrigin() ?? resolveAuthOrigin();
  window.location.replace(`${origin}${next}${tail}`);
  return true;
}

/** После OAuth, если Supabase открыл .biz с return_origin — вернуть на .ru. */
export function restoreAuthOriginIfNeeded(): boolean {
  if (typeof window === "undefined") return false;

  if (isMarketingLandingPath(window.location.pathname, window.location.search)) {
    return false;
  }

  const host = window.location.hostname.replace(/^www\./, "");
  const onLegacy = host === LEGACY_SITE_HOST;
  const desired = getDesiredAuthOrigin() ?? (onLegacy ? SITE_ORIGIN : null);

  if (!desired || desired === window.location.origin) return false;
  if (!isAllowedAuthOrigin(desired)) return false;

  const next = getAuthNextPath();
  const params = new URLSearchParams(window.location.search);
  params.delete(RETURN_ORIGIN_PARAM);
  params.delete(NEXT_PARAM);

  let path = window.location.pathname;
  if (params.toString()) path += `?${params.toString()}`;
  path += window.location.hash;

  if (next && (window.location.pathname === "/" || window.location.pathname === "/auth")) {
    path = next + window.location.hash;
  }

  window.location.replace(desired + path);
  return true;
}

export function clearAuthOriginMemory(): void {
  localStorage.removeItem(AUTH_ORIGIN_KEY);
  localStorage.removeItem(AUTH_NEXT_KEY);
}

function authCallbackUrl(extra?: Record<string, string>): string {
  const origin = resolveAuthOrigin();
  const url = new URL("/auth", origin);
  url.searchParams.set(RETURN_ORIGIN_PARAM, origin);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  }
  return url.toString();
}

/** После регистрации / OAuth. */
export function authRedirectUrl(nextPath = defaultAuthNextPath()): string {
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  rememberAuthOrigin(path);
  return authCallbackUrl({ [NEXT_PARAM]: path });
}

/** Ссылка из письма «Сбросить пароль». */
export function authRecoveryUrl(nextPath = CABINET_PATH): string {
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  rememberAuthOrigin(path);
  return authCallbackUrl({ type: "recovery", [NEXT_PARAM]: path });
}
