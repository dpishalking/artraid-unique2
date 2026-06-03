import type { LucideIcon } from "lucide-react";
import { Brain, LineChart, Search } from "lucide-react";
import { roleConfig } from "@/lib/ideaLab/roles";
import type { IdeaLabCoachRole } from "@/lib/ideaLab/types";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<IdeaLabCoachRole, LucideIcon> = {
  coach: Brain,
  investor: LineChart,
  critic: Search,
};

type Props = {
  role: IdeaLabCoachRole;
  className?: string;
};

export function IdeaLabRoleDetailPanel({ role, className }: Props) {
  const cfg = roleConfig(role);
  const Icon = ROLE_ICONS[role];

  return (
    <div
      className={cn(il.glass, "p-5 space-y-4", className)}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{cfg.label}</p>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/90">{cfg.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cfg.detail}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">Тон:</span> {cfg.tone}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={il.label}>Как ведёт диалог</p>
          <ul className="mt-2 space-y-1.5">
            {cfg.howItWorks.map((item) => (
              <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={il.label}>О чём спрашивает</p>
          <ul className="mt-2 space-y-1.5">
            {cfg.asksAbout.map((item) => (
              <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs leading-relaxed border-t border-border/60 pt-3 text-muted-foreground">
        <span className="font-medium text-foreground">Кому подойдёт:</span> {cfg.bestFor}
      </p>
    </div>
  );
}

/** Компактные карточки всех ролей — для страницы входа. */
export function IdeaLabRolesOverview({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {(["coach", "investor", "critic"] as const).map((id) => {
        const cfg = roleConfig(id);
        const Icon = ROLE_ICONS[id];
        return (
          <div
            key={id}
            className="rounded-xl border border-amber-500/10 bg-[hsl(220_24%_9%/0.5)] p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <span className="text-xs font-semibold">{cfg.shortLabel}</span>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{cfg.description}</p>
          </div>
        );
      })}
    </div>
  );
}
