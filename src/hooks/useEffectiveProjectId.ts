import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProjectId } from "@/hooks/useActiveProjectId";

/**
 * `projectId` из `?projectId=` или (для авторизованных) последний активный проект из мастерской проекта.
 * Гостям не подставляем id из localStorage. При необходимости дописывает query в URL (replace).
 */
export function useEffectiveProjectId(): string | undefined {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromQuery = searchParams.get("projectId")?.trim() || undefined;
  const { user } = useAuth();
  const activeProjectId = useActiveProjectId();
  const projectId = projectIdFromQuery ?? (user ? activeProjectId : undefined);

  useEffect(() => {
    if (!user || projectIdFromQuery || !activeProjectId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("projectId")?.trim() === activeProjectId) return prev;
        next.set("projectId", activeProjectId);
        return next;
      },
      { replace: true },
    );
  }, [user, projectIdFromQuery, activeProjectId, setSearchParams]);

  return projectId;
}
