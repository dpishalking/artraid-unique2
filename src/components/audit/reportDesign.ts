import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  Minus,
  Skull,
  ThumbsDown,
} from "lucide-react";
import type { Audit } from "@/components/AuditDashboard";

/** Типографика и карточки отчёта — единая шкала. */
export const REPORT_EYEBROW =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";
export const REPORT_H3 =
  "font-display text-2xl font-semibold tracking-tight text-foreground";
export const REPORT_H3_SM =
  "font-display text-xl font-semibold tracking-tight text-foreground";
export const REPORT_CARD =
  "rounded-2xl border border-border/50 bg-card/80 shadow-sm backdrop-blur";
export const REPORT_CARD_PAD = "p-6 md:p-7";
/** Внешняя оболочка отчёта — одна ширина на весь экран. */
export const REPORT_SHELL = "mx-auto w-full max-w-[1680px] px-0 sm:px-2 lg:px-4";
/** Контентная колонка — на всю ширину родителя, без второго max-width. */
export const REPORT_MAX = "w-full min-w-0";
export const REPORT_WIDE = "w-full min-w-0";

export type SeverityStyle = {
  label: string;
  Icon: LucideIcon;
  bar: string;
  chip: string;
  glow: string;
};

export const SEV: Record<Audit["problems"][number]["severity"], SeverityStyle> = {
  critical: {
    label: "Критично",
    Icon: CircleAlert,
    bar: "bg-destructive",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
    glow: "shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]",
  },
  important: {
    label: "Важно",
    Icon: AlertTriangle,
    bar: "bg-orange-500",
    chip: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    glow: "",
  },
  minor: {
    label: "Можно улучшить",
    Icon: CircleDot,
    bar: "bg-yellow-500",
    chip: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    glow: "",
  },
};

export type BlockStatusStyle = {
  label: string;
  Icon: LucideIcon;
  chip: string;
  bar: string;
};

export const BLOCK_STATUS: Record<Audit["blocks"][number]["status"], BlockStatusStyle> = {
  critical: {
    label: "Критично",
    Icon: Skull,
    chip: "bg-destructive/20 text-destructive border-destructive/40",
    bar: "bg-destructive",
  },
  bad: {
    label: "Провал",
    Icon: Ban,
    chip: "bg-destructive/15 text-destructive border-destructive/30",
    bar: "bg-destructive",
  },
  weak: {
    label: "Слабо",
    Icon: ThumbsDown,
    chip: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    bar: "bg-orange-500",
  },
  ok: {
    label: "Норм",
    Icon: Minus,
    chip: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    bar: "bg-yellow-500",
  },
  good: {
    label: "Сильно",
    Icon: CheckCircle2,
    chip: "bg-money/15 text-money border-money/30",
    bar: "bg-money",
  },
};
