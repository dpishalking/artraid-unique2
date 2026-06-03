import { Link, useLocation } from "react-router-dom";
import { LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminTitle } from "@/lib/admin/routes";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function AdminHeader() {
  const { pathname } = useLocation();
  const { email, role } = useAdminAccess();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 py-3">
      <h1 className="font-display text-lg font-semibold truncate">{adminTitle(pathname)}</h1>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">
          {email}
          {role ? ` · ${role}` : ""}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/prototype">
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">В сервис</span>
          </Link>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
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
