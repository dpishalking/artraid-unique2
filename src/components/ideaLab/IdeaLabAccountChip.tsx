import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
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
import {
  ideaLabDashboardPath,
  ideaLabIdeasNewPath,
  ideaLabRegisterPath,
  isIdeaLabRegisterRoute,
} from "@/lib/ideaLab/constants";
import { useIdeaLabQuota } from "@/hooks/useIdeaLabQuota";

type Props = {
  className?: string;
};

function scrollToSignup() {
  document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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

/** Меню аккаунта только внутри Idea Lab — без мастерской и админки. */
export function IdeaLabAccountChip({ className }: Props) {
  const { user, loading } = useAuth();
  const { canCreateMore } = useIdeaLabQuota();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onRegisterLanding = isIdeaLabRegisterRoute(pathname);

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

    const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate(ideaLabRegisterPath(), { replace: true });
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-500/25 bg-card/90 p-0.5 pl-0.5 pr-1 dark:bg-[hsl(220_24%_10%/0.8)]",
              "hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
              className,
            )}
            aria-label="Меню аккаунта"
          >
            <Avatar className="h-8 w-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-amber-500/15 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
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
          <DropdownMenuItem asChild>
            <Link to={ideaLabDashboardPath()} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Мои идеи
            </Link>
          </DropdownMenuItem>
          {canCreateMore ? (
            <DropdownMenuItem asChild>
              <Link to={ideaLabIdeasNewPath()} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Новая идея
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground opacity-80">
              <Plus className="mr-2 h-4 w-4" />
              Новая идея (лимит)
            </DropdownMenuItem>
          )}
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

  if (onRegisterLanding) {
    return (
      <button
        type="button"
        onClick={scrollToSignup}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-card px-3 py-1.5 text-xs font-semibold text-foreground",
          "shadow-sm hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors",
          className,
        )}
      >
        <LogIn className="h-3.5 w-3.5 text-amber-600" />
        Войти
      </button>
    );
  }

  return (
    <Link
      to={ideaLabRegisterPath()}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-card px-3 py-1.5 text-xs font-semibold text-foreground",
        "shadow-sm hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors",
        className,
      )}
    >
      <LogIn className="h-3.5 w-3.5 text-amber-600" />
      <span className="hidden sm:inline">Войти</span>
    </Link>
  );
}
