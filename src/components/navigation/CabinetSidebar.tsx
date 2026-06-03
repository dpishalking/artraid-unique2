import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { ideaLabEntryUrl } from "@/lib/navigation/ideaLabUrls";
import { Button } from "@/components/ui/button";
import { CABINET_PATH } from "@/lib/navigation/flowExit";
import { buildToolNavItems } from "@/lib/navigation/productNav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  projects: FolderKanban,
  "my-prototypes": FileText,
  pricing: CreditCard,
};

export function CabinetSidebar() {
  const { pathname } = useLocation();
  const items = buildToolNavItems(undefined, {
    homeHref: CABINET_PATH,
    homeLabel: "Дашборд",
  });

  return (
    <aside className="shrink-0 border-b border-border/80 bg-card md:w-56 md:border-b-0 md:border-r md:sticky md:top-12 md:z-30 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
      <div className="space-y-3 border-b border-border/60 px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Мастерская</p>
          <p className="text-[10px] text-muted-foreground">Работа по проектам</p>
        </div>
        <Button asChild size="sm" className="hidden w-full justify-center md:flex">
          <Link to="/projects/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Новый проект
          </Link>
        </Button>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-2 scrollbar-none md:flex-col md:overflow-visible md:p-3 md:space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.id] ?? LayoutDashboard;
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.id}
              to={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "md:w-full",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-border/60 px-4 py-3 md:block">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Аудит, оффер и прототипы — <span className="text-foreground">внутри проекта</span>.
          Только идея, без бизнеса?{" "}
          <a
            href={ideaLabEntryUrl()}
            className="font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
          >
            Idea Lab
          </a>
        </p>
      </div>
    </aside>
  );
}
