import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitForProjectContext } from "@/lib/navigation/flowExit";
import { useEffectiveProjectId } from "@/hooks/useEffectiveProjectId";
import { isCabinetWorkspaceRoute } from "@/lib/surface/isPrimaryAuditSurface";
import { getProjectActivitySummary, getProjectById } from "@/lib/projects/projectApi";
import { GrowthCycleView } from "@/components/growthCycle/GrowthCycleView";
import type { GrowthCycleStep } from "@/lib/growthCycle/routes";
import { parseGrowthCycleStep } from "@/lib/growthCycle/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GrowthCyclePage() {
  const { projectId: pathProjectId } = useParams<{ projectId: string }>();
  const effectiveId = useEffectiveProjectId();
  const projectId = pathProjectId ?? effectiveId;
  const [searchParams, setSearchParams] = useSearchParams();
  const step = parseGrowthCycleStep(searchParams.get("step"));

  const [loading, setLoading] = useState(Boolean(projectId));
  const [projectName, setProjectName] = useState<string>();
  const [domain, setDomain] = useState<string>();
  const [hasAudit, setHasAudit] = useState(false);
  const [reportShareId, setReportShareId] = useState<string | null>(null);

  const inCabinetShell = isCabinetWorkspaceRoute(
    pathProjectId ? `/projects/${pathProjectId}/growth-cycle` : "/growth-cycle",
  );

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getProjectById(projectId), getProjectActivitySummary(projectId)])
      .then(([data, activity]) => {
        setProjectName(data?.project.name);
        setDomain(data?.project.current_website_url?.replace(/^https?:\/\//, "") ?? undefined);
        setHasAudit(activity.hasAudit);
        setReportShareId(activity.lastAuditShareId);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const setStep = (next: GrowthCycleStep) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("step", next);
        if (!pathProjectId && projectId) params.set("projectId", projectId);
        return params;
      },
      { replace: true },
    );
  };

  if (!projectId) {
    return (
      <main className="min-h-[calc(100vh-3rem)] flex flex-col">
        <FlowPageHeader title="Цикл внедрения" hideExit={inCabinetShell} />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <p className="font-display text-lg font-semibold">Выберите проект</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Цикл внедрения работает в контексте проекта — откройте его из обзора или дашборда.
          </p>
          <Button asChild className="mt-6">
            <Link to="/cabinet">К дашборду</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={cn("flex min-h-[calc(100vh-3rem)] flex-col")}>
      <FlowPageHeader
        title="Цикл внедрения"
        hideExit={inCabinetShell}
        exit={inCabinetShell ? undefined : flowExitForProjectContext(projectId)}
        showHomeLink={!inCabinetShell && Boolean(projectId)}
      />
      <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Загружаем контур внедрения…
          </div>
        ) : (
          <GrowthCycleView
            projectId={projectId}
            projectName={projectName}
            domain={domain}
            hasAudit={hasAudit}
            reportShareId={reportShareId}
            step={step}
            onStepChange={setStep}
          />
        )}
      </div>
    </main>
  );
}
