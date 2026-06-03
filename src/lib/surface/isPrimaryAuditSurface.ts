import { getCurrentSiteHost, PRIMARY_SITE_HOST } from "@/constants/site";
import { isIdeaLabSurfaceRoute } from "@/lib/ideaLab/constants";

/** Маршруты личного кабинета: сайдбар «Мастерская», без верхней ProductNavBar. */
const CABINET_ROUTE_PREFIXES = [
  "/cabinet",
  "/projects",
  "/offer-generator",
  "/prototype",
  "/builder",
  "/quiz",
  "/audit",
  "/growth-cycle",
  "/pricing",
  "/p/",
];

export function isCabinetWorkspaceRoute(pathname: string): boolean {
  return CABINET_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * На основном прод-домене публичная витрина — «аудит»; маршруты кабинета сохранены.
 */
export function isPrimaryAuditSurface(): boolean {
  if (typeof window === "undefined") return false;
  return getCurrentSiteHost() === PRIMARY_SITE_HOST;
}

/** @deprecated Используйте isCabinetWorkspaceRoute */
export function usesEmbeddedCabinetNav(pathname: string): boolean {
  return isCabinetWorkspaceRoute(pathname);
}

/** Скрывает верхнюю ProductNavBar и FAB (навигация — сайдбар слева). */
export function shouldHideCabinetProductChrome(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (pathname === "/lp" || pathname.startsWith("/lp/")) return true;
  if (isIdeaLabSurfaceRoute(pathname)) return true;
  if (isCabinetWorkspaceRoute(pathname)) return true;
  if (isPrimaryAuditSurface()) {
    return pathname === "/" || pathname === "/site";
  }
  return false;
}
