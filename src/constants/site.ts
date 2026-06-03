/** Основной продакшен-домен (мастерская проектов). */
export const PRIMARY_SITE_HOST = "pishalking.ru";

/** Поддомен сервиса «только идея» — Idea Lab. */
export const IDEA_LAB_HOST =
  (import.meta.env.VITE_IDEA_LAB_HOST as string | undefined)?.trim() || "ideas.pishalking.ru";

/** Публичный конфигуратор лендингов (Forge Studio). */
export const FORGE_STUDIO_HOST =
  (import.meta.env.VITE_FORGE_STUDIO_HOST as string | undefined)?.trim() || "studio.pishalking.ru";

/** Старый домен — только 301 на .ru в браузере (см. redirectLegacyHostIfNeeded). */
export const LEGACY_SITE_HOST = "pishalking.biz";

/** Активные домены в юр. текстах и UI. */
export const SITE_HOSTS = [PRIMARY_SITE_HOST, IDEA_LAB_HOST] as const;

/** @deprecated Используйте getCurrentSiteHost() */
export const SITE_HOST = PRIMARY_SITE_HOST;

export const SITE_ORIGIN = `https://${PRIMARY_SITE_HOST}` as const;

export const IDEA_LAB_ORIGIN = `https://${IDEA_LAB_HOST}` as const;

export const FORGE_STUDIO_ORIGIN = `https://${FORGE_STUDIO_HOST}` as const;

/**
 * Отдельный поддомен ideas.* — только если в CI задано VITE_IDEA_LAB_USE_SUBDOMAIN=true
 * и в DNS настроен ideas.pishalking.ru (иначе NXDOMAIN).
 * Без флага Idea Lab живёт на pishalking.ru/idea-lab (дашборд: /idea-lab/dashboard).
 */
export function useSeparateIdeaLabSubdomain(): boolean {
  const raw = import.meta.env.VITE_IDEA_LAB_USE_SUBDOMAIN;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return false;
}

export function isIdeaLabHost(host = getCurrentSiteHost()): boolean {
  const normalized = host.replace(/^www\./, "");
  if (normalized === IDEA_LAB_HOST) return true;
  if (import.meta.env.DEV && normalized === "ideas.localhost") return true;
  return false;
}

export function isForgeStudioHost(host = getCurrentSiteHost()): boolean {
  const normalized = host.replace(/^www\./, "");
  if (normalized === FORGE_STUDIO_HOST) return true;
  if (import.meta.env.DEV && normalized === "studio.localhost") return true;
  return false;
}

export function isWorkshopHost(host = getCurrentSiteHost()): boolean {
  if (isIdeaLabHost(host)) return false;
  if (isForgeStudioHost(host)) return false;
  const normalized = host.replace(/^www\./, "");
  return (
    normalized === PRIMARY_SITE_HOST ||
    normalized === LEGACY_SITE_HOST ||
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  );
}

export function getCurrentSiteHost(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname.replace(/^www\./, "");
  }
  return PRIMARY_SITE_HOST;
}

export function getCurrentSiteOrigin(): string {
  if (typeof window !== "undefined") {
    const host = getCurrentSiteHost();
    if (host === LEGACY_SITE_HOST) return SITE_ORIGIN;
    if (window.location.origin) return window.location.origin;
  }
  return SITE_ORIGIN;
}

export function isLegacySiteHost(host = getCurrentSiteHost()): boolean {
  return host === LEGACY_SITE_HOST;
}

export function siteHostsLabel(): string {
  return PRIMARY_SITE_HOST;
}
