import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function AdminStatCard({ label, value, hint, className }: Props) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

