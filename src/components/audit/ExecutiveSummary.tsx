import type { Audit } from "../AuditDashboard";
import { Donut } from "./Donut";

/** 4 точки давления — на всю ширину колонки отчёта. */
export function ExecutiveSummary({ audit }: { audit: Audit; siteUrl?: string }) {
  return (
    <div
      data-pdf-section
      className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-6"
    >
      <p className="text-xs font-medium text-muted-foreground">Четыре точки давления</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 lg:gap-10">
        {audit.diagnosis.metrics.map((m) => (
          <Donut key={m.name} value={m.score} max={10} label={m.name} />
        ))}
      </div>
    </div>
  );
}
