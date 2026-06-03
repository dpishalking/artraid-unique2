import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUIZ_SITUATION_OPTIONS } from "@/lib/quiz/constants";
import { useAuth } from "@/hooks/useAuth";
import { IdeaLabRolesOverview } from "@/components/ideaLab/IdeaLabRoleDetailPanel";
import { IdeaLabServiceGuide } from "@/components/ideaLab/IdeaLabServiceGuide";
import { ideaLabRegisterPath } from "@/lib/ideaLab/constants";

export default function IdeaLabHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-1 flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      <div className="container mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-12 md:py-16">
        <Badge className="mb-4 w-fit border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          Отдельный сервис · только идея
        </Badge>

        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Найдите и проясните идею{" "}
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            до кристальной ясности
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Диалог с AI-наставником в одной из трёх ролей: коуч собирает идею вопросами, инвестор
          проверяет как питч, разборщик ищет слабые места. Карточка прояснения растёт по ходу
          беседы.
        </p>

        <div className="mt-6 max-w-xl">
          <IdeaLabServiceGuide defaultOpen={false} />
        </div>

        <div className="mt-6 max-w-xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Роли наставника
          </p>
          <IdeaLabRolesOverview />
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {QUIZ_SITUATION_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              to={`/lab?mode=${opt.value}`}
              className="group rounded-2xl border border-border/80 bg-card/80 p-4 transition-all hover:border-amber-500/50 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-foreground">{opt.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                Начать
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <Link to={ideaLabRegisterPath()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Начать в Idea Lab
            </Link>
          </Button>
          {!user ? (
            <Button asChild variant="outline" size="lg">
              <Link to={ideaLabRegisterPath()}>
                <LogIn className="mr-2 h-4 w-4" />
                Войти
              </Link>
            </Button>
          ) : null}
        </div>

      </div>
    </div>
  );
}
