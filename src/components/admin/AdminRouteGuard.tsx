import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { AccessDenied } from "@/components/admin/AccessDenied";

export function AdminRouteGuard() {
  const { loading, isAdmin, user } = useAdminAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?next=/admin/dashboard" replace />;
  if (!isAdmin) return <AccessDenied />;

  return <Outlet />;
}
