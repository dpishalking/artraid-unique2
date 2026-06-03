import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, Plus, ScanSearch, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useHypothesisLab, filterByChannel } from "@/components/hypotheses/HypothesisLabProvider";
import { CandidateRow, SectionHeader } from "@/components/hypotheses/lab/shared";
import { HYPOTHESIS_CHANNELS, resolveHypothesisChannel, type HypothesisChannel } from "@/lib/hypotheses/methodology";
import { hypothesisLabBase } from "@/lib/hypotheses/labNav";
import { toolHref } from "@/lib/navigation/productNav";

export function HypothesisLabBacklogView() {
  const ctx = useHypothesisLab();
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState<HypothesisChannel | "all">("all");
  const base = hypothesisLabBase(ctx.projectId);
  const auditHref = toolHref("/audit", ctx.projectId);
  const reportHref = ctx.reportShareId ? `/r/${ctx.reportShareId}` : null;

  const candidates = filterByChannel(ctx.candidates, channelFilter);
  const auditCandidates = candidates.filter((h) => ctx.auditCandidates.some((a) => a.id === h.id));
  const manualCandidates = candidates.filter((h) => !auditCandidates.some((a) => a.id === h.id));

  const goToGenerate = (problem: string, channel: HypothesisChannel) => {
    ctx.setAiSeed({ problem, channel });
    navigate(`${base}/generate`);
  };

  if (ctx.candidates.length === 0) {
    return (
      <div>
        <SectionHeader
          title="Бэклог"
          description="Гипотезы, которые ждут протокола теста — метрика, окно, guardrail."
        />
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {ctx.hasAudit
              ? "Рекомендации из аудита обработаны. Сгенерируйте новую гипотезу или запустите повторный аудит."
              : "Пока нет кандидатов. Опишите проблему — AI предложит варианты для теста."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild className="bg-gradient-money text-primary-foreground">
              <Link to={`${base}/generate`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Новая гипотеза
              </Link>
            </Button>
            {reportHref && (
              <Button variant="outline" size="sm" asChild>
                <Link to={reportHref}>
                  Отчёт аудита
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to={auditHref}>
                <ScanSearch className="mr-1.5 h-3.5 w-3.5" />
                Аудит
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <SectionHeader
          title="Бэклог"
          description="Выберите гипотезу и задайте протокол — метрика, окно и guardrail до запуска."
        />
        {reportHref && auditCandidates.length > 0 && (
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link to={reportHref} target="_blank">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Отчёт аудита
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={channelFilter === "all" ? "default" : "outline"}
            onClick={() => setChannelFilter("all")}
          >
            Все
          </Button>
          {HYPOTHESIS_CHANNELS.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={channelFilter === c.id ? "default" : "outline"}
              onClick={() => setChannelFilter(c.id)}
            >
              {c.shortLabel}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => ctx.setShowAddModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить
        </Button>
      </div>

      {auditCandidates.length > 0 && (
        <div className="space-y-2 mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Из аудита сайта
          </p>
          <ul className="space-y-2">
            {auditCandidates.map((h) => (
              <CandidateRow
                key={h.id}
                hypothesis={h}
                onConfigure={() => ctx.setProtocolTarget(h)}
                onAiExpand={() =>
                  goToGenerate(
                    [h.title, h.description].filter(Boolean).join(". "),
                    resolveHypothesisChannel(h),
                  )
                }
              />
            ))}
          </ul>
        </div>
      )}

      {manualCandidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {auditCandidates.length > 0 ? "Другие каналы" : "Все гипотезы"}
          </p>
          <ul className="space-y-2">
            {manualCandidates.map((h) => (
              <CandidateRow
                key={h.id}
                hypothesis={h}
                onConfigure={() => ctx.setProtocolTarget(h)}
                onAiExpand={() =>
                  goToGenerate(
                    [h.title, h.description].filter(Boolean).join(". "),
                    resolveHypothesisChannel(h),
                  )
                }
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
