import {
  getCurrentSiteHost,
  getCurrentSiteOrigin,
  IDEA_LAB_HOST,
  IDEA_LAB_ORIGIN,
  isIdeaLabHost,
  SITE_ORIGIN,
  useSeparateIdeaLabSubdomain,
} from "@/constants/site";
import {
  IDEA_LAB_BASE,
  IDEA_LAB_DASHBOARD_PATH,
  ideaLabSessionPath,
} from "@/lib/ideaLab/constants";

export { ideaLabDashboardPath, ideaLabIdeasNewPath, ideaLabRegisterPath, ideaLabSessionPath } from "@/lib/ideaLab/constants";

/** Полный URL сессии на сервисе идей. */
export function ideaLabSessionUrl(projectId: string): string {
  if (useSeparateIdeaLabSubdomain()) {
    return `${IDEA_LAB_ORIGIN}${ideaLabSessionPath(projectId)}`;
  }
  return `${getCurrentSiteOrigin()}${ideaLabSessionPath(projectId)}`;
}

/** Точка входа — регистрация. */
export function ideaLabEntryPath(): string {
  return "/";
}

export function ideaLabEntryUrl(): string {
  if (useSeparateIdeaLabSubdomain()) {
    return `${IDEA_LAB_ORIGIN}/`;
  }
  return `${getCurrentSiteOrigin()}/idea-lab`;
}

/** Ссылка на мастерскую (кабинет с проектами). */
export function workshopCabinetUrl(): string {
  return `${SITE_ORIGIN}/cabinet`;
}

export function workshopProjectUrl(projectId: string): string {
  return `${SITE_ORIGIN}/projects/${projectId}`;
}

/** Инструмент мастерской с projectId (аудит, оффер, прототип). */
export function workshopToolUrl(
  toolPath: "/audit" | "/offer-generator" | "/prototype" | "/quiz",
  projectId?: string,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  const q = params.toString();
  return q ? `${SITE_ORIGIN}${toolPath}?${q}` : `${SITE_ORIGIN}${toolPath}`;
}

/**
 * На основном домене уводим /idea-lab и /projects/:id/idea-lab на поддомен (prod).
 */
export function redirectIdeaLabToSubdomainIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  if (!useSeparateIdeaLabSubdomain()) return false;
  if (isIdeaLabHost()) return false;

  const { pathname, search, hash } = window.location;
  let target: string | null = null;

  if (
    pathname === IDEA_LAB_BASE ||
    pathname.startsWith(`${IDEA_LAB_BASE}/`) ||
    pathname === "/dashboard" ||
    pathname.startsWith("/ideas/") ||
    pathname.startsWith("/session/")
  ) {
    const sub =
      pathname === IDEA_LAB_BASE
        ? "/"
        : pathname.startsWith(IDEA_LAB_BASE)
          ? pathname.replace(new RegExp(`^${IDEA_LAB_BASE}`), "") || "/"
          : pathname;
    target = `${IDEA_LAB_ORIGIN}${sub}${search}${hash}`;
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)\/idea-lab\/?$/);
  if (projectMatch) {
    target = `${IDEA_LAB_ORIGIN}/session/${projectMatch[1]}${search}${hash}`;
  }

  if (!target) return false;
  window.location.replace(target);
  return true;
}

/** На поддомене идей — уводим кабинет/проекты на мастерскую. */
export function redirectWorkshopOnlyRouteIfNeeded(): boolean {
  if (typeof window === "undefined") return false;
  if (!isIdeaLabHost()) return false;

  const { pathname, search, hash } = window.location;
  const workshopOnly =
    pathname.startsWith("/cabinet") ||
    pathname.startsWith("/projects") ||
    pathname === "/quiz" ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/offer-generator") ||
    pathname.startsWith("/prototype") ||
    pathname.startsWith("/my-prototypes");

  if (!workshopOnly) return false;

  const mapped = pathname.startsWith("/projects/")
    ? `${SITE_ORIGIN}${pathname}${search}${hash}`
    : `${SITE_ORIGIN}/cabinet${search}${hash}`;

  window.location.replace(mapped);
  return true;
}

export function ideaLabHostLabel(): string {
  return IDEA_LAB_HOST || getCurrentSiteHost();
}
