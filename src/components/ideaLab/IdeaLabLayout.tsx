import { Outlet } from "react-router-dom";
import { IdeaLabFooter } from "@/components/ideaLab/IdeaLabFooter";
import { IdeaLabTopBar } from "@/components/ideaLab/IdeaLabTopBar";
import { IdeaLabAmbient } from "@/components/ideaLab/IdeaLabAmbient";
import { useIdeaLabPageMeta } from "@/lib/ideaLab/useIdeaLabPageMeta";

/** Оболочка отдельного сервиса Idea Lab — без сайдбара мастерской. */
export function IdeaLabLayout() {
  useIdeaLabPageMeta();

  return (
    <div className="idea-lab-root relative flex min-h-screen flex-col">
      <IdeaLabAmbient />
      <IdeaLabTopBar />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <IdeaLabFooter />
    </div>
  );
}
