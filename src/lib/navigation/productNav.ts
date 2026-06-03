import { getLastProjectId } from "@/lib/navigation/lastProject";
import { CREDITS_ENABLED } from "@/config/features";
import { isCabinetWorkspaceRoute } from "@/lib/surface/isPrimaryAuditSurface";

/** Где не показывать полоску инструментов (свой shell или служебные страницы). */
export const PRODUCT_NAV_HIDDEN_PREFIXES = [
  "/admin",
  "/auth",
  "/backlog",
  "/prototype-backlog",
  "/demo",
  "/oferta",
  "/privacy",
];

export function shouldShowProductNav(pathname: string): boolean {
  if (pathname.includes("/onboarding")) return false;
  return !PRODUCT_NAV_HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** projectId из query, URL проекта или последнего открытого в кабинете. */
export function resolveProjectId(pathname: string, search: string): string | undefined {
  const fromQuery = new URLSearchParams(search).get("projectId")?.trim();
  if (fromQuery) return fromQuery;
  const m = pathname.match(/^\/projects\/([^/]+)/);
  const id = m?.[1];
  if (id && id !== "new") return id;
  if (isCabinetWorkspaceRoute(pathname)) {
    return getLastProjectId() ?? undefined;
  }
  return undefined;
}

export function toolHref(
  path: string,
  projectId?: string,
  extra?: Record<string, string>,
): string {
  const qIndex = path.indexOf("?");
  const basePath = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const params = new URLSearchParams(qIndex >= 0 ? path.slice(qIndex + 1) : "");
  if (projectId) params.set("projectId", projectId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export type ToolNavItem = {
  id: string;
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

/**
 * Глобальный сайдбар кабинета — только управление проектами.
 * Все инструменты (Аудит / Оффер / Прототип / Конкуренты / Карта ниши) живут
 * внутри проекта: они требуют projectId-контекст, без него анализ бессмысленен.
 */
export function buildToolNavItems(
  _projectId?: string,
  opts?: { homeHref?: string; homeLabel?: string },
): ToolNavItem[] {
  const homeHref = opts?.homeHref ?? "/cabinet";
  const homeLabel = opts?.homeLabel ?? "Дашборд";

  const items: ToolNavItem[] = [
    {
      id: "home",
      label: homeLabel,
      href: homeHref,
      isActive: (p) => p === homeHref || p === "/cabinet",
    },
    {
      id: "projects",
      label: "Все проекты",
      href: "/projects",
      isActive: (p) => p === "/projects" || p === "/projects/new",
    },
    {
      id: "my-prototypes",
      label: "Мои прототипы",
      href: "/my-prototypes",
      isActive: (p) => p.startsWith("/my-prototypes"),
    },
  ];

  if (CREDITS_ENABLED) {
    items.push({
      id: "pricing",
      label: "Тарифы",
      href: "/pricing",
      isActive: (p) => p === "/pricing",
    });
  }

  return items;
}
