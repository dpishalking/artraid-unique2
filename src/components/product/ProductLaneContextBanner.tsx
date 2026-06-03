import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  /** Если передан — показываем режим мастерской проекта (память + контекст). */
  projectId?: string | null;
  className?: string;
};

/** Поясняет пользователю разницу «демо вход» vs «работа из мастерской проекта». */
export function ProductLaneContextBanner({ projectId, className }: Props) {
  const { user } = useAuth();

  if (projectId) {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">Мастерская проекта:</span>{" "}
        генерация учитывает карточку проекта и{" "}
        <Link to={`/projects/${projectId}/memory`} className="text-primary underline-offset-4 hover:underline">
          память проекта
        </Link>
        . Новые инсайты по ходу смогут дополнять память — контур единый.
      </div>
    );
  }

  if (user) {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <span className="font-medium text-foreground">Вы в аккаунте:</span> чтобы оффер шёл в контекст и память
        проекта,{" "}
        <Link to="/cabinet" className="text-primary underline-offset-4 hover:underline">
          выберите или создайте проект
        </Link>
        .
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium text-foreground">Демо-режим:</span> результат не привязан к мастерской проекта
      (без памяти и единого контура маркетинга). Чтобы офферы, прототипы и аудиты опирались на ваш контекст и
      складывались в одну систему —{" "}
      <Link to="/quiz" className="text-primary underline-offset-4 hover:underline">
        настройте мастерскую проекта через квиз
      </Link>
      {" · "}
      <Link to="/cabinet" className="text-primary underline-offset-4 hover:underline">
        мои проекты
      </Link>
      .
    </div>
  );
}
