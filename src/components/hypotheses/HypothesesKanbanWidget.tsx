import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FlaskConical,
  Loader2,
  PlayCircle,
  ScanSearch,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  listHypothesesForProject,
  parseHypothesisResult,
  updateHypothesisStatus,
  type Hypothesis,
} from "@/lib/hypotheses/api";
import { HypothesisProtocolModal } from "@/components/hypotheses/HypothesisProtocolModal";
import { ResultModal } from "@/components/hypotheses/ResultModal";
import { WinCardModal } from "@/components/hypotheses/WinCard";
import { channelLabel } from "@/lib/hypotheses/methodology";
import { toolHref } from "@/lib/navigation/productNav";
import { growthCycleHref } from "@/lib/growthCycle/routes";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type ColumnKey = "queued" | "running" | "ready";

type Props = {
  projectId: string;
  domain?: string;
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function bucketize(h: Hypothesis): ColumnKey {
  if (h.status === "in_progress") return "running";
  if (h.status === "selected") {
    return daysSince(h.created_at) >= 7 ? "ready" : "queued";
  }
  return "queued";
}

function HypothesisMini({
  h,
  domain,
  onStart,
  onProtocol,
  onResult,
}: {
  h: Hypothesis;
  domain?: string;
  onStart: (h: Hypothesis) => void;
  onProtocol: (h: Hypothesis) => void;
  onResult: (h: Hypothesis) => void;
}) {
  const age = daysSince(h.created_at);
  const protocol = parseHypothesisResult(h);
  const overdue = h.status !== "implemented" && h.status !== "won" && age >= 7;

  return (
    <li
      className={cn(
        "group space-y-2 rounded-xl border bg-card/60 px-3.5 py-3 transition-colors hover:border-primary/40",
        overdue ? "border-orange-400/40 bg-orange-400/[0.04]" : "border-border/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span className="rounded-full bg-muted/70 px-2 py-0.5 normal-case tracking-normal text-[10px] font-medium">
          {channelLabel(h)}
        </span>
        {h.priority === "high" && (
          <span className="rounded-full bg-money/15 px-2 py-0.5 normal-case tracking-normal text-[10px] font-medium text-money">
            high
          </span>
        )}
        {age > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {age} {age === 1 ? "день" : age < 5 ? "дня" : "дней"}
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-snug text-foreground" title={h.title}>
        {h.title}
      </p>

      {h.expected_impact && (
        <p className="text-[11px] text-money">{h.expected_impact}</p>
      )}

      {(protocol.metricName || protocol.testWindow) && (
        <p className="text-[10px] text-muted-foreground">
          {protocol.metricName ? `Метрика: ${protocol.metricName}` : ""}
          {protocol.metricName && protocol.testWindow ? " · " : ""}
          {protocol.testWindow ? `Окно: ${protocol.testWindow}` : ""}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1 pt-1">
        {h.status === "selected" && !overdue && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onStart(h)}
          >
            <PlayCircle className="mr-1 h-3 w-3" />
            Начал
          </Button>
        )}
        {overdue ? (
          <Button
            size="sm"
            className="h-7 bg-gradient-money text-xs text-primary-foreground"
            onClick={() => onResult(h)}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Записать результат
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onResult(h)}
          >
            Результат
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onProtocol(h)}
        >
          Протокол
        </Button>
      </div>
    </li>
  );
}

function Column({
  title,
  hint,
  icon: Icon,
  accent,
  items,
  emptyHint,
  domain,
  onStart,
  onProtocol,
  onResult,
}: {
  title: string;
  hint: string;
  icon: typeof PlayCircle;
  accent: "primary" | "orange" | "money";
  items: Hypothesis[];
  emptyHint: string;
  domain?: string;
  onStart: (h: Hypothesis) => void;
  onProtocol: (h: Hypothesis) => void;
  onResult: (h: Hypothesis) => void;
}) {
  const accentClass =
    accent === "money"
      ? "border-money/30 bg-money/[0.04] text-money"
      : accent === "orange"
        ? "border-orange-400/30 bg-orange-400/[0.04] text-orange-300"
        : "border-primary/30 bg-primary/[0.04] text-primary";

  return (
    <div className="flex min-h-[200px] flex-col rounded-2xl border border-border/50 bg-card/40 p-3 md:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg border", accentClass)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold leading-tight">{title}</p>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/40 px-3 py-6 text-center text-[11px] text-muted-foreground">
          {emptyHint}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => (
            <HypothesisMini
              key={h.id}
              h={h}
              domain={domain}
              onStart={onStart}
              onProtocol={onProtocol}
              onResult={onResult}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function HypothesesKanbanWidget({ projectId, domain }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Hypothesis[]>([]);
  const [protocolTarget, setProtocolTarget] = useState<Hypothesis | null>(null);
  const [resultTarget, setResultTarget] = useState<Hypothesis | null>(null);
  const [winTarget, setWinTarget] = useState<Hypothesis | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!projectId) return;
    try {
      const rows = await listHypothesesForProject(projectId);
      setItems(rows);
    } catch {
      toast.error("Не удалось загрузить гипотезы");
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const buckets = useMemo(() => {
    const queued: Hypothesis[] = [];
    const running: Hypothesis[] = [];
    const ready: Hypothesis[] = [];
    const recentWins: Hypothesis[] = [];

    items.forEach((h) => {
      if (h.status === "implemented" || h.status === "won") {
        if (daysSince(h.updated_at) < 14) recentWins.push(h);
        return;
      }
      if (h.status === "rejected" || h.status === "lost" || h.status === "tested") return;
      const where = bucketize(h);
      if (where === "queued") queued.push(h);
      else if (where === "running") running.push(h);
      else ready.push(h);
    });

    const byPriority = (a: Hypothesis, b: Hypothesis) => {
      const rank = (p: Hypothesis["priority"]) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
      const r = rank(a.priority) - rank(b.priority);
      if (r !== 0) return r;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    return {
      queued: queued.sort(byPriority),
      running: running.sort(byPriority),
      ready: ready.sort((a, b) => daysSince(b.created_at) - daysSince(a.created_at)),
      recentWins,
    };
  }, [items]);

  const totalActive = buckets.queued.length + buckets.running.length + buckets.ready.length;

  const handleStart = async (h: Hypothesis) => {
    setBusy(true);
    try {
      await updateHypothesisStatus(h.id, "in_progress");
      toast.success("Гипотеза в работе");
      await reload();
    } catch {
      toast.error("Не удалось обновить статус");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card/40 py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalActive === 0 && buckets.recentWins.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 md:p-8">
        <header className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-money/15 text-money">
            <FlaskConical className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">Гипотез в работе пока нет</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Запустите аудит и возьмите готовые гипотезы — они здесь появятся как канбан, и
              через 7 дней мы напомним зафиксировать результат.
            </p>
          </div>
        </header>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-gradient-money text-primary-foreground">
            <Link to={toolHref("/audit", projectId)}>
              <ScanSearch className="mr-2 h-4 w-4" />
              Запустить аудит
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={growthCycleHref(projectId, "hypotheses")}>К гипотезам из аудита</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-money/15 text-money">
                <FlaskConical className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-money">
                Цикл внедрения
              </p>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight md:text-2xl">
              Гипотезы в работе
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Берёте гипотезу → внедряете → через 7 дней фиксируете результат.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to={`/projects/${projectId}/hypothesis-lab`}>
              Свободные гипотезы
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </header>

        {buckets.ready.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-400/30 bg-orange-400/[0.05] px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-orange-300" />
            <span className="min-w-0 flex-1 text-foreground">
              {buckets.ready.length}{" "}
              {buckets.ready.length === 1 ? "гипотеза" : buckets.ready.length < 5 ? "гипотезы" : "гипотез"}{" "}
              в работе уже больше 7 дней — пора зафиксировать результат.
            </span>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          <Column
            title="К работе"
            hint="Взяли, но ещё не начали"
            icon={FlaskConical}
            accent="primary"
            items={buckets.queued}
            emptyHint="Пока пусто. Возьмите гипотезу из аудита."
            domain={domain}
            onStart={handleStart}
            onProtocol={setProtocolTarget}
            onResult={setResultTarget}
          />
          <Column
            title="Внедряется"
            hint="Уже в продакшене / в работе"
            icon={PlayCircle}
            accent="orange"
            items={buckets.running}
            emptyHint="Когда нажмёте «Начал внедрять» — карточка переедет сюда."
            domain={domain}
            onStart={handleStart}
            onProtocol={setProtocolTarget}
            onResult={setResultTarget}
          />
          <Column
            title="Зафиксировать результат"
            hint="Прошло 7+ дней, пора измерить"
            icon={CheckCircle2}
            accent="money"
            items={buckets.ready}
            emptyHint="Через 7 дней после старта здесь появятся напоминания."
            domain={domain}
            onStart={handleStart}
            onProtocol={setProtocolTarget}
            onResult={setResultTarget}
          />
        </div>

        {buckets.recentWins.length > 0 && (
          <div className="rounded-xl border border-money/30 bg-money/[0.05] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-money" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-money">
                Свежие победы
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {buckets.recentWins.slice(0, 4).map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2"
                >
                  <p className="min-w-0 truncate text-xs text-foreground" title={h.title}>
                    {h.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 shrink-0 px-2 text-[11px] text-money hover:bg-money/10"
                    onClick={() => setWinTarget(h)}
                  >
                    Открыть
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <HypothesisProtocolModal
        hypothesis={protocolTarget}
        open={protocolTarget !== null}
        onClose={() => setProtocolTarget(null)}
        onSaved={() => {
          setProtocolTarget(null);
          reload();
        }}
      />
      <ResultModal
        hypothesis={resultTarget}
        open={resultTarget !== null}
        onClose={() => setResultTarget(null)}
        onSaved={async (updated) => {
          setResultTarget(null);
          await reload();
          if (updated.status === "implemented") setWinTarget(updated);
        }}
      />
      {winTarget && (
        <WinCardModal
          hypothesis={winTarget}
          domain={domain}
          open={winTarget !== null}
          onClose={() => setWinTarget(null)}
        />
      )}
    </>
  );
}
