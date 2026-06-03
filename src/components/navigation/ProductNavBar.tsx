import { useLocation } from "react-router-dom";
import { resolveProjectId, shouldShowProductNav } from "@/lib/navigation/productNav";
import { ToolsNav } from "@/components/navigation/ToolsNav";
import { PersonalCabinetChip } from "@/components/navigation/PersonalCabinetChip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Глобальная полоска инструментов (фаза 2). */
export function ProductNavBar({ className }: Props) {
  const { pathname, search } = useLocation();
  if (!shouldShowProductNav(pathname)) return null;

  const projectId = resolveProjectId(pathname, search);

  return (
    <div
      className={cn(
        "sticky top-0 z-[35] border-b border-border/80 bg-background/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <ToolsNav projectId={projectId} className="min-w-0 w-full sm:flex-1" />
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <ThemeToggle />
          <PersonalCabinetChip />
        </div>
      </div>
    </div>
  );
}
