import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { HypothesisLabProvider } from "@/components/hypotheses/HypothesisLabProvider";
import { HypothesisLabShell } from "@/components/hypotheses/HypothesisLabShell";
import { getProjectActivitySummary, getProjectById } from "@/lib/projects/projectApi";

export default function ProjectHypothesisLabPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>();
  const [domain, setDomain] = useState<string>();
  const [hasAudit, setHasAudit] = useState(false);
  const [reportShareId, setReportShareId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([getProjectById(projectId), getProjectActivitySummary(projectId)])
      .then(([data, activity]) => {
        setProjectName(data?.project.name);
        setDomain(data?.project.current_website_url?.replace(/^https?:\/\//, "") ?? undefined);
        setHasAudit(activity.hasAudit);
        setReportShareId(activity.lastAuditShareId);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return null;

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <HypothesisLabProvider
      projectId={projectId}
      projectName={projectName}
      domain={domain}
      hasAudit={hasAudit}
      reportShareId={reportShareId}
    >
      <HypothesisLabShell />
    </HypothesisLabProvider>
  );
}
