import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  error: "bg-red-500/15 text-red-700 dark:text-red-400",
  blocked: "bg-red-500/15 text-red-700 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge variant="secondary" className={cn("font-normal capitalize", STATUS_STYLES[key])}>
      {status}
    </Badge>
  );
}
