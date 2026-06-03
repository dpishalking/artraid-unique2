export const COMPETITOR_FREE_LIMIT = 3;

export function hasUnlimitedCompetitors(isAdmin: boolean): boolean {
  return isAdmin;
}

export function isOverCompetitorLimit(activeCount: number, isAdmin: boolean): boolean {
  return !isAdmin && activeCount >= COMPETITOR_FREE_LIMIT;
}

export function remainingCompetitorSlots(activeCount: number, isAdmin: boolean): number {
  if (isAdmin) return Number.POSITIVE_INFINITY;
  return Math.max(0, COMPETITOR_FREE_LIMIT - activeCount);
}
