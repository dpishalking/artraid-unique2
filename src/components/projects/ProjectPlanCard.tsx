import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FlaskConical, Loader2, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CommercialMetric } from "@/lib/commercial/types";
import { formatMetricValue } from "@/components/commercial/shared";
import { createHypothesis } from "@/lib/hypotheses/api";
import {
  generateProjectStrategies,
  pickNorthStarMetric,
  saveProjectPlan,
  type ProjectPlan,
  type ProjectPlanHorizon,
  type ProjectStrategyDraft,
} from "@/lib/projects/projectPlanApi";

type Props = {
  projectId: string;
  defaultGoal: string;
  metrics: CommercialMetric[];
  plan: ProjectPlan | null;
  tableAvailable: boolean;
  onPlanChanged: (plan: ProjectPlan) => void;
};

const HORIZONS: Array<{ value: ProjectPlanHorizon; label: string }> = [
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
  { value: "custom", label: "Свой период" },
];

function priorityLabel(priority: ProjectStrategyDraft["priority"]): string {
  if (priority === "high") return "Высокий приоритет";
  if (priority === "low") return "Низкий приоритет";
  return "Средний приоритет";
}

function channelToType(channel: ProjectStrategyDraft["channel"]): string {
  if (channel === "website") return "packaging";
  return channel;
}

export function ProjectPlanCard({
  projectId,
  defaultGoal,
  metrics,
  plan,
  tableAvailable,
  onPlanChanged,
}: Props) {
  const currentNorthStar = useMemo(() => pickNorthStarMetric(metrics, plan), [metrics, plan]);
  const [goal, setGoal] = useState(plan?.goal ?? defaultGoal);
  const [northStarMetricId, setNorthStarMetricId] = useState(currentNorthStar?.id ?? "");
  const [horizon, setHorizon] = useState<ProjectPlanHorizon>(plan?.horizon ?? "month");
  const [deadline, setDeadline] = useState(plan?.deadline ?? "");
  const [focus, setFocus] = useState(plan?.focus ?? "");
  const [strategies, setStrategies] = useState<ProjectStrategyDraft[]>(plan?.strategies ?? []);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingHypothesis, setCreatingHypothesis] = useState<number | null>(null);

  const selectedNorthStar = metrics.find((m) => m.id === northStarMetricId) ?? currentNorthStar;
  const canPersist = tableAvailable;

  async function persist(nextStrategies = strategies) {
    if (!canPersist) {
      toast.error("Сначала примените миграцию project_plans в Supabase");
      return null;
    }
    setSaving(true);
    try {
      const saved = await saveProjectPlan(projectId, {
        goal,
        northStarMetricId: northStarMetricId || null,
        horizon,
        deadline,
        focus,
        strategies: nextStrategies,
      });
      onPlanChanged(saved);
      toast.success("План проекта сохранён");
      return saved;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить план");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateStrategies() {
    if (!goal.trim()) {
      toast.error("Сначала сформулируйте цель проекта");
      return;
    }
    if (!canPersist) {
      toast.error("Сначала примените миграцию project_plans в Supabase");
      return;
    }
    setGenerating(true);
    try {
      const drafts = await generateProjectStrategies({
        projectId,
        goal,
        focus,
        northStarMetric: selectedNorthStar,
        deadline,
      });
      setStrategies(drafts);
      const saved = await saveProjectPlan(projectId, {
        goal,
        northStarMetricId: selectedNorthStar?.id ?? null,
        horizon,
        deadline,
        focus,
        strategies: drafts,
      });
      onPlanChanged(saved);
      toast.success("AI предложил стратегии проекта");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сгенерировать стратегии");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateHypothesis(strategy: ProjectStrategyDraft, idx: number) {
    setCreatingHypothesis(idx);
    try {
      await createHypothesis({
        projectId,
        title: strategy.title,
        description: strategy.rationale,
        expectedImpact: strategy.metricName
          ? `Повлиять на метрику: ${strategy.metricName}`
          : selectedNorthStar
            ? `Повлиять на North Star: ${selectedNorthStar.name}`
            : undefined,
        whatToChange: strategy.whatToChange.join("\n"),
        sourceType: "project_strategy",
        hypothesisType: channelToType(strategy.channel),
        priority: strategy.priority,
        status: "new",
        commercialMetricId: strategy.commercialMetricId ?? selectedNorthStar?.id,
      });
      toast.success("Гипотеза добавлена в backlog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать гипотезу");
    } finally {
      setCreatingHypothesis(null);
    }
  }

  return (
    <Card className="border-primary/25 bg-primary/[0.03]">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              План проекта
            </p>
            <CardTitle className="mt-1 text-xl">Цель, North Star и стратегии</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/projects/${projectId}/commercial-metrics`}>Метрики</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/projects/${projectId}/context`}>Контекст</Link>
            </Button>
          </div>
        </div>
        {!tableAvailable && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Таблица project_plans ещё не применена в Supabase. Блок можно посмотреть, но сохранить план
            получится после миграции.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
          <div className="space-y-2">
            <Label htmlFor="project-goal">Главная цель</Label>
            <Textarea
              id="project-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="Например: за 60 дней проверить, может ли лендинг стабильно приводить 30 заявок в месяц"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label>North Star metric</Label>
              <Select value={northStarMetricId} onValueChange={setNorthStarMetricId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите метрику" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNorthStar && (
                <p className="text-xs text-muted-foreground">
                  План: {formatMetricValue(selectedNorthStar.plan_value, selectedNorthStar.unit)} · Факт:{" "}
                  {formatMetricValue(selectedNorthStar.fact_value, selectedNorthStar.unit)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Горизонт</Label>
                <Select value={horizon} onValueChange={(v) => setHorizon(v as ProjectPlanHorizon)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HORIZONS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-deadline">Дедлайн</Label>
                <Input
                  id="project-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-focus">Фокус текущего спринта</Label>
          <Input
            id="project-focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Например: усилить оффер первого экрана и проверить новый CTA на холодном трафике"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void persist()} disabled={saving || generating || !canPersist}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
            Сохранить план
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleGenerateStrategies()}
            disabled={saving || generating || !canPersist}
          >
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Сгенерировать стратегии
          </Button>
        </div>

        <div className="grid gap-3">
          {strategies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-5 text-sm text-muted-foreground">
              Стратегий пока нет. Заполните цель, North Star и фокус, затем попросите AI предложить
              3–5 направлений.
            </div>
          ) : (
            strategies.map((strategy, idx) => (
              <div key={`${strategy.title}-${idx}`} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={strategy.priority === "high" ? "default" : "secondary"}>
                        {priorityLabel(strategy.priority)}
                      </Badge>
                      {strategy.deadline && (
                        <Badge variant="outline" className="gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {strategy.deadline}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display text-base font-semibold">{strategy.title}</h3>
                    <p className="text-sm text-muted-foreground">{strategy.rationale}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCreateHypothesis(strategy, idx)}
                    disabled={creatingHypothesis !== null}
                  >
                    {creatingHypothesis === idx ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FlaskConical className="mr-2 h-4 w-4" />
                    )}
                    В гипотезы
                  </Button>
                </div>
                {strategy.whatToChange.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {strategy.whatToChange.slice(0, 4).map((step, i) => (
                      <li key={`${strategy.title}-step-${i}`}>{step}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
