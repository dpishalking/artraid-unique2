import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buildToolNavItems } from "@/lib/navigation/productNav";
import { useAuth } from "@/hooks/useAuth";
import { CABINET_PATH } from "@/lib/navigation/flowExit";

type Props = {
  projectId?: string;
  className?: string;
};

/** Горизонтальная навигация между инструментами сервиса. */
export function ToolsNav({ projectId, className }: Props) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const items = buildToolNavItems(projectId, {
    homeHref: user ? CABINET_PATH : "/",
    homeLabel: user ? "Дашборд" : "Главная",
  });

  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto scrollbar-none py-1",
        className,
      )}
      aria-label="Инструменты сервиса"
    >
      {items.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
