import type { Project, ProjectContext } from "./types";
import type { ProjectActivitySummary } from "./projectApi";
import { growthCycleHref } from "@/lib/growthCycle/routes";

export type NextBestAction = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
};

export type NextBestActionOptions = {
  /** Заполненность памяти проекта (0–100); для онбординга после квиза. */
  memoryCompletionPercent?: number;
  /** Гипотезы проекта — для напоминания зафиксировать результат после 7 дней. */
  selectedHypothesesOlderThan7Days?: number;
  /** Рекомендации из аудита, ещё не выбранные для отслеживания (status=new). */
  pendingHypothesesFromAudit?: number;
};

export function getNextBestAction(
  project: Project,
  context: ProjectContext | null,
  activity?: ProjectActivitySummary,
  opts?: NextBestActionOptions,
): NextBestAction {
  const website = project.current_website_url?.trim() || context?.current_website_url?.trim();

  const memPct = opts?.memoryCompletionPercent;

  // Если есть выбранные гипотезы старше 7 дней — приоритетно напомнить зафиксировать результат.
  if ((opts?.selectedHypothesesOlderThan7Days ?? 0) > 0) {
    return {
      title: "Зафиксируйте результаты гипотез",
      description:
        "Прошло больше 7 дней с момента выбора правок. Отметьте, что внедрили — и посмотрите, что дало результат.",
      ctaLabel: "Цикл внедрения",
      ctaTo: growthCycleHref(project.id),
    };
  }

  if (
    project.quiz_completed &&
    typeof memPct === "number" &&
    memPct < 42
  ) {
    return {
      title: "Закрепите данные из квиза в памяти проекта",
      description:
        "Вы уже указали базу в квизе — добавьте детали в память проекта, чтобы офферы, прототипы и аудиты опирались на полную картину.",
      ctaLabel: "Дозаполнить память",
      ctaTo: `/projects/${project.id}/memory/quick`,
    };
  }

  if (!website) {
    return {
      title: "Добавьте сайт или лендинг",
      description:
        "С URL система сможет анализировать упаковку и находить зоны роста в контексте этого проекта.",
      ctaLabel: "Редактировать проект",
      ctaTo: `/projects/${project.id}/context`,
    };
  }

  if (!activity?.hasAudit) {
    return {
      title: "Проанализируйте сайт",
      description:
        "Аудит сохранится в проект: инсайты, гипотезы и оценка упаковки обновятся автоматически.",
      ctaLabel: "Запустить аудит",
      ctaTo: `/audit?projectId=${project.id}`,
    };
  }

  if ((opts?.pendingHypothesesFromAudit ?? 0) > 0) {
    return {
      title: "Возьмите гипотезы из аудита в работу",
      description:
        "Аудит готов — в лаборатории гипотез откройте «Цикл внедрения» и выберите, что тестировать.",
      ctaLabel: "Цикл внедрения",
      ctaTo: growthCycleHref(project.id),
    };
  }

  if (activity.lastAuditShareId) {
    const reportPath = `/r/${activity.lastAuditShareId}`;
    if (
      !activity.hasPrototype &&
      (project.main_goal === "new_prototype" || project.main_goal === "increase_conversion")
    ) {
      return {
        title: "Создайте прототип на основе аудита",
        description:
          "Конструктор подставит контекст проекта и URL сайта. Прототип будет привязан к этому проекту.",
        ctaLabel: "Открыть конструктор",
        ctaTo: `/prototype?projectId=${project.id}`,
      };
    }
    if (!activity.hasPrototype && project.main_goal === "strengthen_offer") {
      return {
        title: "Сгенерируйте оффер",
        description: "Поля брифа заполнятся из контекста проекта и результатов аудита.",
        ctaLabel: "Генератор офферов",
        ctaTo: `/offer-generator?projectId=${project.id}`,
      };
    }
    if (activity.hasAudit && !activity.hasPrototype) {
      return {
        title: "Посмотрите отчёт аудита",
        description: "Проверьте рекомендации, затем переходите к прототипу или офферу.",
        ctaLabel: "Открыть отчёт",
        ctaTo: reportPath,
      };
    }
  }

  if (project.main_goal === "compare_competitors") {
    return {
      title: "Соберите карту ниши",
      description:
        "Добавьте конкурентов, проанализируйте их сайты — AI соберёт позиционирование и 3 стратегии.",
      ctaLabel: "Открыть конкурентов",
      ctaTo: `/projects/${project.id}/competitors`,
    };
  }

  if (!activity?.hasPrototype) {
    return {
      title: "Создайте прототип лендинга",
      description: "Конструктор использует контекст проекта и привяжет результат к истории.",
      ctaLabel: "Открыть конструктор",
      ctaTo: `/prototype?projectId=${project.id}`,
    };
  }

  return {
    title: "Уточните контекст проекта",
    description: "Обновите карту маркетинга или запустите новый аудит после изменений на сайте.",
    ctaLabel: "Контекст проекта",
    ctaTo: `/projects/${project.id}/context`,
  };
}
