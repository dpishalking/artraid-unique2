import type { NichePulseArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AWARENESS_RU: Record<string, string> = {
  unaware: "Unaware",
  problem: "Problem-aware",
  solution: "Solution-aware",
  product: "Product-aware",
  most: "Most-aware",
};

type Props = { data: NichePulseArtifact };

export function NichePulseCard({ data }: Props) {
  const stats = [
    { label: "Средний Hormozi", value: data.avg_hormozi != null ? `${data.avg_hormozi}/100` : "—" },
    {
      label: "Доминирующий awareness",
      value: data.dominant_awareness ? AWARENESS_RU[data.dominant_awareness] ?? data.dominant_awareness : "—",
    },
    {
      label: "Top CTA в нише",
      value: data.top_cta_verb ? `«${data.top_cta_verb}»` : "—",
    },
    {
      label: "Среднее CTA на странице",
      value: data.avg_cta_count != null ? String(data.avg_cta_count) : "—",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Niche Pulse</CardTitle>
        <p className="text-xs text-muted-foreground">6 цифр о вашей рекламной экосистеме</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {data.unused_triggers.length > 0 && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Blind spots — ниша молчит
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.unused_triggers.join(" · ")}
            </p>
          </div>
        )}

        {data.overused_patterns.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Cliché-зона — не повторяйте
            </p>
            <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              {data.overused_patterns.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
