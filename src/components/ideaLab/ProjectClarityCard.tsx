import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { IdeaLabCard } from "@/lib/ideaLab/types";

const FIELDS: { key: keyof IdeaLabCard; label: string; multiline?: boolean }[] = [
  { key: "idea_name", label: "Название идеи" },
  { key: "short_description", label: "Краткое описание", multiline: true },
  { key: "target_audience", label: "Для кого", multiline: true },
  { key: "main_problem", label: "Главная проблема", multiline: true },
  { key: "desired_outcome", label: "Желаемый результат клиента", multiline: true },
  { key: "product_format", label: "Формат продукта" },
  { key: "primary_offer", label: "Что продаёте — одной фразой", multiline: true },
  { key: "mvp", label: "MVP", multiline: true },
  { key: "demand_hypotheses", label: "Гипотезы спроса", multiline: true },
  { key: "next_step", label: "Следующий шаг" },
];

type Props = {
  card: IdeaLabCard;
  onEdit?: (key: keyof IdeaLabCard, value: string) => void;
};

export function ProjectClarityCard({ card, onEdit }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 space-y-4 max-h-[min(70vh,640px)] overflow-y-auto">
      <div className="flex items-center gap-2 sticky top-0 bg-card/95 backdrop-blur py-1 -mt-1 z-10">
        <Pencil className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">Карточка проекта</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Заполняется по ходу диалога. Можно править вручную.
      </p>
      {FIELDS.map(({ key, label, multiline }) => {
        const val = card[key] ?? "";
        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {multiline ? (
              <Textarea
                value={val}
                onChange={(e) => onEdit?.(key, e.target.value)}
                rows={2}
                className="text-sm resize-none min-h-[56px]"
                placeholder="Появится после ответов…"
              />
            ) : (
              <Input
                value={val}
                onChange={(e) => onEdit?.(key, e.target.value)}
                className="text-sm h-9"
                placeholder="—"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
