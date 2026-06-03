import { Link } from "react-router-dom";
import {
  ScanSearch,
  Megaphone,
  Users,
  Map,
  Activity,
  Layers,
  Lightbulb,
  History,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionItem = {
  icon: typeof ScanSearch;
  title: string;
  desc: string;
  to?: (id: string) => string;
  comingSoon?: boolean;
};

const ACTIONS: ActionItem[] = [
  {
    icon: ScanSearch,
    title: "Анализ сайта",
    desc: "Найти слабые места упаковки",
    to: (id) => `/audit?projectId=${id}`,
  },
  {
    icon: Megaphone,
    title: "Генератор офферов",
    desc: "Создать варианты оффера",
    to: (id) => `/offer-generator?projectId=${id}`,
  },
  {
    icon: Layers,
    title: "Прототип лендинга",
    desc: "19 смысловых блоков",
    to: (id) => `/prototype?projectId=${id}`,
  },
  {
    icon: Users,
    title: "Конкуренты",
    desc: "Добавить и проанализировать сайты",
    to: (id) => `/projects/${id}/competitors`,
  },
  {
    icon: Activity,
    title: "Предиктивная модель",
    desc: "План-факт, run rate, forecast, светофор",
    to: (id) => `/projects/${id}/predictive`,
  },
  {
    icon: Map,
    title: "Карта ниши",
    desc: "Сравнение и стратегии позиционирования",
    to: (id) => `/projects/${id}/competitors/compare`,
  },
  {
    icon: FolderOpen,
    title: "Файлы проекта",
    desc: "Документы в контексте AI при запусках",
    to: (id) => `/projects/${id}/files`,
  },
  {
    icon: Lightbulb,
    title: "Гипотезы",
    desc: "Банк идей",
    comingSoon: true,
  },
  {
    icon: History,
    title: "История",
    desc: "Недавняя активность на обзоре",
    to: (id) => `/projects/${id}#recent-activity`,
  },
];

function ActionContent({
  icon: Icon,
  title,
  desc,
  comingSoon,
}: Pick<ActionItem, "icon" | "title" | "desc" | "comingSoon">) {
  return (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
          comingSoon && "opacity-50",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm flex items-center gap-2 flex-wrap">
          {title}
          {comingSoon && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Скоро
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </>
  );
}

export function ProjectQuickActions({ projectId }: { projectId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Инструменты мастерской</CardTitle>
        <CardDescription>Запускаются в контексте этого проекта и памяти — не демо-режим.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          if (action.comingSoon || !action.to) {
            return (
              <div
                key={action.title}
                className="flex gap-3 rounded-xl border border-dashed border-border p-4 opacity-60 cursor-not-allowed"
              >
                <ActionContent {...action} />
              </div>
            );
          }
          return (
            <Link
              key={action.title}
              to={action.to(projectId)}
              className="flex gap-3 rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <ActionContent {...action} />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
