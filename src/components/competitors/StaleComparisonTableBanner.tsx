import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  building: boolean;
  onRebuild: () => void;
};

export function StaleComparisonTableBanner({ projectId, building, onRebuild }: Props) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Таблица в старом формате (15 фреймворков)</p>
            <p className="text-muted-foreground">
              Карта ниши ещё не пересобрана под шаблон разведки из PDF. Нажмите пересборку — появятся 11
              критериев: выручка, продукт, воронка, MarTech и краткое сравнение. Если ячейки пустые —
              заново проанализируйте конкурентов на вкладке{" "}
              <Link to={`/projects/${projectId}/competitors`} className="text-primary underline">
                Конкуренты
              </Link>
              .
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="default"
          className="shrink-0"
          disabled={building}
          onClick={onRebuild}
        >
          {building ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Пересобрать таблицу
        </Button>
      </div>
    </div>
  );
}
