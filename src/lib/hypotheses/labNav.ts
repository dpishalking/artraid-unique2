export type HypothesisLabSection = "overview" | "generate" | "backlog" | "tests" | "results";

export type HypothesisLabNavItem = {
  id: HypothesisLabSection;
  label: string;
  description: string;
  href: (projectId: string) => string;
  icon: string;
};

export function hypothesisLabBase(projectId: string): string {
  return `/projects/${projectId}/hypothesis-lab`;
}

export const HYPOTHESIS_LAB_NAV: HypothesisLabNavItem[] = [
  {
    id: "overview",
    label: "Обзор",
    description: "Статус и следующий шаг",
    href: (id) => hypothesisLabBase(id),
    icon: "overview",
  },
  {
    id: "generate",
    label: "Новая гипотеза",
    description: "AI или вручную",
    href: (id) => `${hypothesisLabBase(id)}/generate`,
    icon: "generate",
  },
  {
    id: "backlog",
    label: "Бэклог",
    description: "Ждут протокола",
    href: (id) => `${hypothesisLabBase(id)}/backlog`,
    icon: "backlog",
  },
  {
    id: "tests",
    label: "Тесты",
    description: "В работе сейчас",
    href: (id) => `${hypothesisLabBase(id)}/tests`,
    icon: "tests",
  },
  {
    id: "results",
    label: "Итоги",
    description: "Инсайты и победы",
    href: (id) => `${hypothesisLabBase(id)}/results`,
    icon: "results",
  },
];

export function resolveHypothesisLabSection(pathname: string, projectId: string): HypothesisLabSection {
  const base = hypothesisLabBase(projectId);
  if (pathname === base || pathname === `${base}/`) return "overview";
  if (pathname.startsWith(`${base}/generate`)) return "generate";
  if (pathname.startsWith(`${base}/backlog`)) return "backlog";
  if (pathname.startsWith(`${base}/tests`)) return "tests";
  if (pathname.startsWith(`${base}/results`)) return "results";
  return "overview";
}

export function isHypothesisLabPath(pathname: string): boolean {
  return /\/projects\/[^/]+\/hypothesis-lab(\/|$)/.test(pathname);
}

export function projectOverviewHref(projectId: string): string {
  return `/projects/${projectId}`;
}
