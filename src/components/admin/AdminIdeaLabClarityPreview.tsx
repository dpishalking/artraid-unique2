import type { IdeaLabCard } from "@/lib/ideaLab/types";

const FIELDS: { key: keyof IdeaLabCard; label: string }[] = [
  { key: "idea_name", label: "Название идеи" },
  { key: "short_description", label: "Краткое описание" },
  { key: "target_audience", label: "Для кого" },
  { key: "main_problem", label: "Главная проблема" },
  { key: "desired_outcome", label: "Желаемый результат" },
  { key: "product_format", label: "Формат продукта" },
  { key: "primary_offer", label: "Что продаёте" },
  { key: "mvp", label: "MVP" },
  { key: "demand_hypotheses", label: "Гипотезы спроса" },
  { key: "next_step", label: "Следующий шаг" },
];

type Props = {
  card: IdeaLabCard;
  compact?: boolean;
};

export function AdminIdeaLabClarityPreview({ card, compact }: Props) {
  const filled = FIELDS.filter(({ key }) => {
    const v = card[key];
    return typeof v === "string" && v.trim().length > 0;
  });

  if (filled.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Карточка пока пустая — пользователь ещё не дошёл до заполнения полей.
      </p>
    );
  }

  const visible = compact ? filled.slice(0, 4) : filled;

  return (
    <dl className="space-y-3">
      {visible.map(({ key, label }) => (
        <div key={key} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{card[key]}</dd>
        </div>
      ))}
      {compact && filled.length > visible.length && (
        <p className="text-xs text-muted-foreground">+ ещё {filled.length - visible.length} полей в полной карточке</p>
      )}
    </dl>
  );
}
