import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Hypothesis } from "@/lib/hypotheses/api";
import { createHypothesis } from "@/lib/hypotheses/api";
import { HYPOTHESIS_CHANNELS, type HypothesisChannel } from "@/lib/hypotheses/methodology";
import { CommercialMetricSelector } from "@/components/commercial/CommercialMetricSelector";
import type { CommercialMetric } from "@/lib/commercial/types";

type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (hypothesis: Hypothesis) => void;
  initialMetricId?: string;
};

export function AddHypothesisModal({ projectId, open, onClose, onCreated, initialMetricId = "" }: Props) {
  const [channel, setChannel] = useState<HypothesisChannel>("funnel");
  const [metricId, setMetricId] = useState(initialMetricId);
  const [selectedMetric, setSelectedMetric] = useState<CommercialMetric | null>(null);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [expectedImpact, setExpectedImpact] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [saving, setSaving] = useState(false);

  const channelConfig = HYPOTHESIS_CHANNELS.find((c) => c.id === channel)!;

  useEffect(() => {
    if (open && initialMetricId) {
      setMetricId(initialMetricId);
    }
  }, [open, initialMetricId]);

  const reset = () => {
    setChannel("funnel");
    setMetricId(initialMetricId);
    setSelectedMetric(null);
    setTitle("");
    setWhy("");
    setExpectedImpact("");
    setPriority("medium");
  };

  const handleCreate = async () => {
    if (!metricId) {
      toast.error("Выберите метрику, которую должна улучшить гипотеза");
      return;
    }
    if (!title.trim()) {
      toast.error("Опишите гипотезу");
      return;
    }
    setSaving(true);
    try {
      const h = await createHypothesis({
        projectId,
        title: title.trim(),
        description: why.trim() || undefined,
        expectedImpact: expectedImpact.trim() || selectedMetric?.name || undefined,
        whatToChange: title.trim(),
        sourceType: channelConfig.sourceType,
        hypothesisType: channelConfig.type,
        priority,
        status: "new",
        commercialMetricId: metricId,
      });
      toast.success("Гипотеза добавлена — настройте протокол теста");
      onCreated(h);
      reset();
      onClose();
    } catch {
      toast.error("Не удалось создать гипотезу");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Новая гипотеза
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Формула: если сделаем X, получим Y, потому что Z. Аудит сайта — только один из источников.
        </p>

        <div className="space-y-4">
          <CommercialMetricSelector
            projectId={projectId}
            value={metricId}
            required
            onChange={(id, metric) => {
              setMetricId(id);
              setSelectedMetric(metric);
            }}
            onDirectionPick={(direction) => {
              setTitle((prev) =>
                prev.trim()
                  ? prev
                  : `Если улучшим «${direction}», метрика «${selectedMetric?.name ?? "…"}» вырастет`,
              );
            }}
          />

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
            <Label htmlFor="hypo-title" className="text-xs">
              Гипотеза (если X → Y, потому что Z) *
            </Label>
            <Textarea
              id="hypo-title"
              placeholder="Если добавим follow-up через 2 часа после заявки, конверсия в сделку вырастет на 20%, потому что лиды остывают к вечеру"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypo-impact" className="text-xs">
              Ожидаемый эффект (метрика + порог)
            </Label>
            <Input
              id="hypo-impact"
              placeholder={channelConfig.metricPlaceholder}
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hypo-why" className="text-xs">
              Почему верим (доказательство / инсайт)
            </Label>
            <Textarea
              id="hypo-why"
              placeholder="Данные CRM, звонки, исследование, опыт прошлых запусков"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Приоритет</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-gradient-money text-primary-foreground"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Добавить и настроить протокол
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
