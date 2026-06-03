import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { ProjectBriefWizard } from "@/components/projects/ProjectBriefWizard";

export default function ProjectCreatePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FlowPageHeader hideExit title="Создать проект" />
      <ProjectBriefWizard variant="page" />
    </div>
  );
}
