import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IdeaLabRolePicker } from "@/components/ideaLab/IdeaLabRolePicker";
import { IdeaLabRoleDetailPanel } from "@/components/ideaLab/IdeaLabRoleDetailPanel";
import { IdeaLabServiceGuide } from "@/components/ideaLab/IdeaLabServiceGuide";
import { IdeaLabMoreIdeasLocked } from "@/components/ideaLab/IdeaLabMoreIdeasLocked";
import { QUIZ_SITUATION_OPTIONS } from "@/lib/quiz/constants";
import { createProject } from "@/lib/projects/projectApi";
import { buildFreshIdeaLabState } from "@/lib/ideaLab/session";
import { saveIdeaLabState } from "@/lib/ideaLab/api";
import { ideaLabSessionPath } from "@/lib/navigation/ideaLabUrls";
import { ideaLabDashboardPath } from "@/lib/ideaLab/constants";
import type { IdeaLabCoachRole } from "@/lib/ideaLab/types";
import { useIdeaLabQuota } from "@/hooks/useIdeaLabQuota";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

export default function IdeaLabNewIdeaPage() {
  const nav = useNavigate();
  const { loading, canCreateMore, atIdeaLimit, ideas } = useIdeaLabQuota();
  const [entryMode, setEntryMode] = useState<"has_idea" | "find_idea" | null>(null);
  const [entryRole, setEntryRole] = useState<IdeaLabCoachRole>("coach");
  const [creating, setCreating] = useState(false);

  const handleStart = async () => {
    if (!entryMode || !canCreateMore) return;
    setCreating(true);
    try {
      const { project } = await createProject({
        name: entryMode === "has_idea" ? "Моя идея" : "Поиск идеи",
        product_description: "Идея уточняется в диалоге с наставником Idea Lab",
        target_audience: "Уточним в диалоге",
        main_goal: "increase_conversion",
        startup_mode: entryMode,
      });
      const lab = buildFreshIdeaLabState(entryMode, entryRole);
      await saveIdeaLabState(project.id, lab);
      nav(ideaLabSessionPath(project.id), { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать идею");
      setCreating(false);
    }
  };

  if (!loading && atIdeaLimit && ideas[0]) {
    return <Navigate to={ideaLabDashboardPath()} replace />;
  }

  if (!loading && !canCreateMore) {
    return (
      <div className="container relative mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-10 md:px-8 md:py-14">
        <Link
          to={ideaLabDashboardPath()}
          className="text-xs uppercase tracking-widest text-amber-500/70 hover:text-amber-400 transition-colors"
        >
          ← К портфелю идей
        </Link>
        <IdeaLabMoreIdeasLocked />
      </div>
    );
  }

  return (
    <div className="container relative mx-auto flex max-w-2xl flex-1 flex-col justify-center px-4 py-10 md:px-8 md:py-14">
      <Link
        to={ideaLabDashboardPath()}
        className="mb-8 text-xs uppercase tracking-widest text-amber-500/70 hover:text-amber-400 transition-colors"
      >
        ← К портфелю идей
      </Link>

      <p className={il.label}>Новая сессия</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
        <span className={il.goldText}>Новая идея</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Прочитайте, как устроен сервис, выберите роль наставника и ситуацию — затем откроется диалог.
      </p>

      <div className="mt-6">
        <IdeaLabServiceGuide defaultOpen />
      </div>

      <div className="mt-6">
        <IdeaLabRolePicker
          value={entryRole}
          onChange={setEntryRole}
          hint="Роль можно сменить в диалоге позже — история при смене обнулится."
        />
        <IdeaLabRoleDetailPanel role={entryRole} className="mt-4" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {QUIZ_SITUATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={creating || loading}
            onClick={() => setEntryMode(opt.value)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all duration-300",
              entryMode === opt.value
                ? "border-amber-500/45 bg-gradient-to-br from-amber-500/15 to-transparent ring-1 ring-amber-500/25 shadow-[0_0_20px_-8px_hsl(43_90%_50%/0.3)]"
                : "border-amber-500/10 bg-[hsl(220_24%_9%/0.5)] hover:border-amber-500/35",
            )}
          >
            <p className="text-sm font-medium">{opt.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>

      <Button
        className={cn("mt-8 h-11 w-full", il.btnPrimary)}
        disabled={!entryMode || creating || loading}
        onClick={() => void handleStart()}
      >
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Начать диалог
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
