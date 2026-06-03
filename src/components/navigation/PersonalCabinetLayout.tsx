import { Outlet, useLocation } from "react-router-dom";
import { CabinetSidebar } from "@/components/navigation/CabinetSidebar";
import { CabinetTopBar } from "@/components/navigation/CabinetTopBar";
import { ProjectSidebar } from "@/components/navigation/ProjectSidebar";
import { resolveProjectShell } from "@/lib/navigation/projectNav";
import { isHypothesisLabPath } from "@/lib/hypotheses/labNav";
import { cn } from "@/lib/utils";

/**
 * Оболочка личного кабинета. Внутри проекта — изолированный шелл со
 * специфичным сайдбаром только этого проекта; снаружи — общий кабинет.
 */
export function PersonalCabinetLayout() {
  const { pathname, search } = useLocation();
  const shell = resolveProjectShell(pathname, search);
  const inHypothesisLab = isHypothesisLabPath(pathname);
  const showProjectSidebar = shell && !inHypothesisLab;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <CabinetTopBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {showProjectSidebar ? (
          <ProjectSidebar projectId={shell.projectId} />
        ) : shell ? null : (
          <CabinetSidebar />
        )}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            inHypothesisLab && "bg-gradient-to-br from-background via-muted/15 to-primary/[0.04]",
          )}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
