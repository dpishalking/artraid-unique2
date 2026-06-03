import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workshopToolUrl } from "@/lib/navigation/ideaLabUrls";
import { isIdeaLabStandalone } from "@/lib/ideaLab/constants";

type Props = {
  projectId: string;
  onSyncAndFinish?: () => void;
  syncing?: boolean;
};

const WORKSHOP_ACTIONS = [
  {
    label: "Написать тексты в генераторе",
    href: (id: string) => workshopToolUrl("/offer-generator", id),
  },
  {
    label: "Собрать первый экран",
    href: (id: string) =>
      workshopToolUrl("/offer-generator", id, { purpose: "landing_hero" }),
  },
  {
    label: "Создать лендинг",
    href: (id: string) => workshopToolUrl("/prototype", id),
  },
  {
    label: "Подготовить пост",
    href: (id: string) => workshopToolUrl("/offer-generator", id, { purpose: "post" }),
  },
];

/** Следующие шаги — только на мастерской; в standalone Idea Lab не показываем. */
export function SuggestedNextActions({ projectId, onSyncAndFinish, syncing }: Props) {
  if (isIdeaLabStandalone()) {
    if (!onSyncAndFinish) return null;
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
        <p className="text-sm font-medium">Идея прояснена</p>
        <p className="text-xs text-muted-foreground">
          Карточка с ясным пониманием продукта сохранена. Продолжайте диалог или создайте новую идею из дашборда.
        </p>
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white"
          onClick={onSyncAndFinish}
          disabled={syncing}
        >
          {syncing ? "Сохраняем…" : "Сохранить карточку идеи"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-medium">Следующие действия в мастерской</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {WORKSHOP_ACTIONS.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            className="h-auto justify-between py-2.5"
            asChild
          >
            <a href={a.href(projectId)}>
              {a.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        ))}
      </div>
      {onSyncAndFinish && (
        <Button
          className="w-full bg-gradient-money text-primary-foreground"
          onClick={onSyncAndFinish}
          disabled={syncing}
        >
          {syncing ? "Сохраняем…" : "Сохранить и открыть мастерскую проекта"}
        </Button>
      )}
    </div>
  );
}
