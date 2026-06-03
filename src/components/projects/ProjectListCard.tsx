import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects/types";
import { mainGoalLabel } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/…$/u, "")
    .replace(/\s+/g, " ");
}

function isDuplicateText(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return longer.startsWith(shorter);
}

function getProjectCardPresentation(project: Project): {
  headline: string | null;
  summary: string | null;
  audience: string | null;
} {
  const productName = project.product_name?.trim() ?? "";
  const name = project.name.trim();
  const description = project.product_description?.trim() ?? "";
  const audience = project.target_audience?.trim() ?? "";
  const firstSentence = description.split(/[.!?\n]/)[0]?.trim() ?? "";

  if (productName && description && !isDuplicateText(productName, description)) {
    return { headline: productName, summary: description, audience: audience || null };
  }

  if (description && (isDuplicateText(name, description) || isDuplicateText(name, firstSentence))) {
    return { headline: null, summary: description, audience: audience || null };
  }

  if (name && description && !isDuplicateText(name, description)) {
    return { headline: name, summary: description, audience: audience || null };
  }

  if (description) {
    return { headline: null, summary: description, audience: audience || null };
  }

  return {
    headline: productName || name || null,
    summary: null,
    audience: audience || null,
  };
}

function scoreTone(score: number): string {
  if (score >= 70) return "border-primary/40 bg-primary/15 text-primary";
  if (score >= 40) return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "border-border bg-muted/50 text-muted-foreground";
}

type Props = {
  project: Project;
  onDelete: () => void;
};

export function ProjectListCard({ project: p, onDelete }: Props) {
  const site = p.current_website_url?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const { headline, summary, audience } = getProjectCardPresentation(p);
  const goal = mainGoalLabel(p.main_goal);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card",
        "cursor-pointer transition-all duration-200",
        "hover:-translate-y-1 hover:border-primary/50 hover:bg-gradient-to-br hover:from-card hover:to-primary/[0.04]",
        "hover:shadow-[0_16px_48px_-20px_hsl(var(--primary)/0.55)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-money opacity-60 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      <Link
        to={`/projects/${p.id}`}
        className="block p-5 pr-14 md:p-6 md:pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge variant="secondary" className="max-w-full truncate font-normal">
            {goal}
          </Badge>
          {p.packaging_score != null && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 font-mono tabular-nums text-xs px-2 py-0.5",
                scoreTone(p.packaging_score),
              )}
            >
              Упаковка {p.packaging_score}/100
            </Badge>
          )}
        </div>

        <div className="space-y-2.5">
          {headline ? (
            <h3 className="font-display text-xl font-bold leading-snug tracking-tight line-clamp-1 transition-colors group-hover:text-primary">
              {headline}
            </h3>
          ) : null}

          {summary ? (
            <p
              className={cn(
                "leading-relaxed text-muted-foreground",
                headline ? "text-sm line-clamp-2" : "text-base font-medium text-foreground/90 line-clamp-3",
              )}
            >
              {summary}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/70">Описание пока не заполнено</p>
          )}

          {audience ? (
            <p className="text-sm leading-snug text-muted-foreground line-clamp-1">
              <span className="text-muted-foreground/65">Для кого: </span>
              {audience}
            </p>
          ) : null}

          {site ? (
            <span className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">{site}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
          <p className="text-[11px] text-muted-foreground">
            Активность{" "}
            {new Date(p.last_activity_at).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
            })}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10",
              "px-3 py-1.5 text-sm font-semibold text-primary",
              "transition-all group-hover:border-primary/45 group-hover:bg-primary/15",
            )}
          >
            Открыть проект
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
        aria-label={`Удалить проект ${p.name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </article>
  );
}
