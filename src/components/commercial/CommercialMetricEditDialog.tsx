import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import type { CommercialMetric } from "@/lib/commercial/types";
import {
  COMMERCIAL_CATEGORY_LABELS,
  COMMERCIAL_DIRECTION_LABELS,
  COMMERCIAL_PERIOD_OPTIONS,
} from "@/lib/commercial/types";
import { upsertCommercialMetric } from "@/lib/commercial/api";

type Props = {
  metric: CommercialMetric | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CommercialMetricEditDialog({ metric, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [plan, setPlan] = useState("");
  const [fact, setFact] = useState("");
  const [period, setPeriod] = useState("month");
  const [direction, setDirection] = useState<CommercialMetric["direction"]>("higher_is_better");
  const [rangeNorm, setRangeNorm] = useState("");
  const [rangeTolerance, setRangeTolerance] = useState("");
  const [rangeCritical, setRangeCritical] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [owner, setOwner] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!metric) return;
    setName(metric.name);
    setDescription(metric.description ?? "");
    setUnit(metric.unit ?? "");
    setPlan(metric.plan_value == null ? "" : String(metric.plan_value));
    setFact(metric.fact_value == null ? "" : String(metric.fact_value));
    setPeriod(metric.period);
    setDirection(metric.direction);
    setRangeNorm(metric.range_norm == null ? "" : String(metric.range_norm));
    setRangeTolerance(metric.range_tolerance == null ? "" : String(metric.range_tolerance));
    setRangeCritical(metric.range_critical == null ? "" : String(metric.range_critical));
    setDataSource(metric.data_source ?? "");
    setOwner(metric.owner_name ?? "");
    setComment(metric.comment ?? "");
  }, [metric]);

  const parseNum = (raw: string): number | null => {
    const t = raw.trim();
    if (!t) return null;
    const n = parseFloat(t.replace(",", "."));
    return Number.isNaN(n) ? null : n;
  };

  const handleSave = async () => {
    if (!metric) return;
    setSaving(true);
    try {
      await upsertCommercialMetric(metric.id, {
        name: name.trim() || metric.name,
        description: description.trim() || null,
        unit: unit.trim() || null,
        plan_value: parseNum(plan),
        fact_value: parseNum(fact),
        period,
        direction,
        range_norm: parseNum(rangeNorm),
        range_tolerance: parseNum(rangeTolerance),
        range_critical: parseNum(rangeCritical),
        data_source: dataSource.trim() || null,
        owner_name: owner.trim() || null,
        comment: comment.trim() || null,
      });
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!metric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{metric.is_custom ? "Редактировать метрику" : metric.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {metric.is_custom && (
            <div className="space-y-1">
              <Label className="text-xs">Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Описание</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">План</Label>
              <Input value={plan} onChange={(e) => setPlan(e.target.value)} inputMode="decimal" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Факт</Label>
              <Input value={fact} onChange={(e) => setFact(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Единица</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Период</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMERCIAL_PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Тип оценки</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as CommercialMetric["direction"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(COMMERCIAL_DIRECTION_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {direction === "target_range" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Норма</Label>
                <Input value={rangeNorm} onChange={(e) => setRangeNorm(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Доп. откл. %</Label>
                <Input value={rangeTolerance} onChange={(e) => setRangeTolerance(e.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Крит. откл. %</Label>
                <Input value={rangeCritical} onChange={(e) => setRangeCritical(e.target.value)} inputMode="decimal" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Источник данных</Label>
              <Input value={dataSource} onChange={(e) => setDataSource(e.target.value)} placeholder="CRM, Метрика…" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Владелец</Label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Комментарий</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Категория: {COMMERCIAL_CATEGORY_LABELS[metric.category]}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
