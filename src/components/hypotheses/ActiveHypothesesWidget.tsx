import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Clock, FlaskConical, Loader2, ScanSearch, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Hypothesis } from "@/lib/hypotheses/api";
import { listHypothesesForProject, updateHypothesisStatus } from "@/lib/hypotheses/api";
import { ResultModal } from "./ResultModal";
import { WinCardModal } from "./WinCard";

type Props = {
  projectId: string;
  domain?: string;
  showEmptyState?: boolean;
  auditHref?: string;
};

const STATUS_LABEL: Record<string, string> = {
  selected: "Выбрана",
  in_progress: "В работе",
  implemented: "Внедрена",
  rejected: "Отложена",
  won: "Победа",
};

const STATUS_COLOR: Record<string, string> = {
  selected: "text-primary border-primary/40 bg-primary/10",
  in_progress: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  implemented: "text-money border-money/40 bg-money/10",
  rejected: "text-muted-foreground border-border bg-muted/30",
  won: "text-money border-money/40 bg-money/10",
};

export function ActiveHypothesesWidget({
  projectId,
  domain,
  showEmptyState,
  auditHref,
}: Props) {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [allHypotheses, setAllHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultTarget, setResultTarget] = useState<Hypothesis | null>(null);
  const [winTarget, setWinTarget] = useState<Hypothesis | null>(null);

  useEffect(() => {
    listHypothesesForProject(projectId)
      .then((list) => {
        setAllHypotheses(list);
        const active = list.filter((h) =>
          ["selected", "in_progress", "implemented", "won"].includes(h.status),
        );
        setHypotheses(active);
      })
      .catch(() => toast.error("Не удалось загрузить гипотезы"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleStartProgress = async (h: Hypothesis) => {
    try {
      await updateHypothesisStatus(h.id, "in_progress");
      setHypotheses((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, status: "in_progress" } : x)),
      );
    } catch {
      toast.error("Не удалось обновить статус");
    }
  };

  const handleSaved = (updated: Hypothesis) => {
    setHypotheses((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    if (updated.status === "implemented") {
      setWinTarget(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Загружаем гипотезы…
      </div>
    );
  }

  if (hypotheses.length === 0 && !showEmptyState) return null;

  const completed = allHypotheses.filter((h) => h.status === "rejected");

  if (hypotheses.length === 0 && showEmptyState) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">Пока нет гипотез</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Запустите аудит сайта и отметьте правки, которые будете внедрять — они появятся здесь
            для отслеживания результата.
          </p>
        </div>
        {auditHref && (
          <Button asChild className="bg-gradient-money text-primary-foreground">
            <Link to={auditHref}>
              <ScanSearch className="mr-2 h-4 w-4" />
              Запустить аудит
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Лаборатория гипотез
          </p>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Активные гипотезы</h3>
          <span className="text-xs text-muted-foreground">{hypotheses.length} в работе</span>
        </div>

        <ul className="space-y-3">
          {hypotheses.map((h) => (
            <HypothesisRow
              key={h.id}
              hypothesis={h}
              onMarkProgress={() => handleStartProgress(h)}
              onMarkResult={() => setResultTarget(h)}
              onShowWin={() => setWinTarget(h)}
            />
          ))}
        </ul>

        {completed.length > 0 && (
          <div className="space-y-2 border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Отложенные
            </p>
            <ul className="space-y-2">
              {completed.map((h) => (
                <li
                  key={h.id}
                  className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
                >
                  {h.title}
                  <span className="ml-2 text-[10px] uppercase">
                    {STATUS_LABEL[h.status] ?? h.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ResultModal
        hypothesis={resultTarget}
        open={resultTarget !== null}
        onClose={() => setResultTarget(null)}
        onSaved={handleSaved}
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

function HypothesisRow({
  hypothesis: h,
  onMarkProgress,
  onMarkResult,
  onShowWin,
}: {
  hypothesis: Hypothesis;
  onMarkProgress: () => void;
  onMarkResult: () => void;
  onShowWin: () => void;
}) {
  const isImplemented = h.status === "implemented" || h.status === "won";
  const isRejected = h.status === "rejected";
  const statusLabel = STATUS_LABEL[h.status] ?? h.status;
  const statusColor = STATUS_COLOR[h.status] ?? STATUS_COLOR["selected"];
  const ageMs = Date.now() - new Date(h.created_at).getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  return (
    <li
      className={cn(
        "rounded-xl border p-3 space-y-2 transition-all",
        isImplemented ? "border-money/30 bg-money/5" : "border-border bg-card/50",
        isRejected && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug flex-1">{h.title}</p>
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

      {ageDays > 0 && !isImplemented && !isRejected && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {ageDays} {ageDays === 1 ? "день" : ageDays < 5 ? "дня" : "дней"} в выборе
          {ageDays >= 7 && (
            <span className="ml-1 text-orange-400 font-medium">· пора фиксировать!</span>
          )}
        </p>
      )}

      {!isImplemented && !isRejected && (
        <div className="flex gap-2 pt-1">
          {h.status === "selected" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onMarkProgress}
            >
              В работе
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs bg-gradient-money text-primary-foreground"
            onClick={onMarkResult}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Внедрил
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
