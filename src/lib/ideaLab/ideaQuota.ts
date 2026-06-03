/** Лимит идей Idea Lab для обычных пользователей (админы — без лимита). */
export const IDEA_LAB_IDEA_LIMIT_USER = 1;

export function ideaLabMaxIdeas(isAdmin: boolean): number | null {
  return isAdmin ? null : IDEA_LAB_IDEA_LIMIT_USER;
}

export function canCreateIdeaLabProject(ideaCount: number, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return ideaCount < IDEA_LAB_IDEA_LIMIT_USER;
}

export function isAtIdeaLabIdeaLimit(ideaCount: number, isAdmin: boolean): boolean {
  return !canCreateIdeaLabProject(ideaCount, isAdmin);
}
