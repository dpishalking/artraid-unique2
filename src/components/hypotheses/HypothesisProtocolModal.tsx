import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Hypothesis } from "@/lib/hypotheses/api";
import {
  parseHypothesisResult,
  saveHypothesisMethodology,
  updateHypothesisStatus,
} from "@/lib/hypotheses/api";
import {
  HYPOTHESIS_CHANNELS,
  resolveHypothesisChannel,
  type HypothesisChannel,
} from "@/lib/hypotheses/methodology";

type Props = {
  hypothesis: Hypothesis | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function HypothesisProtocolModal({ hypothesis, open, onClose, onSaved }: Props) {
  const [channel, setChannel] = useState<HypothesisChannel>("website");
  const [metricName, setMetricName] = useState("");
  const [testWindow, setTestWindow] = useState("");
  const [guardrail, setGuardrail] = useState("");
  const [owner, setOwner] = useState("");
  const [saving, setSaving] = useState(false);

  const channelConfig = HYPOTHESIS_CHANNELS.find((c) => c.id === channel)!;

  useEffect(() => {
    if (!hypothesis || !open) return;
    const parsed = parseHypothesisResult(hypothesis);
    setChannel(resolveHypothesisChannel(hypothesis));
    setMetricName(parsed.metricName ?? "");
    setTestWindow(parsed.testWindow ?? "");
    setGuardrail(parsed.guardrail ?? "");
    setOwner(parsed.owner ?? "");
  }, [hypothesis, open]);

  const handleSave = async (takeToWork: boolean) => {
    if (!hypothesis) return;
    if (!metricName.trim() || !testWindow.trim()) {
      toast.error("Заполните метрику и окно теста");
      return;
    }
    setSaving(true);
    try {
      await saveHypothesisMethodology(
        hypothesis.id,
        {
          metricName: metricName.trim(),
          testWindow: testWindow.trim(),
          source: channel,
          guardrail: guardrail.trim(),
          owner: owner.trim(),
        },
        {
          hypothesisType: channelConfig.type,
          sourceType: channelConfig.sourceType,
        },
      );
      if (takeToWork && hypothesis.status === "new") {
        await updateHypothesisStatus(hypothesis.id, "selected");
      }
      toast.success(takeToWork ? "Гипотеза взята в работу" : "Протокол сохранён");
      onSaved();
      onClose();
    } catch {
      toast.error("Не удалось сохранить протокол");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Протокол теста гипотезы
          </DialogTitle>
        </DialogHeader>

        {hypothesis && (
          <p className="text-sm text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
            {hypothesis.title}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Если сделаем X → получим Y, потому что Z. Канал: сайт, воронка, продажи или оффер.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Канал теста *</Label>
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
            <p className="text-[11px] text-muted-foreground">{channelConfig.implementHint}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypo-metric" className="text-xs">
              Главная метрика *
            </Label>
            <Input
              id="hypo-metric"
              placeholder={channelConfig.metricPlaceholder}
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypo-window" className="text-xs">
              Окно теста (SMART) *
            </Label>
            <Input
              id="hypo-window"
              placeholder="7 дней / 50 сделок / до 28.05"
              value={testWindow}
              onChange={(e) => setTestWindow(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hypo-guardrail" className="text-xs">
                Guardrail
              </Label>
              <Input
                id="hypo-guardrail"
                placeholder={channelConfig.guardrailPlaceholder}
                value={guardrail}
                onChange={(e) => setGuardrail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hypo-owner" className="text-xs">
                Кто в запуске
              </Label>
              <Input
                id="hypo-owner"
                placeholder="Маркетинг / ОП / команда"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </div>
          </div>

          {hypothesis?.expected_impact && (
            <p className="text-xs text-money rounded-lg border border-money/20 bg-money/5 px-3 py-2">
              Ожидаемый эффект: {hypothesis.expected_impact}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-1 bg-gradient-money text-primary-foreground"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить и взять в работу
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              Только сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
