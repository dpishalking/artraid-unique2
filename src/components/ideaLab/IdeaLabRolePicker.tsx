import type { LucideIcon } from "lucide-react";
import { Brain, LineChart, Search } from "lucide-react";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";
import { IDEA_LAB_ROLES, type IdeaLabRoleConfig } from "@/lib/ideaLab/roles";
import type { IdeaLabCoachRole } from "@/lib/ideaLab/types";

const ROLE_ICONS: Record<IdeaLabCoachRole, LucideIcon> = {
  coach: Brain,
  investor: LineChart,
  critic: Search,
};

type Props = {
  value: IdeaLabCoachRole;
  onChange: (role: IdeaLabCoachRole) => void;
  disabled?: boolean;
  compact?: boolean;
  /** Подпись под заголовком блока */
  hint?: string;
};

export function IdeaLabRolePicker({ value, onChange, disabled, compact, hint }: Props) {
  return (
    <div className="space-y-2">
      {!compact && (
        <div>
          <p className={il.label}>Формат общения</p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{hint}</p>
          ) : null}
        </div>
      )}
      <div className={cn("grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-3")}>
        {IDEA_LAB_ROLES.map((role) => (
          <RoleOption
            key={role.id}
            role={role}
            active={value === role.id}
            disabled={disabled}
            compact={compact}
            onSelect={() => onChange(role.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RoleOption({
  role,
  active,
  disabled,
  compact,
  onSelect,
}: {
  role: IdeaLabRoleConfig;
  active: boolean;
  disabled?: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  const Icon = ROLE_ICONS[role.id];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition-all duration-300 disabled:opacity-50",
        active
          ? "border-amber-500/45 bg-gradient-to-br from-amber-500/15 to-transparent shadow-[0_0_24px_-8px_hsl(43_90%_50%/0.35)] ring-1 ring-amber-500/25"
          : cn(il.surface, "hover:border-amber-500/30 hover:bg-amber-500/5"),
        compact && "flex items-start gap-2.5",
      )}
    >
      <div className={cn("flex items-start gap-2", !compact && "flex-col gap-1.5")}>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active
              ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
              : cn(il.surfaceMuted, "text-muted-foreground"),
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium leading-tight">{role.label}</span>
          {!compact && (
            <>
              <span className="block text-[10px] text-amber-700/80 dark:text-amber-400/90 mt-0.5">
                {role.tagline}
              </span>
              <span className="block text-[11px] text-muted-foreground mt-1 leading-snug">
                {role.description}
              </span>
            </>
          )}
          {compact && active && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">{role.tagline}</span>
          )}
        </span>
      </div>
    </button>
  );
}

export function roleBadgeLabel(role: IdeaLabCoachRole): string {
  return IDEA_LAB_ROLES.find((r) => r.id === role)?.shortLabel ?? "Коуч";
}
