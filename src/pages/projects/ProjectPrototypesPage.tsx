import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PrototypesListGrid, type PrototypeListItem } from "@/components/prototypes/PrototypesListGrid";
import { getProjectById } from "@/lib/projects/projectApi";
import { toolHref } from "@/lib/navigation/productNav";

export default function ProjectPrototypesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>();
  const [prototypes, setPrototypes] = useState<PrototypeListItem[]>([]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      getProjectById(projectId),
      supabase
        .from("prototypes")
        .select("id, brief, status, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ])
      .then(([project, { data }]) => {
        setProjectName(project?.project.name);
        setPrototypes((data as PrototypeListItem[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return null;

  const createHref = toolHref("/prototype", projectId);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Создание
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Прототипы проекта
          </h1>
          {projectName && <p className="text-sm text-muted-foreground">{projectName}</p>}
          {!loading && prototypes.length > 0 && (
            <p className="text-sm text-muted-foreground pt-1">
              {prototypes.length}{" "}
              {prototypes.length === 1
                ? "прототип"
                : prototypes.length < 5
                  ? "прототипа"
                  : "прототипов"}{" "}
              в этом проекте
            </p>
          )}
        </div>
        <Button asChild className="bg-gradient-money text-primary-foreground shrink-0">
          <Link to={createHref}>
            <Plus className="mr-2 h-4 w-4" />
            Новый прототип
          </Link>
        </Button>
      </header>

      <PrototypesListGrid
        prototypes={prototypes}
        loading={loading}
        emptyTitle="В проекте пока нет прототипов"
        emptyDescription="Соберите лендинг в конструкторе — он сохранится здесь и будет опираться на память проекта."
        emptyAction={
          <Button asChild className="bg-gradient-money text-primary-foreground">
            <Link to={createHref}>
              Создать прототип
              <Plus className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />
    </div>
  );
}
