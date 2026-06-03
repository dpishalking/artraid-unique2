import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { onboardingFillLabel, onboardingFillTone } from "@/lib/onboarding/completionLabels";
import type { ProjectCardField } from "@/lib/onboarding/projectCardFields";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  completionPercent: number;
  fields: ProjectCardField[];
  onNext: () => void;
  onBack: () => void;
};

const toneClass: Record<ReturnType<typeof onboardingFillTone>, string> = {
  muted: "text-muted-foreground",
  ok: "text-primary",
  good: "text-primary",
  great: "text-emerald-600 dark:text-emerald-400",
};

export function OnboardingProjectCardStep({
  projectId,
  completionPercent,
  fields,
  onNext,
  onBack,
}: Props) {
  const tone = onboardingFillTone(completionPercent);
  const filled = fields.filter((f) => f.value).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Карточка проекта</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-2">Что система уже знает</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Данные из квиза подставлены автоматически. Пустые поля можно заполнить позже — генерации
          всё равно доступны.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Заполненность проекта</p>
            <p className={cn("text-lg font-semibold mt-1", toneClass[tone])}>
              {onboardingFillLabel(completionPercent)}
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-primary">{completionPercent}%</p>
        </div>
        <Progress value={completionPercent} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Заполнено {filled} из {fields.length} блоков карточки
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <li
            key={field.id}
            className={cn(
              "rounded-xl border p-3 text-sm",
              field.value ? "border-border bg-card/60" : "border-dashed border-border/80 bg-muted/20",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-foreground">{field.label}</span>
              {field.value ? (
                <Check className="h-4 w-4 text-primary shrink-0" />
              ) : (
                field.editPath && (
                  <Link
                    to={
                      field.editPath === "memory"
                        ? `/projects/${projectId}/memory/quick`
                        : `/projects/${projectId}/context`
                    }
                    className="text-primary hover:underline text-xs shrink-0 inline-flex items-center gap-0.5"
                  >
                    <Pencil className="h-3 w-3" />
                    Добавить
                  </Link>
                )
              )}
            </div>
            {field.value ? (
              <p className="mt-1.5 text-muted-foreground line-clamp-2">{field.value}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground italic">
                Добавьте позже — чем больше данных, тем точнее генерации
              </p>
            )}
            {field.fromQuiz && field.value && (
              <span className="mt-2 inline-block text-[10px] uppercase tracking-wide text-primary/80">
                из квиза
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button variant="ghost" onClick={onBack}>
          Назад
        </Button>
        <Button
          className="flex-1 bg-gradient-money text-primary-foreground font-semibold"
          onClick={onNext}
        >
          К первому результату →
        </Button>
      </div>
    </motion.div>
  );
}
