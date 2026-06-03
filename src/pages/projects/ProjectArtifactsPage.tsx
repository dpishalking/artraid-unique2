import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProjectArtifactsHub } from "@/components/projects/ProjectArtifactsHub";
import { getProjectById } from "@/lib/projects/projectApi";
import { getProjectMemoryRow } from "@/lib/projectMemory/api";

export default function ProjectArtifactsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string>();
  const [memoryPercent, setMemoryPercent] = useState<number>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([getProjectById(projectId), getProjectMemoryRow(projectId)])
      .then(([data, mem]) => {
        setProjectName(data?.project.name);
        setMemoryPercent(mem?.completion_percent ?? 0);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ProjectArtifactsHub
      projectId={projectId}
      projectName={projectName}
      memoryPercent={memoryPercent}
      preview
    />
  );
}
