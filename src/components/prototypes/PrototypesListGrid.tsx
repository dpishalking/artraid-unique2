import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { briefDisplayTitle } from "@/config/landingScenarios";
import { Reveal } from "@/components/Reveal";

export type PrototypeListItem = {
  id: string;
  brief: { product?: string; niche?: string; target?: string };
  status: string;
  created_at: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "ready")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Готов
      </span>
    );
  if (status === "generating")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[11px] font-semibold text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        Генерируется
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/30 px-2 py-0.5 text-[11px] font-semibold text-destructive">
      <AlertCircle className="h-3 w-3" />
      Ошибка
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

type Props = {
  prototypes: PrototypeListItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export function PrototypesListGrid({
  prototypes,
  loading,
  emptyTitle = "Пока пусто",
  emptyDescription = "Создайте первый прототип — система соберёт лендинг из 19 смысловых блоков за несколько минут.",
  emptyAction,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
      </div>
    );
  }

  if (prototypes.length === 0) {
    return (
      <Reveal>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 py-16 px-6 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/60">
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h2 className="font-display text-lg font-semibold mb-2">{emptyTitle}</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">{emptyDescription}</p>
          {emptyAction}
        </div>
      </Reveal>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prototypes.map((p, i) => {
        const title = briefDisplayTitle(p.brief as Record<string, unknown> | undefined);
        const sub = (p.brief as { niche?: string })?.niche || "";
        return (
          <Reveal key={p.id} delay={i * 40}>
            <Link to={`/p/${p.id}`} className="group block h-full">
              <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition-all duration-250 hover:border-primary/50 hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.2)] hover:-translate-y-0.5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-200" />

                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <h2 className="relative font-display font-semibold text-base leading-snug mb-1 line-clamp-2 flex-1">
                  {title}
                </h2>
                {sub && <p className="text-xs text-muted-foreground mb-3 truncate">{sub}</p>}

                <div className="relative flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto pt-3 border-t border-border">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  {formatDate(p.created_at)}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
