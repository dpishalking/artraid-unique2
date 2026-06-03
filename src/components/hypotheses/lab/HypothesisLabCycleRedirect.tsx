import { Navigate, useParams } from "react-router-dom";
import { growthCycleProjectPath } from "@/lib/growthCycle/routes";

/** Старый путь лаборатории → отдельная воронка. */
export function HypothesisLabCycleRedirect() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <Navigate to="/cabinet" replace />;
  return <Navigate to={growthCycleProjectPath(projectId)} replace />;
}
