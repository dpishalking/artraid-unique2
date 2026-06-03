import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Hypothesis } from "@/lib/hypotheses/api";
import {
  generateHypothesesFromProblem,
  persistGeneratedHypotheses,
  type GeneratedHypothesisDraft,
} from "@/lib/hypotheses/generateHypotheses";
import { HYPOTHESIS_CHANNELS, type HypothesisChannel } from "@/lib/hypotheses/methodology";
import { CommercialMetricSelector } from "@/components/commercial/CommercialMetricSelector";
import type { CommercialMetric } from "@/lib/commercial/types";

type Props = {
  projectId: string;
  seedProblem?: string | null;
  seedChannel?: HypothesisChannel;
  initialMetricId?: string;
  onClearSeed?: () => void;
  onReload: () => void;
  onConfigure: (hypothesis: Hypothesis) => void;
  /** Без крупного заголовка — когда генератор на отдельной странице */
  compact?: boolean;
};

export function ProblemHypothesisGenerator({
  projectId,
  seedProblem,
  seedChannel,
  initialMetricId = "",
  onClearSeed,
  onReload,
  onConfigure,
  compact = false,
}: Props) {
  const [problem, setProblem] = useState("");
  const [channel, setChannel] = useState<HypothesisChannel>("funnel");
  const [metricId, setMetricId] = useState(initialMetricId);
  const [selectedMetric, setSelectedMetric] = useState<CommercialMetric | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<GeneratedHypothesisDraft[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!seedProblem) return;
    setProblem(seedProblem);
    if (seedChannel) setChannel(seedChannel);
  }, [seedProblem, seedChannel]);

  useEffect(() => {
    if (initialMetricId) setMetricId(initialMetricId);
  }, [initialMetricId]);

  const togglePick = (idx: number) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!metricId) {
      toast.error("Выберите метрику, которую должна улучшить гипотеза");
      return;
    }
    if (problem.trim().length < 8) {
      toast.error("Опишите проблему подробнее");
      return;
    }
    setGenerating(true);
    setDrafts([]);
    setPicked(new Set());
    try {
      const list = await generateHypothesesFromProblem({
        projectId,
        problem: problem.trim(),
        channel,
        seedTitle: seedProblem && seedProblem !== problem.trim() ? seedProblem : undefined,
      });
      setDrafts(list);
      setPicked(new Set(list.map((_, i) => i)));
      toast.success(`AI предложил ${list.length} гипотез`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сгенерировать гипотезы");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (takeToWork: boolean) => {
    const chosen = drafts.filter((_, i) => picked.has(i));
    if (chosen.length === 0) {
      toast.error("Выберите хотя бы одну гипотезу");
      return;
    }
    setSaving(true);
    try {
      const saved = await persistGeneratedHypotheses(projectId, chosen, takeToWork, metricId);
      await onReload();
      toast.success(
        takeToWork
          ? `${saved.length} гипотез${saved.length === 1 ? "а" : "ы"} в работе`
          : `${saved.length} гипотез${saved.length === 1 ? "а" : "ы"} в бэклоге`,
      );
      if (takeToWork && saved[0]) onConfigure(saved[0]);
      setDrafts([]);
      setPicked(new Set());
      onClearSeed?.();
    } catch {
      toast.error("Не удалось сохранить гипотезы");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 space-y-4",
        compact
          ? "border-border bg-card/40"
          : "border-primary/30 bg-gradient-to-br from-primary/[0.08] to-card/40",
      )}
    >
      {!compact && (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              AI-генератор гипотез
            </p>
            <h3 className="font-display text-base font-semibold mt-0.5">
              Опишите проблему — AI предложит гипотезы для теста
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Опишите узкое место — получите 3–5 SMART-гипотез с метриками.
            </p>
          </div>
        </div>
      )}

      <CommercialMetricSelector
        projectId={projectId}
        value={metricId}
        required
        onChange={(id, metric) => {
          setMetricId(id);
          setSelectedMetric(metric);
        }}
        onDirectionPick={(direction) => {
          if (!problem.trim() && selectedMetric) {
            setProblem(
              `Метрика «${selectedMetric.name}» просела. Возможная причина: ${direction}. Нужно проверить гипотезу по изменению «${direction}».`,
            );
          }
        }}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        <div className="space-y-1.5">
          <Label htmlFor="problem-desc" className="text-xs">
            Проблема или узкое место *
          </Label>
          <Textarea
            id="problem-desc"
            rows={3}
            placeholder="Например: лиды из рекламы остывают — менеджеры звонят только на следующий день, конверсия в сделку 12%"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Канал (фокус)</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as HypothesisChannel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HYPOTHESIS_CHANNELS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-money text-primary-foreground mt-2"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Сгенерировать гипотезы
          </Button>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Варианты от AI — выберите, что тестировать
          </p>
          <ul className="space-y-2">
            {drafts.map((d, idx) => {
              const active = picked.has(idx);
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => togglePick(idx)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-all",
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-card/50 hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background",
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-snug">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.why}</p>
                        <p className="text-xs text-money">Эффект: {d.expectedImpact}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {d.metricName} · {d.testWindow}
                          {d.guardrail ? ` · guardrail: ${d.guardrail}` : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleSave(true)}
              disabled={saving || picked.size === 0}
              className="bg-gradient-money text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Взять в работу ({picked.size})
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || picked.size === 0}>
              В бэклог
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
