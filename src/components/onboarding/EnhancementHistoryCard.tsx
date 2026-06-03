import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectEvent } from "@/lib/projects/types";

const ENHANCEMENT_TYPES = new Set([
  "audit_completed",
  "prototype_created",
  "onboarding_progress",
  "quiz_completed",
  "project_memory_updated_from_quiz",
]);

type Props = {
  projectId: string;
  events: ProjectEvent[];
};

export function EnhancementHistoryCard({ projectId, events }: Props) {
  const items = events.filter((e) => ENHANCEMENT_TYPES.has(e.event_type));

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg">История проекта</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Офферы, анализы, прототипы и шаги настройки — всё в одной ленте.
          </p>
        </div>
        <Link
          to={`/projects/${projectId}/onboarding?step=first_steps`}
          className="text-xs text-primary hover:underline shrink-0 mt-1"
        >
          Маршрут усиления →
        </Link>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((ev) => {
          const meta = ev.metadata as { share_path?: string } | null;
          const link =
            ev.event_type === "audit_completed" && meta?.share_path
              ? meta.share_path
              : ev.event_type === "prototype_created" && ev.entity_id
                ? `/p/${ev.entity_id}`
                : null;
          return (
            <div
              key={ev.id}
              className="flex items-center justify-between gap-3 text-sm border-b border-border/40 pb-2 last:border-0"
            >
              {link ? (
                <Link to={link} className="text-primary hover:underline truncate">
                  {ev.title}
                </Link>
              ) : (
                <span className="truncate">{ev.title}</span>
              )}
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {new Date(ev.created_at).toLocaleString("ru-RU")}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
