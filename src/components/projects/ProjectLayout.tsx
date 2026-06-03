import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { rememberLastProject } from "@/lib/navigation/lastProject";
import { SiteChromeFooter } from "@/components/layout/SiteChromeFooter";

/**
 * Layout вложенных страниц проекта. Сайдбар проекта уже отрисован в
 * `PersonalCabinetLayout`; здесь — только контентная область.
 */
export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    if (projectId) rememberLastProject(projectId);
  }, [projectId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="container mx-auto max-w-6xl flex-1 px-4 py-8 md:py-10">
        <Outlet />
      </main>
      <SiteChromeFooter />
    </div>
  );
}
