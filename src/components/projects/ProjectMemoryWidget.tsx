import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";
import {
  BADGE_LABEL_RU,
  LEVEL_HINT_RU,
  LEVEL_TITLE_RU,
  topStrongSections,
  weakestSections,
} from "@/lib/projectMemory/completion";
import { MEMORY_SECTION_NAV } from "@/lib/projectMemory/sectionsNav";
import type { MemoryCompletionLevelSlug } from "@/lib/projectMemory/types";

function sectionTitle(id: keyof ProjectMemorySections): string {
  return MEMORY_SECTION_NAV.find((x) => x.id === String(id))?.title ?? String(id);
}

type Props = {
  projectId: string;
  completionPercent: number;
  levelSlug: MemoryCompletionLevelSlug | string;
  snapshot: ProjectMemorySections;
  badges: string[];
  nextHints: string[];
  /** Проект создан через квиз — показываем связь данных. */
  quizBaseline?: boolean;
};

export function ProjectMemoryWidget({
  projectId,
  completionPercent,
  levelSlug,
  snapshot,
  badges,
  nextHints,
  quizBaseline,
}: Props) {
  const slug = typeof levelSlug === "string" && levelSlug in LEVEL_TITLE_RU
    ? (levelSlug as MemoryCompletionLevelSlug)
    : "empty";
  const strong = topStrongSections(snapshot);
  const weak = weakestSections(snapshot);
  const follow = nextHints.slice(0, 2)[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-display tracking-tight">Память проекта</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Заполните данные один раз — сервис будет использовать их во всех анализах, офферах и прототипах.
            </p>
          </div>
          <Badge variant={completionPercent >= 70 ? "default" : "secondary"}>{completionPercent}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Память проекта заполнена</span>
            <span>{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>
        {quizBaseline ? (
          <p className="text-xs text-muted-foreground rounded-md bg-muted/40 border border-border/60 px-3 py-2">
            <span className="font-medium text-foreground">После квиза:</span> базовые ответы сохранены в памяти
            проекта. Разделы ниже можно расширить — тогда генерации станут точнее.
          </p>
        ) : null}
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Уровень</div>
          <div className="font-medium">{LEVEL_TITLE_RU[slug]}</div>
          <p className="text-xs text-muted-foreground mt-1">{LEVEL_HINT_RU[slug]}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium mb-1">Заполнено сильнее</div>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              {(strong.length ? strong : []).map((k) => (
                <li key={String(k)}>{sectionTitle(k)}</li>
              ))}
              {!strong.length && <li>Покажем разделы, когда будет больше данных</li>}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Стоит добавить</div>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              {(weak.length ? weak : []).map((k) => (
                <li key={`w-${String(k)}`}>{sectionTitle(k)}</li>
              ))}
              {!weak.length && <li>Отличное заполнение — можно расширить детали</li>}
            </ul>
          </div>
        </div>

        {follow && (
          <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2 text-xs">
            <span className="font-medium mr-1">Следующий шаг:</span>
            {follow}
          </div>
        )}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.slice(0, 8).map((b) => (
              <Badge key={b} variant="outline">
                {BADGE_LABEL_RU[b] ?? b}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="default" size="sm" className="w-full sm:flex-1">
            <Link to={`/projects/${projectId}/memory`}>Редактировать память проекта</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:flex-1">
            <Link to={`/projects/${projectId}/memory/quick`}>Дозаполнить</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
