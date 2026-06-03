import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { LandingScenario } from "@/config/landingScenarios";
import {
  builderBody,
  builderHeading,
  builderMuted,
  builderSubpanel,
  builderWorkspace,
} from "@/components/builder/builderStyles";

type Props = {
  scenario: LandingScenario;
  answers: Record<string, string>;
  completeness: { score: number; label: string; color: string };
  currentQuestionId?: string;
};

function truncate(s: string, max = 72) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function BuilderBriefSidebar({ scenario, answers, completeness, currentQuestionId }: Props) {
  const filled = scenario.questions.filter((q) => (answers[q.id]?.trim().length ?? 0) >= 2);
  const fillRatio = filled.length / Math.max(scenario.questions.length, 1);
  const barWidth = `${Math.min(100, 12 + fillRatio * 88)}%`;

  return (
    <div className="lg:sticky lg:top-28 space-y-4">
      <div className={`${builderWorkspace} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className={`${builderHeading} text-sm`}>Ваш бриф</h3>
        </div>

        <div className="mb-4">
          <div className={`flex items-center justify-between text-xs ${builderMuted} mb-1.5`}>
            <span>Готовность</span>
            <span className={`font-bold tabular-nums ${completeness.color}`}>{completeness.score}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-money"
              initial={false}
              animate={{ width: `${completeness.score}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className={`text-[10px] ${builderMuted} mt-1`}>{completeness.label} уровень детализации</p>
        </div>

        <p className={`text-xs ${builderBody} mb-3 leading-relaxed`}>
          AI использует ответы для сценария «{scenario.title}».
        </p>

        <div className="space-y-2 max-h-[min(36vh,280px)] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filled.length === 0 ? (
              <p
                className={`text-xs ${builderMuted} italic rounded-lg border border-dashed border-border px-3 py-4 text-center`}
              >
                Пока пусто — ответы появятся по ходу брифа
              </p>
            ) : (
              filled.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border px-3 py-2.5 ${
                    q.id === currentQuestionId
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-secondary/40"
                  }`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${builderMuted} mb-1`}>
                    {q.label}
                  </p>
                  <p className="text-xs text-foreground leading-snug">{truncate(answers[q.id] ?? "")}</p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={`${builderSubpanel} p-3 hidden xl:block`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${builderMuted} mb-2`}>
          Превью структуры
        </p>
        <div className="space-y-1">
          {scenario.landingStructure.slice(0, 4).map((b, i) => (
            <div key={b.id} className="h-2 rounded-full bg-muted overflow-hidden" style={{ opacity: 1 - i * 0.08 }}>
              <motion.div
                className="h-full rounded-full bg-gradient-money"
                initial={false}
                animate={{ width: barWidth }}
              />
            </div>
          ))}
        </div>
        <p className={`text-[10px] ${builderMuted} mt-2`}>
          {scenario.landingStructure.length} блоков в прототипе
        </p>
      </div>
    </div>
  );
}
