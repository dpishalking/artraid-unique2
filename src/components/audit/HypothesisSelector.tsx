import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, FlaskConical, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { createHypothesis } from "@/lib/hypotheses/api";

type RoadmapItem = {
  action: string;
  expectedEffect: string;
  problemIndex?: number;
};

type Props = {
  items: RoadmapItem[];
  projectId?: string;
  siteUrl?: string;
  shareId?: string;
};

export function HypothesisSelector({ items, projectId, siteUrl, shareId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const topItems = items.slice(0, 5);

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("Выберите хотя бы одну гипотезу");
      return;
    }

    if (!user) {
      const returnTo = `/auth?next=${encodeURIComponent(
        projectId ? `/projects/${projectId}` : "/cabinet",
      )}`;
      navigate(returnTo);
      return;
    }

    if (!projectId) {
      toast.error("Привяжите аудит к проекту, чтобы сохранить гипотезы");
      return;
    }

    setSaving(true);
    try {
      const chosen = topItems.filter((_, i) => selected.has(i));
      await Promise.all(
        chosen.map((item) =>
          createHypothesis({
            projectId,
            title: item.action,
            expectedImpact: item.expectedEffect,
            whatToChange: item.action,
            sourceType: "audit_roadmap",
            priority: "high",
          }),
        ),
      );
      setSaved(true);
      toast.success(`${chosen.length} гипотез${chosen.length === 1 ? "а" : "ы"} сохранены в проект`);
    } catch {
      toast.error("Не удалось сохранить гипотезы");
    } finally {
      setSaving(false);
    }
  };

  const handleGoToProject = () => {
    if (projectId) navigate(`/projects/${projectId}/hypothesis-lab/backlog`);
  };

  if (topItems.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Лаборатория гипотез
          </p>
        </div>
        <h3 className="font-display text-base font-semibold">
          Отметьте правки, которые будете внедрять
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Через 7 дней напомним зафиксировать результат — так увидите, что реально сработало.
        </p>
      </div>

      <ul className="space-y-2">
        {topItems.map((item, idx) => {
          const active = selected.has(idx);
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => !saved && toggle(idx)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-card/50 hover:border-primary/30",
                  saved && "cursor-default opacity-70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{item.action}</p>
                  {item.expectedEffect && (
                    <p className="text-xs text-money mt-0.5">Ожидаемый эффект: {item.expectedEffect}</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!saved ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || selected.size === 0}
            className="bg-gradient-money shadow-glow text-primary-foreground"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : !user ? (
              <Lock className="mr-2 h-4 w-4" />
            ) : (
              <FlaskConical className="mr-2 h-4 w-4" />
            )}
            {!user
              ? "Войдите, чтобы отслеживать"
              : !projectId
                ? "Привяжите к проекту"
                : `Отслеживать ${selected.size > 0 ? selected.size : ""} правк${selected.size === 1 ? "у" : "и"}`}
          </Button>
          {selected.size === 0 && (
            <p className="text-xs text-muted-foreground">Выберите хотя бы одну правку выше</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-money font-medium">
            <Check className="h-4 w-4" />
            Гипотезы в работе — следите в лаборатории
          </div>
          {projectId && (
            <Button variant="outline" size="sm" onClick={handleGoToProject}>
              В лабораторию <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
