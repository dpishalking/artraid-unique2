import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Hypothesis } from "@/lib/hypotheses/api";
import { parseHypothesisResult } from "@/lib/hypotheses/api";
import { channelLabel, resolveHypothesisChannel } from "@/lib/hypotheses/methodology";

export const STATUS_LABEL: Record<string, string> = {
  selected: "Выбрана",
  in_progress: "В работе",
  implemented: "Внедрена",
  rejected: "Отложена",
  won: "Победа",
};

export const STATUS_COLOR: Record<string, string> = {
  selected: "text-primary border-primary/40 bg-primary/10",
  in_progress: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  implemented: "text-money border-money/40 bg-money/10",
  rejected: "text-muted-foreground border-border bg-muted/30",
  won: "text-money border-money/40 bg-money/10",
};

export const ACTIVE_STATUSES = new Set(["selected", "in_progress", "implemented", "won"]);

export function priorityRank(p: string): number {
  if (p === "high") return 0;
  if (p === "medium") return 1;
  return 2;
}

export function ChannelBadge({ hypothesis }: { hypothesis: Hypothesis }) {
  const label = channelLabel(hypothesis);
  const channel = resolveHypothesisChannel(hypothesis);
  const color =
    channel === "funnel"
      ? "border-orange-400/40 bg-orange-400/10 text-orange-300"
      : channel === "sales"
        ? "border-blue-400/40 bg-blue-400/10 text-blue-300"
        : channel === "offer"
          ? "border-purple-400/40 bg-purple-400/10 text-purple-300"
          : "border-primary/40 bg-primary/10 text-primary";

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", color)}>
      {label}
    </span>
  );
}

export function HypothesisRow({
  hypothesis: h,
  onMarkProgress,
  onMarkResult,
  onShowWin,
  onEditProtocol,
}: {
  hypothesis: Hypothesis;
  onMarkProgress: () => void;
  onMarkResult: () => void;
  onShowWin: () => void;
  onEditProtocol: () => void;
}) {
  const isImplemented = h.status === "implemented" || h.status === "won";
  const isRejected = h.status === "rejected";
  const statusLabel = STATUS_LABEL[h.status] ?? h.status;
  const statusColor = STATUS_COLOR[h.status] ?? STATUS_COLOR["selected"];
  const ageMs = Date.now() - new Date(h.created_at).getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const protocol = parseHypothesisResult(h);

  return (
    <li
      className={cn(
        "rounded-xl border p-4 space-y-2 transition-all",
        isImplemented ? "border-money/30 bg-money/5" : "border-border bg-card/50",
        isRejected && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge hypothesis={h} />
            {h.priority === "high" && (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                приоритет
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-snug">{h.title}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            statusColor,
          )}
        >
          {statusLabel}
        </span>
      </div>

      {h.expected_impact && (
        <p className="text-xs text-money">Ожидаемый эффект: {h.expected_impact}</p>
      )}

      {(protocol.metricName || protocol.testWindow) && (
        <p className="text-[11px] text-muted-foreground">
          {protocol.metricName && <>Метрика: {protocol.metricName}</>}
          {protocol.metricName && protocol.testWindow && " · "}
          {protocol.testWindow && <>Окно: {protocol.testWindow}</>}
        </p>
      )}

      {ageDays > 0 && !isImplemented && !isRejected && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {ageDays} {ageDays === 1 ? "день" : ageDays < 5 ? "дня" : "дней"} в работе
          {ageDays >= 7 && (
            <span className="ml-1 text-orange-400 font-medium">· пора фиксировать результат!</span>
          )}
        </p>
      )}

      {!isImplemented && !isRejected && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEditProtocol}>
            Протокол
          </Button>
          {h.status === "selected" && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onMarkProgress}>
              Начал внедрять
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs bg-gradient-money text-primary-foreground"
            onClick={onMarkResult}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Записать результат
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={onMarkResult}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Не внедрил
          </Button>
        </div>
      )}

      {isImplemented && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-money/40 text-money hover:bg-money/10"
          onClick={onShowWin}
        >
          <Trophy className="mr-1 h-3.5 w-3.5" />
          Карточка победы
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </li>
  );
}

export function CandidateRow({
  hypothesis: h,
  onConfigure,
  onAiExpand,
}: {
  hypothesis: Hypothesis;
  onConfigure: () => void;
  onAiExpand: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <ChannelBadge hypothesis={h} />
          {h.priority === "high" && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
              приоритет
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug">{h.title}</p>
        {h.expected_impact && (
          <p className="text-xs text-money">Ожидаемый эффект: {h.expected_impact}</p>
        )}
        {h.description && <p className="text-xs text-muted-foreground">{h.description}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onAiExpand}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          AI-варианты
        </Button>
        <Button size="sm" onClick={onConfigure}>
          Протокол
        </Button>
      </div>
    </li>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-1 mb-6">
      {eyebrow && (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground max-w-xl">{description}</p>}
    </header>
  );
}
