import type { NicheInsights } from "@/lib/competitors/deriveNicheInsights";

type Props = {
  insights: NicheInsights;
  generatedAt: string;
};

export function NicheExecutiveSummary({ insights, generatedAt }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-6 space-y-5">
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Обновлено{" "}
          {new Date(generatedAt).toLocaleString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-lg font-semibold leading-snug max-w-3xl">
          {insights.topRecommendation}
        </p>
      </div>

      {insights.verdicts.length > 0 && (
        <ul className="space-y-3 border-t border-border/60 pt-5">
          {insights.verdicts.map((v) => (
            <li key={v.id} className="space-y-0.5">
              <p className="text-sm font-medium leading-snug">{v.headline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
