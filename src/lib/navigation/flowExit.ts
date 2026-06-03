/** Куда вести пользователя при выходе из инструмента (не browser back). */
export type FlowExitTarget = { to: string; label: string };

/** Центральная точка после входа — сводка по проектам и быстрые действия. */
export const CABINET_PATH = "/cabinet";

/** Публичный лендинг; для авторизованных не редиректит в кабинет (в отличие от `/`). */
export const MARKETING_SITE_PATH = "/site";

export function flowExitHome(): FlowExitTarget {
  return { to: "/", label: "На главную" };
}

/** Маркетинговый лендинг из кабинета и инструментов. */
export function flowExitMarketingSite(): FlowExitTarget {
  return { to: MARKETING_SITE_PATH, label: "На сайт" };
}

/** Личный дашборд (упаковка, активность, что поправить). */
export function flowExitPersonalCabinet(): FlowExitTarget {
  return { to: CABINET_PATH, label: "Дашборд" };
}

export function flowExitProjects(): FlowExitTarget {
  return { to: CABINET_PATH, label: "Дашборд" };
}

export function flowExitProject(projectId: string): FlowExitTarget {
  return { to: `/projects/${projectId}`, label: "К проекту" };
}

export function flowExitForProjectContext(projectId?: string | null): FlowExitTarget {
  return projectId ? flowExitProject(projectId) : flowExitHome();
}

export function flowExitProjectPrototypes(projectId: string): FlowExitTarget {
  return { to: `/projects/${projectId}/prototypes`, label: "Прототипы проекта" };
}

/** @deprecated Используйте flowExitProjectPrototypes */
export function flowExitMyPrototypes(projectId?: string | null): FlowExitTarget {
  return projectId ? flowExitProjectPrototypes(projectId) : flowExitProjects();
}
