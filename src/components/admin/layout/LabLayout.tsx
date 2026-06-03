import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, FlaskConical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function LabHeader() {
  const { pathname } = useLocation();
  const { email } = useAdminAccess();
  const nav = useNavigate();
  const onProduct = pathname.includes("/admin/lab/products/");
  const onPrototype = pathname.includes("/admin/lab/prototypes/");
  const onPrompts = pathname === "/admin/lab/prompts";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          to="/admin/lab"
          className="flex items-center gap-2 font-display font-semibold text-base shrink-0 hover:opacity-80"
        >
          <FlaskConical className="h-4 w-4 text-primary" />
          Лаборатория
        </Link>
        {(onProduct || onPrototype || onPrompts) && (
          <span className="hidden sm:inline text-muted-foreground/40">/</span>
        )}
        {onPrompts && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">промпты</span>
        )}
        {onProduct && !onPrototype && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">продукт</span>
        )}
        {onPrototype && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate">прототип</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {email && (
          <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[160px] mr-1">
            {email}
          </span>
        )}
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
          <Link to="/admin/dashboard">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Admin
          </Link>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={async () => {
            await supabase.auth.signOut();
            nav("/prototype");
          }}
          aria-label="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export function LabLayout() {
  const { pathname } = useLocation();
  const immersive = pathname.includes("/admin/lab/prototypes/");

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <LabHeader />
      <main
        className={cn(
          "flex-1 overflow-auto w-full",
          immersive ? "px-3 md:px-5 lg:px-6 py-3 md:py-4" : "px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-[1400px] mx-auto",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
