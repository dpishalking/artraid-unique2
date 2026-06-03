import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredScreen } from "@/components/navigation/AuthRequiredScreen";

export function ProjectRouteGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequiredScreen
        title="Войдите, чтобы открыть проекты"
        description="Мастерская проекта, память маркетинга и связка аудита с оффером доступны после входа. Мы вернём вас сюда сразу после авторизации."
      />
    );
  }

  return <Outlet />;
}
