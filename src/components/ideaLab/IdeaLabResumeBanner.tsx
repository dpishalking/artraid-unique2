import { ideaLabSessionUrl } from "@/lib/navigation/ideaLabUrls";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clarityLabel } from "@/lib/ideaLab/clarity";
import { parseIdeaLabState } from "@/lib/ideaLab/state";
import type { StartupMode } from "@/lib/ideaLab/types";

type Props = {
  projectId: string;
  startupMode: string;
  ideaLabState: Record<string, unknown>;
};

export function IdeaLabResumeBanner({ projectId, startupMode, ideaLabState }: Props) {
  const mode = startupMode as StartupMode;
  if (mode !== "has_idea" && mode !== "find_idea" && mode !== "unclear") return null;

  const lab = parseIdeaLabState(ideaLabState);
  const clarity = lab.clarityPercent ?? 0;
  if (clarity >= 76) return null;

  const label = clarityLabel(clarity);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Idea Lab — {clarity}% ясности</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}. Продолжите диалог с наставником.</p>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="shrink-0" asChild>
        <a href={ideaLabSessionUrl(projectId)}>Продолжить</a>
      </Button>
    </div>
  );
}
