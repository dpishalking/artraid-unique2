import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ideaLabSessionPath, ideaLabSessionUrl } from "@/lib/navigation/ideaLabUrls";
import { isIdeaLabHost, useSeparateIdeaLabSubdomain } from "@/constants/site";

/** Старый путь /projects/:id/idea-lab → сессия на поддомене или /session/:id. */
export function IdeaLabProjectRedirect() {
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    if (!projectId) return;
    if (useSeparateIdeaLabSubdomain() && !isIdeaLabHost()) {
      window.location.replace(ideaLabSessionUrl(projectId));
      return;
    }
    window.location.replace(ideaLabSessionPath(projectId));
  }, [projectId]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
