import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ideaLabRegisterPath } from "@/lib/ideaLab/constants";

type Props = {
  children: React.ReactNode;
};

export function IdeaLabAuthGuard({ children }: Props) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const next = `${pathname}${search}`;
    return (
      <Navigate
        to={`${ideaLabRegisterPath()}?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
