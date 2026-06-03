import { toolHref } from "@/lib/navigation/productNav";
import { ideaLabSessionUrl } from "@/lib/navigation/ideaLabUrls";

export type ProjectNavGroup = {
  id: string;
  label: string;
  items: ProjectNavItem[];
};

export type ProjectNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Внешняя ссылка (поддомен Idea Lab). */
  external?: boolean;
  /** Точный матч пути или префикс. */
  match: (pathname: string, search: string) => boolean;
};

const PROJECT_TOOL_PATHS = new Set([
  "/audit",
  "/offer-generator",
  "/prototype",
  "/growth-cycle",
]);

/**
 * Текущий пользователь работает в контексте конкретного проекта?
 * Покрывает /projects/:id/* и инструменты (/audit, /offer-generator, /prototype) с ?projectId=.
 */
export function resolveProjectShell(
  pathname: string,
  search: string,
): { projectId: string; toolMode: boolean } | null {
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const idFromPath = projectMatch?.[1];
  if (idFromPath && idFromPath !== "new") {
    return { projectId: idFromPath, toolMode: false };
  }
  const fromQuery = new URLSearchParams(search).get("projectId")?.trim();
  if (fromQuery && PROJECT_TOOL_PATHS.has(pathname)) {
    return { projectId: fromQuery, toolMode: true };
  }
  return null;
}

const HOOK_PROJECT_ROOT = /^\/projects\/[^/]+$/;

function exact(target: string) {
  return (pathname: string) => pathname === target;
}

function startsWith(target: string) {
  return (pathname: string) => pathname === target || pathname.startsWith(`${target}/`);
}

function toolMatch(toolPath: string, projectId: string) {
  return (pathname: string, search: string) => {
    if (pathname !== toolPath) return false;
    const pid = new URLSearchParams(search).get("projectId")?.trim();
    return pid === projectId;
  };
}

export function buildProjectNavGroups(projectId: string): ProjectNavGroup[] {
  const base = `/projects/${projectId}`;
  return [
    {
      id: "project",
      label: "Проект",
      items: [
        {
          id: "overview",
          label: "Обзор",
          href: base,
          icon: "home",
          match: (p) => p === base || HOOK_PROJECT_ROOT.test(p),
        },
        {
          id: "commercial-metrics",
          label: "Метрики",
          href: `${base}/commercial-metrics`,
          icon: "commercial-metrics",
          match: startsWith(`${base}/commercial-metrics`),
        },
        {
          id: "memory",
          label: "Память",
          href: `${base}/memory`,
          icon: "memory",
          match: startsWith(`${base}/memory`),
        },
        {
          id: "files",
          label: "Файлы",
          href: `${base}/files`,
          icon: "files",
          match: startsWith(`${base}/files`),
        },
      ],
    },
    {
      id: "analysis",
      label: "Анализ",
      items: [
        {
          id: "audit",
          label: "Аудит сайта",
          href: toolHref("/audit", projectId),
          icon: "audit",
          match: toolMatch("/audit", projectId),
        },
        {
          id: "growth-cycle",
          label: "Цикл внедрения",
          href: toolHref("/growth-cycle", projectId),
          icon: "growth-cycle",
          match: toolMatch("/growth-cycle", projectId),
        },
        {
          id: "competitors",
          label: "Конкуренты",
          href: `${base}/competitors`,
          icon: "competitors",
          match: (p) => p === `${base}/competitors`,
        },
        {
          id: "niche-map",
          label: "Карта ниши",
          href: `${base}/competitors/compare`,
          icon: "niche",
          match: exact(`${base}/competitors/compare`),
        },
      ],
    },
    {
      id: "create",
      label: "Создание",
      items: [
        {
          id: "artifacts",
          label: "Артефакты",
          href: `${base}/artifacts`,
          icon: "artifacts",
          match: startsWith(`${base}/artifacts`),
        },
        {
          id: "hypothesis-lab",
          label: "Лаборатория гипотез",
          href: `${base}/hypothesis-lab`,
          icon: "hypothesis-lab",
          match: startsWith(`${base}/hypothesis-lab`),
        },
        {
          id: "offer",
          label: "Генератор оффера",
          href: toolHref("/offer-generator", projectId, { pick: "vectors" }),
          icon: "offer",
          match: toolMatch("/offer-generator", projectId),
        },
        {
          id: "prototype",
          label: "Прототип лендинга",
          href: toolHref("/prototype", projectId),
          icon: "prototype",
          match: toolMatch("/prototype", projectId),
        },
        {
          id: "prototypes",
          label: "Прототипы",
          href: `${base}/prototypes`,
          icon: "prototypes",
          match: startsWith(`${base}/prototypes`),
        },
        {
          id: "idea-lab",
          label: "Idea Lab",
          href: ideaLabSessionUrl(projectId),
          icon: "idea-lab",
          external: true,
          match: () => false,
        },
      ],
    },
  ];
}
