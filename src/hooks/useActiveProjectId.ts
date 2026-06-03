import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getLastProjectId, rememberLastProject } from "@/lib/navigation/lastProject";
import { resolveProjectId } from "@/lib/navigation/productNav";
import { getProjects } from "@/lib/projects/projectApi";

/**
 * projectId из URL или последний активный проект пользователя (localStorage + API).
 */
export function useActiveProjectId(): string | undefined {
  const { pathname, search } = useLocation();
  const fromRoute = resolveProjectId(pathname, search);
  const { user, loading: authLoading } = useAuth();
  const [resolved, setResolved] = useState<string | undefined>(() => fromRoute ?? getLastProjectId() ?? undefined);

  useEffect(() => {
    if (fromRoute) {
      rememberLastProject(fromRoute);
      setResolved(fromRoute);
      return;
    }
    if (authLoading) return;
    if (!user) {
      setResolved(undefined);
      return;
    }
    const cached = getLastProjectId();
    if (cached) {
      setResolved(cached);
    }
    getProjects()
      .then((rows) => {
        const id = rows[0]?.id;
        if (id) {
          rememberLastProject(id);
          setResolved(id);
        }
      })
      .catch(() => {});
  }, [fromRoute, user, authLoading]);

  return fromRoute ?? resolved;
}
