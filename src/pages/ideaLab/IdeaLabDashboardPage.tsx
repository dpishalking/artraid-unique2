import { Link } from "react-router-dom";
import { ArrowRight, Crown, Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ideaSummaryFromProject } from "@/lib/ideaLab/ideaProjects";
import { IDEA_LAB_MESSAGE_LIMIT, ideaLabIdeasNewPath } from "@/lib/ideaLab/constants";
import { ideaLabSessionPath } from "@/lib/navigation/ideaLabUrls";
import { clarityLabel } from "@/lib/ideaLab/clarity";
import { IDEA_LAB_STAGES } from "@/lib/ideaLab/stages";
import { IdeaLabServiceGuide } from "@/components/ideaLab/IdeaLabServiceGuide";
import { IdeaLabProgress } from "@/components/ideaLab/IdeaLabProgress";
import { IdeaLabMoreIdeasLocked } from "@/components/ideaLab/IdeaLabMoreIdeasLocked";
import { useIdeaLabQuota } from "@/hooks/useIdeaLabQuota";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

function stageTitle(id: string): string {
  return IDEA_LAB_STAGES.find((s) => s.id === id)?.title ?? id;
}

export default function IdeaLabDashboardPage() {
  const { ideas, loading, error, canCreateMore, atIdeaLimit, isAdmin } = useIdeaLabQuota();

  return (
    <div className="container relative mx-auto max-w-6xl flex-1 px-4 py-10 md:px-8 md:py-14">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className={il.label}>
            <Crown className="mr-1.5 inline h-3 w-3 -mt-0.5" />
            {isAdmin ? "Полный доступ" : "Закрытый кабинет"}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            <span className={il.goldText}>Ваши идеи</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground/90">
            {isAdmin ? (
              <>
                Без лимита на число идей — каждая со своим диалогом (до{" "}
                {IDEA_LAB_MESSAGE_LIMIT} сообщений на идею).
              </>
            ) : (
              <>
                Одна активная идея на аккаунт. До {IDEA_LAB_MESSAGE_LIMIT} сообщений в диалоге —
                с фокусом на кристальную ясность продукта.
              </>
            )}
          </p>
        </div>
        {canCreateMore ? (
          <Button asChild className={cn("shrink-0 h-11 px-6", il.btnPrimary)}>
            <Link to={ideaLabIdeasNewPath()}>
              <Plus className="mr-2 h-4 w-4" />
              Новая идея
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            className={cn("shrink-0 h-11 px-6 opacity-60", il.btnGhost)}
            title="На вашем уровне доступа доступна одна идея"
          >
            <Plus className="mr-2 h-4 w-4" />
            Новая идея
          </Button>
        )}
      </header>

      <div className={cn("mb-8", il.divider)} />

      <IdeaLabServiceGuide defaultOpen={false} className="mb-8" />

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500/60" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && ideas.length === 0 && (
        <div className={cn(il.glass, "px-6 py-16 text-center")}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
            <Lightbulb className="h-7 w-7 text-amber-400" />
          </div>
          <p className="font-display text-lg font-semibold text-foreground">Портфель пуст</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Создайте первую идею — выберите наставника и начните приватный диалог.
          </p>
          <Button asChild className={cn("mt-8", il.btnPrimary)}>
            <Link to={ideaLabIdeasNewPath()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Создать первую идею
            </Link>
          </Button>
        </div>
      )}

      {!loading && !error && ideas.length > 0 && (
        <div
          className={cn(
            "grid gap-6",
            atIdeaLimit ? "lg:grid-cols-[1fr_minmax(260px,320px)] lg:items-start" : "sm:grid-cols-2",
          )}
        >
          <div
            className={cn(
              "grid gap-5",
              atIdeaLimit ? "grid-cols-1 max-w-xl" : "sm:grid-cols-2",
              !atIdeaLimit && ideas.length === 1 && "sm:grid-cols-1 max-w-xl",
            )}
          >
            {ideas.map((p) => {
              const { clarity, userMessages, stage } = ideaSummaryFromProject(p);
              const atMsgLimit = userMessages >= IDEA_LAB_MESSAGE_LIMIT;
              const msgPct = (userMessages / IDEA_LAB_MESSAGE_LIMIT) * 100;

              return (
                <article key={p.id} className={cn(il.card, "flex flex-col p-5 md:p-6")}>
                  {atIdeaLimit && (
                    <p className="relative z-[1] mb-3 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                      Активная идея
                    </p>
                  )}
                  <div className="relative z-[1] flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
                      {p.name}
                    </h2>
                    <span className={il.badgeClarity}>{clarity}%</span>
                  </div>
                  <p className="relative z-[1] mt-2 text-xs text-muted-foreground/90">
                    {clarityLabel(clarity)}
                    <span className="mx-1.5 text-amber-500/40">·</span>
                    {stageTitle(stage)}
                  </p>

                  <div className="relative z-[1] mt-5 space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/80">
                      <span>Диалог</span>
                      <span className={cn(atMsgLimit && "font-medium text-amber-400")}>
                        {userMessages}/{IDEA_LAB_MESSAGE_LIMIT}
                      </span>
                    </div>
                    <IdeaLabProgress value={msgPct} />
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className={cn(
                      "relative z-[1] mt-6 h-10 w-full",
                      atMsgLimit ? il.btnGhost : il.btnPrimary,
                    )}
                  >
                    <Link to={ideaLabSessionPath(p.id)}>
                      {atMsgLimit ? "Открыть карточку" : "Продолжить диалог"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>

          {atIdeaLimit && <IdeaLabMoreIdeasLocked className="lg:sticky lg:top-20" />}
        </div>
      )}
    </div>
  );
}
