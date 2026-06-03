import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import type { FlowExitTarget } from "@/lib/navigation/flowExit";
import { CABINET_PATH } from "@/lib/navigation/flowExit";
import { shouldShowProductNav } from "@/lib/navigation/productNav";
import { PersonalCabinetChip } from "@/components/navigation/PersonalCabinetChip";
import { isCabinetWorkspaceRoute } from "@/lib/surface/isPrimaryAuditSurface";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Props = {
  /** Основной выход из потока (проект / главная / список). */
  exit?: FlowExitTarget;
  /** Не показывать «Назад» (например, корень личного кабинета). */
  hideExit?: boolean;
  /** Дополнительная ссылка «Главная», если exit не на /. */
  showHomeLink?: boolean;
  title?: string;
  sticky?: boolean;
  /** Сместить вниз, если над шапкой уже есть ProductNavBar */
  stackBelowProductNav?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function FlowPageHeader({
  exit,
  hideExit = false,
  showHomeLink = false,
  title,
  sticky = true,
  stackBelowProductNav = false,
  className,
  children,
}: Props) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const hubHref = user ? CABINET_PATH : "/";
  const hubLabel = user ? "Дашборд" : "Главная";
  const inCabinetShell = isCabinetWorkspaceRoute(pathname);
  const showHubShortcut = Boolean(
    showHomeLink && exit && exit.to !== hubHref && !inCabinetShell,
  );
  /** В сайдбаре уже есть все пункты — «Назад» и дубль «Дашборд» не нужны. */
  const hideBackLink =
    hideExit || inCabinetShell || Boolean(stackBelowProductNav && user && exit?.to === hubHref);
  const showCabinetChip =
    !inCabinetShell && !shouldShowProductNav(pathname) && pathname !== CABINET_PATH;
  const stickyTop = stackBelowProductNav && !inCabinetShell;

  return (
    <header
      className={cn(
        "z-40 border-b border-border bg-background/90 backdrop-blur-md",
        sticky && (stickyTop ? "sticky top-[4.25rem] z-40 sm:top-10" : "sticky top-0"),
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {exit && !hideBackLink && (
            <Link
              to={exit.to}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{exit.label}</span>
              <span className="sm:hidden">Назад</span>
            </Link>
          )}
          {showHubShortcut && (
            <Link
              to={hubHref}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title={hubLabel}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{hubLabel}</span>
            </Link>
          )}
          {title && (
            <span
              className={cn(
                "truncate text-sm font-medium text-foreground",
                ((exit && !hideBackLink) || showHubShortcut) && "border-l border-border pl-3",
              )}
            >
              {title}
            </span>
          )}
        </div>
        {(children || showCabinetChip) && (
          <div className="flex shrink-0 items-center gap-2">
            {children}
            {showCabinetChip && <PersonalCabinetChip />}
          </div>
        )}
      </div>
    </header>
  );
}
