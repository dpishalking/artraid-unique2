import type { Project, ProjectContext } from "@/lib/projects/types";
import { mainGoalLabel } from "@/lib/projects/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";

type Props = {
  project: Project;
  context: ProjectContext | null;
  /** Если AI-контекст ещё пустой — подтягиваем то же самое из «Памяти проекта» (в т.ч. после квиза). */
  memory?: ProjectMemorySections | null;
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim();
  const isEmpty = !v || v.toLowerCase() === "null" || v.toLowerCase() === "undefined";
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] py-2 border-b border-border/50 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">
        {isEmpty ? (
          <span className="text-muted-foreground italic">Пока не заполнено</span>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}

function ListRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return <Row label={label} value={null} />;
  }
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] py-2 border-b border-border/50 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        <ul className="list-disc pl-4 space-y-0.5">
          {items.map((item, idx) => (
            <li key={`${label}-${idx}`}>{item}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}

export function ProjectMarketingMap({ project, context, memory }: Props) {
  const competitors =
    context?.competitors?.length
      ? context.competitors.map((c) => (c.name ? `${c.name} — ${c.url}` : c.url)).join("; ")
      : (memory?.competitors ?? [])
          .slice(0, 12)
          .map((c) => [c.name, c.url].filter(Boolean).join(" — "))
          .filter(Boolean)
          .join("; ") ||
        project.competitors.map((c) => c.url).join("; ");

  const m = memory ?? null;

  const proofItems: string[] =
    context?.key_proofs?.length
      ? context.key_proofs
      : m
        ? [m.proofs.testimonials, m.proofs.cases, m.proofs.numbers, m.proofs.certificates]
            .map((x) => (typeof x === "string" ? x.trim() : ""))
            .filter(Boolean)
        : [];

  const objectionItems: string[] =
    context?.objections ??
    (m?.objections ?? []).map((o) => o.objection ?? "").filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Маркетинговая карта</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          <Row label="Проект" value={project.name} />
          <Row
            label="Продукт"
            value={
              context?.product_name ??
              project.product_name ??
              m?.product.product_name ??
              null
            }
          />
          <Row
            label="Что продаём"
            value={
              context?.product_description ??
              m?.product.product_description ??
              project.product_description ??
              null
            }
          />
          <Row
            label="Кому"
            value={context?.target_audience ?? m?.audience.target_audience ?? project.target_audience}
          />
          <Row label="Цель" value={mainGoalLabel(project.main_goal)} />
          <Row
            label="Сайт"
            value={
              context?.current_website_url ??
              m?.websites.main_website_url ??
              project.current_website_url ??
              null
            }
          />
          <Row
            label="Оффер"
            value={
              context?.current_offer ?? m?.offer_positioning.current_offer ?? project.current_offer
            }
          />
          <Row label="Боль" value={context?.main_pain ?? m?.pains_desires.main_pain ?? null} />
          <Row label="Желание" value={context?.main_desire ?? m?.pains_desires.main_desire ?? null} />
          <Row label="Обещание" value={context?.key_promise ?? m?.offer_positioning.key_promise ?? null} />
          <Row
            label="Позиционирование"
            value={context?.positioning ?? m?.offer_positioning.positioning ?? null}
          />
          <ListRow label="Доказательства" items={proofItems} />
          <ListRow label="Возражения" items={objectionItems} />
          <Row label="Конкуренты" value={competitors || null} />
          {context?.recommended_next_step && (
            <Row label="Рекомендация AI" value={context.recommended_next_step} />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
