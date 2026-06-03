import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTE_STEPS_META } from "@/lib/onboarding/constants";
import type { OnboardingRouteStepId, RouteStepStatus } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  routeSteps: Partial<Record<OnboardingRouteStepId, RouteStepStatus>>;
  onFinish: () => void;
};

function StatusIcon({ status }: { status: RouteStepStatus | undefined }) {
  if (status === "done") return <Check className="h-5 w-5 text-primary" />;
  if (status === "in_progress") return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

export function OnboardingFirstStepsStep({ projectId, routeSteps, onFinish }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Маршрут усиления</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-2">Ваш ближайший маршрут</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Пять шагов, которые дают максимум пользы в первую неделю. Статусы обновятся по мере работы.
        </p>
      </div>

      <ol className="space-y-3">
        {ROUTE_STEPS_META.map((step, i) => {
          const status = routeSteps[step.id] ?? "pending";
          return (
            <li
              key={step.id}
              className={cn(
                "flex gap-4 rounded-xl border p-4",
                status === "done" ? "border-primary/30 bg-primary/5" : "border-border bg-card/60",
              )}
            >
              <StatusIcon status={status} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Шаг {i + 1}</p>
                <p className="font-medium">{step.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                {status !== "done" && (
                  <Link
                    to={step.to(projectId)}
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Перейти →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <Button
        size="lg"
        className="w-full h-12 bg-gradient-money text-primary-foreground font-semibold shadow-glow"
        onClick={onFinish}
      >
        Перейти в проект
      </Button>
    </motion.div>
  );
}
