import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLastProjectId } from "@/lib/navigation/lastProject";

/** Legacy URL — перенаправляем в прототипы последнего проекта или в список проектов. */
export default function MyPrototypes() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) nav("/auth?next=/cabinet", { replace: true });
  }, [user, authLoading, nav]);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const lastProjectId = getLastProjectId();
  if (lastProjectId) {
    return <Navigate to={`/projects/${lastProjectId}/prototypes`} replace />;
  }

  return <Navigate to="/cabinet" replace />;
}
