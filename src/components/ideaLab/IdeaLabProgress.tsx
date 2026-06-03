import { cn } from "@/lib/utils";
import { il } from "@/lib/ideaLab/uiClasses";

type Props = {
  value: number;
  className?: string;
};

export function IdeaLabProgress({ value, className }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn(il.progress, className)}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}
