import { clarityLabel } from "@/lib/ideaLab/clarity";
import { IdeaLabProgress } from "@/components/ideaLab/IdeaLabProgress";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

type Props = {
  percent: number;
  className?: string;
};

export function ClarityProgress({ percent, className }: Props) {
  const label = clarityLabel(percent);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={il.label}>Ясность проекта</p>
          <p className="text-sm font-medium text-amber-200/90 mt-1">{label}</p>
        </div>
        <span className={il.badgeClarity}>{percent}%</span>
      </div>
      <IdeaLabProgress value={percent} className="h-1.5" />
    </div>
  );
}
