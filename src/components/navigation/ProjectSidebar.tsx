import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Brain,
  ClipboardList,
  FileBox,
  FileText,
  FlaskConical,
  FolderOpen,
  Layers,
  LayoutDashboard,
  LineChart,
  Gauge,
  Map,
  Megaphone,
  ScanSearch,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { buildProjectNavGroups } from "@/lib/navigation/projectNav";
import { getProjectById } from "@/lib/projects/projectApi";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
};

const ICONS: Record<string, LucideIcon> = {
  home: LayoutDashboard,
  context: ClipboardList,
  "commercial-metrics": Gauge,
  memory: Brain,
  files: FolderOpen,
  audit: ScanSearch,
  "growth-cycle": Wand2,
  predictive: LineChart,
  competitors: Users,
  niche: Map,
  artifacts: FileBox,
  "hypothesis-lab": FlaskConical,
  prototypes: FileText,
  offer: Megaphone,
  prototype: Layers,
  "idea-lab": Wand2,
};

export function ProjectSidebar({ projectId }: Props) {
  const { pathname, search } = useLocation();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [projectGoal, setProjectGoal] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjectById(projectId)
      .then((data) => {
        if (cancelled || !data) return;
        setProjectName(data.project.name ?? null);
        setProjectGoal(data.project.product_description ?? null);
        setWebsiteUrl(data.project.current_website_url ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const groups = buildProjectNavGroups(projectId);

  return (
    <aside className="shrink-0 border-b border-border/80 bg-card md:w-64 md:border-b-0 md:border-r md:sticky md:top-12 md:z-30 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
      <div className="space-y-3 border-b border-border/60 px-4 py-4">
        <Link
          to="/cabinet"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Дашборд
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate font-display text-sm font-semibold text-foreground"
              title={projectName ?? undefined}
            >
              {projectName ?? "Проект"}
            </p>
            {websiteUrl ? (
              <p
                className="truncate text-[10px] text-muted-foreground"
                title={websiteUrl}
              >
                {websiteUrl.replace(/^https?:\/\//, "")}
              </p>
            ) : projectGoal ? (
              <p className="truncate text-[10px] text-muted-foreground" title={projectGoal}>
                {projectGoal}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="p-2 md:p-3 md:space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-0.5">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? FileText;
              const active = item.match(pathname, search);
              const className = cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              );
              if (item.external) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                );
              }
              return (
                <Link key={item.id} to={item.href} className={className}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
