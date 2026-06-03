import { isIdeaLabHost } from "@/constants/site";

/** Лимит сообщений пользователя в одном диалоге Idea Lab (после регистрации). */
export const IDEA_LAB_MESSAGE_LIMIT = 50;

export const IDEA_LAB_STARTUP_MODES = new Set(["has_idea", "find_idea"]);

/** Префикс Idea Lab на основном домене (мастерская). */
export const IDEA_LAB_BASE = "/idea-lab";

export const IDEA_LAB_REGISTER_PATH = IDEA_LAB_BASE;

export const IDEA_LAB_DASHBOARD_PATH = `${IDEA_LAB_BASE}/dashboard`;

export const IDEA_LAB_IDEAS_NEW_PATH = `${IDEA_LAB_BASE}/ideas/new`;

export function ideaLabSessionPath(projectId: string): string {
  return isIdeaLabHost()
    ? `/session/${projectId}`
    : `${IDEA_LAB_BASE}/session/${projectId}`;
}

/** Точка входа (регистрация). */
export function ideaLabRegisterPath(): string {
  return isIdeaLabHost() ? "/" : IDEA_LAB_REGISTER_PATH;
}

/** Дашборд идей — отдельный от /cabinet и /admin/dashboard. */
export function ideaLabDashboardPath(): string {
  return isIdeaLabHost() ? "/dashboard" : IDEA_LAB_DASHBOARD_PATH;
}

export function ideaLabIdeasNewPath(): string {
  return isIdeaLabHost() ? "/ideas/new" : IDEA_LAB_IDEAS_NEW_PATH;
}

/** Маршруты Idea Lab на мастерской — без верхней ProductNavBar мастерской. */
export function isIdeaLabSurfaceRoute(pathname: string): boolean {
  if (pathname === IDEA_LAB_BASE || pathname.startsWith(`${IDEA_LAB_BASE}/`)) return true;
  if (pathname === "/dashboard" || pathname.startsWith("/ideas/") || pathname.startsWith("/session/")) {
    return true;
  }
  return false;
}

/** Idea Lab как отдельный сервис — без ссылок на мастерскую, админку и другие продукты. */
export function isIdeaLabStandalone(pathname?: string): boolean {
  if (isIdeaLabHost()) return true;
  const p =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  return isIdeaLabSurfaceRoute(p);
}

/** Лендинг регистрации: / на поддомене или /idea-lab на мастерской. */
export function isIdeaLabRegisterRoute(pathname?: string): boolean {
  const p =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  if (isIdeaLabHost()) return p === "/" || p === "";
  return p === IDEA_LAB_BASE || p === `${IDEA_LAB_BASE}/`;
}
