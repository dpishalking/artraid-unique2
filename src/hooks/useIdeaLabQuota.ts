import { useCallback, useEffect, useState } from "react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { getIdeaLabProjects } from "@/lib/ideaLab/ideaProjects";
import {
  IDEA_LAB_IDEA_LIMIT_USER,
  canCreateIdeaLabProject,
  ideaLabMaxIdeas,
  isAtIdeaLabIdeaLimit,
} from "@/lib/ideaLab/ideaQuota";
import type { Project } from "@/lib/projects/types";

export function useIdeaLabQuota() {
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const [ideas, setIdeas] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return getIdeaLabProjects()
      .then(setIdeas)
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Не удалось загрузить идеи");
        setIdeas([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const ideaCount = ideas.length;
  const canCreateMore = canCreateIdeaLabProject(ideaCount, isAdmin);
  const atIdeaLimit = isAtIdeaLabIdeaLimit(ideaCount, isAdmin);
  const maxIdeas = ideaLabMaxIdeas(isAdmin);

  return {
    ideas,
    ideaCount,
    isAdmin,
    canCreateMore,
    atIdeaLimit,
    maxIdeas,
    limitForUser: IDEA_LAB_IDEA_LIMIT_USER,
    loading: loading || adminLoading,
    error,
    reload,
  };
}
