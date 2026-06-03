import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/lib/admin/routes";

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-4 py-5 border-b border-border">
        <Link to="/admin/dashboard" className="font-display font-bold text-lg tracking-tight">
          Admin
        </Link>
        <p className="text-[11px] text-muted-foreground mt-0.5">Pishalking</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {ADMIN_NAV.map(({ to, label, icon: Icon, disabled }) => (
          <Link
            key={to}
            to={disabled ? "#" : to}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              disabled && "opacity-40 pointer-events-none",
              pathname.startsWith(to)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
