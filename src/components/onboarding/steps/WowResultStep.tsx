import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/projects/types";
import { getQuickWinScenario } from "@/lib/onboarding/recommendScenario";
import type { QuickWinScenarioId } from "@/lib/onboarding/types";

type Props = {
  project: Project;
  scenarioId: QuickWinScenarioId;
  usedContextLines: string[];
  hasActivity: boolean;
  onContinue: () => void;
};

export function OnboardingWowResultStep({
  project,
  scenarioId,
  usedContextLines,
  hasActivity,
  onContinue,
}: Props) {
  const scenario = getQuickWinScenario(scenarioId);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <motion.div className="rounded-2xl border border-primary/25 bg-card p-6 space-y-4">
        <p className="text-sm font-medium text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Вау-генерация
        </p>
        <h1 className="font-display text-2xl font-bold">
          {hasActivity ? "Первый результат на пути" : "Готовы к первому результату"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasActivity
            ? `Вы запустили «${scenario.title}». Результат сохранится в истории проекта.`
            : `После «${scenario.title}» здесь появится краткий разбор и готовые формулировки.`}
        </p>

        <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">Мы используем:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {usedContextLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {!hasActivity && (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">После генерации вы увидите:</p>
            <ul className="space-y-1">
              <li>· краткий диагноз</li>
              <li>· 3 главные проблемы</li>
              <li>· 3 быстрых улучшения</li>
              <li>· 1 готовый вариант для копирования</li>
            </ul>
          </div>
        )}
      </motion.div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" asChild>
          <Link to={`/offer-generator?projectId=${project.id}`}>Создать 5 офферов</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/prototype?projectId=${project.id}`}>Сделать прототип лендинга</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={scenario.path(project.id)}>Усилить результат</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/projects/${project.id}`}>Сохранить в проект</Link>
        </Button>
      </div>

      <Button className="w-full bg-gradient-money text-primary-foreground" onClick={onContinue}>
        К маршруту усиления
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  );
}
