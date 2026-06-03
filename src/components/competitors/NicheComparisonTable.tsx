import { Fragment, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import type { ComparisonTableArtifact } from "@/lib/competitors/types";
import { INTEL_CRITERIA_COUNT, NICHE_TABLE_MAX_SITES } from "@/lib/competitors/nicheIndicators";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { data: ComparisonTableArtifact };

function normalizeHref(raw: string): string | null {
  const t = raw.trim();
  if (!t || t === "—") return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes(".") && !t.includes(" ")) return `https://${t}`;
  return null;
}

export function NicheComparisonTable({ data }: Props) {
  const isIntelTemplate = data.template === "competitive_intel_pdf";
  const showBenchmark = !isIntelTemplate;

  const groups = useMemo(() => {
    const order: string[] = [];
    for (const row of data.rows) {
      if (!order.includes(row.group)) order.push(row.group);
    }
    return order;
  }, [data.rows]);

  const urlByColumnId = useMemo(() => {
    const m = new Map<string, string | null>();
    const siteRow = data.rows.find((r) => r.id === "site_url");
    if (siteRow) {
      data.columns.forEach((col, i) => {
        m.set(col.id, normalizeHref(siteRow.cells[i]?.display ?? ""));
      });
    }
    for (const col of data.columns) {
      if (!m.has(col.id)) m.set(col.id, normalizeHref(col.url ?? ""));
    }
    return m;
  }, [data.columns, data.rows]);

  if (!data.columns.length || !data.rows.length) return null;

  const colSpan = data.columns.length + (showBenchmark ? 3 : 1);

  return (
    <Card className="overflow-hidden border-border/60">
      <CardHeader className="border-b border-border/40 bg-card/50 pb-4">
        <CardTitle className="text-lg font-display">Таблица конкурентной разведки</CardTitle>
        <p className="text-sm text-muted-foreground">
          {data.intel_criteria_count ?? INTEL_CRITERIA_COUNT} критериев по шаблону разведки ·{" "}
          {data.site_count ?? data.columns.length} игроков (вы + конкуренты, до {NICHE_TABLE_MAX_SITES})
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="sticky left-0 z-20 min-w-[10rem] bg-muted/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  Критерий
                </th>
                {data.columns.map((col) => {
                  const href = urlByColumnId.get(col.id);
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        "min-w-[12rem] max-w-[16rem] px-3 py-3 text-left text-xs font-semibold align-top",
                        col.is_self ? "bg-primary/10 text-primary" : "text-muted-foreground",
                      )}
                    >
                      <span className="block font-semibold">{col.is_self ? "Вы" : col.label}</span>
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-normal text-primary hover:underline"
                        >
                          {href.replace(/^https?:\/\//, "").slice(0, 40)}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      )}
                    </th>
                  );
                })}
                {showBenchmark && (
                  <>
                    <th className="min-w-[4rem] px-2 py-3 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Мед.
                    </th>
                    <th className="min-w-[4rem] px-2 py-3 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Топ
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group}>
                  <tr className="bg-background/80">
                    <td
                      colSpan={colSpan}
                      className="sticky left-0 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {group}
                    </td>
                  </tr>
                  {data.rows
                    .filter((r) => r.group === group)
                    .map((row) => (
                      <tr key={row.id} className="border-b border-border/30 hover:bg-muted/15">
                        <td className="sticky left-0 z-10 bg-card/95 px-4 py-3 align-top backdrop-blur">
                          <span className="text-xs font-medium text-foreground" title={row.label}>
                            {row.short_label}
                          </span>
                        </td>
                        {row.cells.map((cell, i) => (
                          <td
                            key={`${row.id}-${data.columns[i]?.id}`}
                            className={cn(
                              "px-3 py-3 align-top text-left text-xs leading-relaxed text-foreground/90",
                              data.columns[i]?.is_self && "bg-primary/[0.03] ring-1 ring-inset ring-primary/15",
                            )}
                          >
                            <span className="line-clamp-6 whitespace-pre-wrap break-words">
                              {cell.display}
                            </span>
                          </td>
                        ))}
                        {showBenchmark && (
                          <>
                            <td className="px-2 py-3 text-center text-xs text-muted-foreground align-top">
                              {row.niche_median ?? "—"}
                            </td>
                            <td className="px-2 py-3 text-center text-xs text-money align-top">
                              {row.niche_top ?? "—"}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border/40 px-4 py-3 text-[11px] text-muted-foreground">
          {isIntelTemplate
            ? "Заполнено AI по тексту сайта при анализе конкурента. Для глубины как в PDF — перезапустите анализ конкурентов и обновите карту ниши."
            : "Сравнение по числовым метрикам: зелёный/красный — относительно медианы конкурентов."}
        </p>
      </CardContent>
    </Card>
  );
}
