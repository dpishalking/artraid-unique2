import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  Shield,
  Wand2,
} from "lucide-react";
import { getLastProjectId } from "@/lib/navigation/lastProject";
import { ideaLabEntryUrl } from "@/lib/navigation/ideaLabUrls";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { cn } from "@/lib/utils";
import { CABINET_PATH } from "@/lib/navigation/flowExit";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  className?: string;
};

function userInitials(email?: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

function userAvatarUrl(user: { user_metadata?: Record<string, unknown> }): string | undefined {
  const meta = user.user_metadata;
  const url = meta?.avatar_url ?? meta?.picture;
  return typeof url === "string" && url.length > 0 ? url : undefined;
}

/** Вход / меню аккаунта (аватар + выпадающий список). */
export function PersonalCabinetChip({ className }: Props) {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdminAccess();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const returnTo = `${pathname}${search}` || "/cabinet";

  if (loading) {
    return (
      <span
        className={cn(
          "inline-block h-9 w-9 shrink-0 rounded-full border border-border/60 bg-muted/40 animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (user) {
    const email = user.email ?? "";
    const initials = userInitials(email);
    const avatarUrl = userAvatarUrl(user);
    const lastProjectId = getLastProjectId();

    const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/80 bg-card/80 p-0.5 pl-0.5 pr-1",
              "hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              className,
            )}
            aria-label="Меню аккаунта"
          >
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[50]">
          {email ? (
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate text-xs text-muted-foreground">Аккаунт</span>
              <span className="block truncate text-sm text-foreground">{email}</span>
            </DropdownMenuLabel>
          ) : null}
          {isAdmin ? (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard" className="cursor-pointer font-medium">
                  <Shield className="mr-2 h-4 w-4 text-primary" />
                  Админка
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem asChild>
            <Link to={CABINET_PATH} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Дашборд
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/projects/new" className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Новый проект
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={ideaLabEntryUrl()} className="cursor-pointer flex items-center">
              <Wand2 className="mr-2 h-4 w-4" />
              Idea Lab · только идея
            </a>
          </DropdownMenuItem>
          {lastProjectId ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/projects/${lastProjectId}`} className="cursor-pointer font-medium">
                  <ArrowRight className="mr-2 h-4 w-4 text-primary" />
                  Открыть последний проект
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              void handleSignOut();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link
      to={`/auth?next=${encodeURIComponent(returnTo)}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-card px-3 py-1.5 text-xs font-semibold text-foreground",
        "shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-colors",
        className,
      )}
    >
      <LogIn className="h-3.5 w-3.5 text-primary" />
      <span className="hidden sm:inline">Войти</span>
    </Link>
  );
}
