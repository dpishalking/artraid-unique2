const STORAGE_KEY = "mm_last_project_id";

export function rememberLastProject(projectId: string): void {
  if (!projectId.trim()) return;
  try {
    localStorage.setItem(STORAGE_KEY, projectId);
  } catch {
    /* private mode */
  }
}

export function getLastProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearLastProjectIfMatch(projectId: string): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) === projectId) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
