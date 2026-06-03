import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_EYEBROW, REPORT_H3 } from "./reportDesign";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
};

export function ReportSectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconClassName = "text-primary",
  className,
}: Props) {
  return (
    <div className={cn("mb-4 flex items-start gap-3", className)}>
      {Icon ? (
        <div
          className={cn(
            "shrink-0 rounded-lg border border-border/50 bg-background/40 p-2",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className={REPORT_EYEBROW}>{eyebrow}</p> : null}
        <h3 className={cn(eyebrow ? "mt-1" : "", REPORT_H3)}>{title}</h3>
        {description ? (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
