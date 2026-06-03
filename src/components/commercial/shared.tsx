import type { CommercialMetricStatus } from "@/lib/commercial/types";

export const STATUS_STYLE: Record<CommercialMetricStatus, string> = {
  green: "text-emerald-600",
  yellow: "text-amber-600",
  red: "text-red-600",
  empty: "text-muted-foreground",
};

export const STATUS_DOT: Record<CommercialMetricStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  empty: "bg-muted-foreground/40",
};

export function TrafficLight({ status }: { status: CommercialMetricStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      <span className={STATUS_STYLE[status]}>
        {status === "green" ? "Норма" : status === "yellow" ? "Риск" : status === "red" ? "Критично" : "—"}
      </span>
    </span>
  );
}

export function formatMetricValue(v: number | null, unit?: string | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  const formatted = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
  }).format(v);
  if (!unit || unit === "описание") return formatted;
  return `${formatted} ${unit}`;
}
