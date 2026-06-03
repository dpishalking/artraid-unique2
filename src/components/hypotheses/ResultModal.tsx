import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Hypothesis, HypothesisDecision } from "@/lib/hypotheses/api";
import { parseHypothesisResult, updateHypothesisStatus } from "@/lib/hypotheses/api";
import { getChannelConfig, resolveHypothesisChannel } from "@/lib/hypotheses/methodology";

type Props = {
  hypothesis: Hypothesis | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Hypothesis) => void;
};

export function ResultModal({ hypothesis, open, onClose, onSaved }: Props) {
  const [crBefore, setCrBefore] = useState("");
  const [crAfter, setCrAfter] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [decision, setDecision] = useState<HypothesisDecision>("pivot");
  const [insight, setInsight] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const metricLabel = useMemo(() => {
    if (!hypothesis) return "Метрика";
    const parsed = parseHypothesisResult(hypothesis);
    return parsed.metricName?.trim() || "Метрика";
  }, [hypothesis]);

  const channelConfig = useMemo(() => {
    if (!hypothesis) return getChannelConfig("website");
    return getChannelConfig(resolveHypothesisChannel(hypothesis));
  }, [hypothesis]);

  useEffect(() => {
    if (!hypothesis || !open) return;
    const parsed = parseHypothesisResult(hypothesis);
    setCrBefore(parsed.crBefore ?? "");
    setCrAfter(parsed.crAfter ?? "");
    setResultNote(parsed.resultNote ?? "");
    setDecision(parsed.decision ?? "pivot");
    setInsight(parsed.insight ?? "");
    setNextAction(parsed.nextAction ?? "");
  }, [hypothesis, open]);

  const handleImplemented = async () => {
    if (!hypothesis) return;
    if (!insight.trim() || !nextAction.trim()) {
      toast.error("Заполните «Инсайт» и «Что дальше»");
      return;
    }
    setSaving(true);
    try {
      await updateHypothesisStatus(hypothesis.id, "implemented", {
        crBefore: crBefore.trim() || undefined,
        crAfter: crAfter.trim() || undefined,
        resultNote: resultNote.trim() || undefined,
        decision,
        insight: insight.trim(),
        nextAction: nextAction.trim(),
      });
      onSaved({
        ...hypothesis,
        status: "implemented",
        implementation_difficulty: buildMethodologyString(
          crBefore,
          crAfter,
          resultNote,
          decision,
          insight,
          nextAction,
        ),
      });
      toast.success("Результат зафиксирован — карточка победы готова!");
      onClose();
    } catch {
      toast.error("Не удалось сохранить результат");
    } finally {
      setSaving(false);
    }
  };

  const handleRejected = async () => {
    if (!hypothesis) return;
    setRejecting(true);
    try {
      await updateHypothesisStatus(hypothesis.id, "rejected", {
        resultNote: resultNote.trim() || "Отложено",
      });
      onSaved({
        ...hypothesis,
        status: "rejected",
        implementation_difficulty: buildMethodologyString(
          "",
          "",
          resultNote,
          "stop",
          insight || "Гипотеза не прошла порог теста",
          nextAction || "Остановить и перераспределить бюджет",
        ),
      });
      toast.success("Гипотеза отложена");
      onClose();
    } catch {
      toast.error("Не удалось обновить статус");
    } finally {
      setRejecting(false);
    }
  };

  const lift = calcLift(crBefore, crAfter);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-money" />
            Зафиксировать результат
          </DialogTitle>
        </DialogHeader>

        {hypothesis && (
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
            {hypothesis.title}
          </p>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cr-before" className="text-xs">
                {metricLabel} до
              </Label>
              <Input
                id="cr-before"
                placeholder={channelConfig.resultPlaceholderBefore}
                value={crBefore}
                onChange={(e) => setCrBefore(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr-after" className="text-xs">
                {metricLabel} после
              </Label>
              <Input
                id="cr-after"
                placeholder={channelConfig.resultPlaceholderAfter}
                value={crAfter}
                onChange={(e) => setCrAfter(e.target.value)}
              />
            </div>
          </div>

          {lift !== null && (
            <div className="rounded-lg bg-money/10 border border-money/30 px-3 py-2 text-sm font-semibold text-money">
              {lift > 0 ? "+" : ""}
              {lift}% к {metricLabel.toLowerCase()}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="result-note" className="text-xs">
              Что изменили / комментарий (опционально)
            </Label>
            <Textarea
              id="result-note"
              placeholder="Переписали заголовок, убрали карусель, добавили гарантию..."
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Итог теста</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={decision === "scale" ? "default" : "outline"}
                onClick={() => setDecision("scale")}
                className={decision === "scale" ? "bg-money text-primary-foreground" : ""}
              >
                SCALE
              </Button>
              <Button
                type="button"
                variant={decision === "pivot" ? "default" : "outline"}
                onClick={() => setDecision("pivot")}
              >
                PIVOT
              </Button>
              <Button
                type="button"
                variant={decision === "stop" ? "default" : "outline"}
                onClick={() => setDecision("stop")}
              >
                STOP
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insight" className="text-xs">
              Инсайт (почему такой результат) *
            </Label>
            <Textarea
              id="insight"
              placeholder="Почему получили такой CR/CPL, что узнали о сегменте и оффере"
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next-action" className="text-xs">
              Что дальше (следующее действие) *
            </Label>
            <Textarea
              id="next-action"
              placeholder="Что делаем теперь: масштабируем, меняем угол, останавливаем"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleImplemented}
              disabled={saving || rejecting}
              className="flex-1 bg-gradient-money shadow-glow text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trophy className="mr-2 h-4 w-4" />
              Внедрил — записать победу
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRejected}
              disabled={saving || rejecting}
              title="Не внедрил / отложить"
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildMethodologyString(
  crBefore: string,
  crAfter: string,
  resultNote: string,
  decision: HypothesisDecision,
  insight: string,
  nextAction: string,
): string {
  const parts: string[] = [];
  if (crBefore.trim()) parts.push(`cr_before:${crBefore.trim()}`);
  if (crAfter.trim()) parts.push(`cr_after:${crAfter.trim()}`);
  if (resultNote.trim()) parts.push(`result:${resultNote.trim()}`);
  if (decision.trim()) parts.push(`decision:${decision}`);
  if (insight.trim()) parts.push(`insight:${insight.trim()}`);
  if (nextAction.trim()) parts.push(`next:${nextAction.trim()}`);
  return parts.join("|");
}

function calcLift(crBefore: string, crAfter: string): number | null {
  if (!crBefore || !crAfter) return null;
  const before = parseFloat(crBefore.replace(",", ".").replace("%", ""));
  const after = parseFloat(crAfter.replace(",", ".").replace("%", ""));
  if (isNaN(before) || isNaN(after) || before <= 0) return null;
  return Math.round(((after - before) / before) * 100);
}
