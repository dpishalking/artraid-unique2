import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Layers,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Wrench,
  Rocket,
  CalendarDays,
  CalendarRange,
  Filter,
  Zap,
  Clock,
  MousePointerClick,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { growthCycleHref } from "@/lib/growthCycle/routes";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuditPdfReport } from "./AuditPdfReport";
import { OfferScoreBlock, MarketContextBlock, MeclabsScoreBlock } from "./ConsultingBlocks";
import { ExecutiveSummary } from "./audit/ExecutiveSummary";
import { ReportSectionHeader } from "./audit/ReportSectionHeader";
import { ReportTabStrip } from "./audit/ReportTabStrip";
import { ReportSideNav } from "./audit/ReportSideNav";
import { ReportHero } from "./audit/ReportHero";
import { MidCta } from "./audit/MidCta";
import { FinalCta } from "./audit/FinalCta";
import { CountUp } from "./audit/CountUp";
import { WEB_BEFORE_AFTER, WEB_TOP_PROBLEMS } from "./audit/reportConstants";
import { reportPreviewUrl } from "@/lib/share/reportShareUrls";
import { useReportPageMeta } from "@/lib/share/useReportPageMeta";
import {
  BLOCK_STATUS,
  REPORT_CARD,
  REPORT_CARD_PAD,
  REPORT_MAX,
  REPORT_SHELL,
  SEV,
} from "./audit/reportDesign";
import { AuditFeedback } from "./audit/AuditFeedback";
import { cn } from "@/lib/utils";

const REPORT_TABS = [
  { id: "essence", label: "Суть" },
  { id: "money", label: "Деньги" },
  { id: "actions", label: "Действия" },
] as const;

export type AuditReportTabId = (typeof REPORT_TABS)[number]["id"];

/** Какой вкладке принадлежит якорь раздела (для переходов по `#id` со ссылки). */
const SECTION_TAB: Record<string, AuditReportTabId> = {
  "sec-summary": "essence",
  "sec-lever": "essence",
  "sec-problems": "essence",
  "sec-blocks": "essence",
  "sec-packaging": "essence",
  "sec-leaks": "money",
  "sec-growth": "money",
  "sec-ba": "money",
  "sec-waterfall": "money",
  "sec-readyfixes": "money",
  "sec-roadmap": "actions",
  "sec-cta": "actions",
};


export type Audit = {
  diagnosis: {
    metrics: { name: "Понятность" | "Ценность" | "Доверие" | "Действие"; score: number; comment: string }[];
    mainProblem: string;
    mainMoneyLeak: string;
    estimatedLossPercent: string;
    mainLever?: string;
  };
  problems: {
    severity: "critical" | "important" | "minor";
    title: string;
    whyItHurts: string;
    moneyImpact: string;
    howToFix: string[];
    effort: "1 день" | "1 неделя" | "1 месяц";
    impactScore: number;
    customerThought?: string;
  }[];
  blocks: {
    name: string;
    status: "critical" | "bad" | "weak" | "ok" | "good";
    priorityRank?: number;
    problem: string;
    whyImportant: string;
    howToFix: string;
    rewriteExample?: string;
    ctaVariants?: string[];
    testimonialScript?: string;
  }[];
  quickestWin?: {
    action: string;
    why: string;
    expectedEffect: string;
    effort: string;
  };
  moneyLeaks: {
    items: { reason: string; lossPercent: string; verification?: string }[];
    totalLoss: string;
  };
  growthPotential: {
    requestsGrowth: string;
    conversionGrowth: string;
    revenueLogic: string;
    verification?: string;
    confidence?: "высокий" | "средний" | "точечный";
  };
  beforeAfter: { label: string; before: string; after: string }[];
  roadmap: {
    quickWins: { problemIndex: number; action: string; expectedEffect: string }[];
    thisWeek: { problemIndex: number; action: string; expectedEffect: string }[];
    thisMonth: { problemIndex: number; action: string; expectedEffect: string }[];
  };
  funnel?: {
    stages: { name: string; percent: number; dropReason: string; isMainLeak: boolean }[];
    insight: string;
  };
  waterfall?: {
    currentConversion: number;
    steps: { problemIndex: number; label: string; uplift: number; rationale: string }[];
    finalConversion: number;
    insight: string;
  };
  offerScore?: {
    dream: number; dreamComment: string;
    likelihood: number; likelihoodComment: string;
    timeDelay: number; timeComment: string;
    effort: number; effortComment: string;
    totalScore: number; verdict: string; biggestLever: string;
  };
  marketContext?: {
    sophisticationLevel: number; sophisticationComment: string;
    awarenessLevel: "unaware" | "problem-aware" | "solution-aware" | "product-aware" | "most-aware";
    awarenessComment: string;
    mismatch: string;
    uniqueMechanism: string;
  };
  unitEconomics?: {
    niche: string;
    assumedAvgCheck: string;
    assumedCpc: string;
    assumedCurrentCr: string;
    estimatedCpl: string;
    estimatedCac: string;
    paybackVerdict: string;
    healthStatus: "healthy" | "tight" | "broken";
    uplift: string;
    disclaimer: string;
  };
  meclabsScore?: {
    motivation: number; motivationComment: string;
    valueProposition: number; valueComment: string;
    incentive: number; incentiveComment: string;
    friction: number; frictionComment: string;
    anxiety: number; anxietyComment: string;
    score: number; interpretation: string;
  };
  systemMessage: string;
  softOffer: { steps: string[]; goal: string };
  finalCta: string;
  firstScreenRewrite?: {
    h1: string;
    subtitle: string;
    bullets: string[];
    cta: string;
    microtext: string;
    proofNearby: string;
    removeList: string[];
    visualHint: string;
  };
  ctaPath?: {
    leadsTo: string;
    userSees: string;
    friction: string;
    afterForm: string;
  };
  proofMap?: { promise: string; proofThatCloses: string; missing: string }[];
  resistanceMap?: { moment: string; whatSiteSays: string; whatClientThinks: string; howToRespond: string }[];
  moneyHierarchy?: { surface: string[]; trust: string[]; product: string[] };
  hypotheses?: AuditHypothesisDraft[];
};

export type AuditHypothesisDraft = {
  title: string;
  why: string;
  expectedImpact: string;
  metricName: string;
  testWindow: string;
  guardrail?: string;
  priority: "high" | "medium" | "low";
  channel: "website" | "funnel" | "sales" | "offer" | "creative" | "research";
  problemIndex?: number;
};

function hostnameLabel(siteUrl?: string): string {
  if (!siteUrl) return "Сайт не указан";
  try {
    return new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`).hostname.replace(/^www\./, "");
  } catch {
    return siteUrl;
  }
}

function scoreColor(s: number) {
  if (s <= 3) return { bar: "bg-destructive", text: "text-destructive" };
  if (s <= 6) return { bar: "bg-orange-500", text: "text-orange-400" };
  if (s <= 8) return { bar: "bg-yellow-500", text: "text-yellow-400" };
  return { bar: "bg-money", text: "text-money" };
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

function ProblemCard({
  p,
  index,
  compact = false,
}: {
  p: Audit["problems"][number];
  index: number;
  compact?: boolean;
}) {
  const st = SEV[p.severity] ?? SEV.important;
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>
          <st.Icon className="h-3 w-3 shrink-0" />
          {st.label}
        </span>
        <span className="text-sm font-medium text-foreground">{p.title}</span>
        <span className="ml-auto text-[11px] font-medium text-money">Влияние {p.impactScore}/10</span>
      </div>
    );
  }
  return (
    <motion.div
      data-pdf-section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index, 3) * 0.05 }}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/30 p-5 transition-all hover:-translate-y-0.5 hover:bg-card/50"
    >
      <div className={`absolute left-0 top-0 h-full w-[3px] ${st.bar}`} />

      {/* Header */}
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="shrink-0 font-display text-xl font-bold text-muted-foreground/25 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h4 className="flex-1 font-display text-base font-semibold leading-snug text-foreground">
          {p.title}
        </h4>
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>
          <st.Icon className="h-3 w-3 shrink-0" />
          {st.label}
        </span>
      </div>

      {/* Customer thought — compact */}
      {p.customerThought && (
        <figure className="relative mt-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 pl-4">
          <span aria-hidden className="pointer-events-none absolute -left-px -top-1 select-none font-display text-2xl leading-none text-money/30">“</span>
          <blockquote className="line-clamp-2 text-sm italic leading-snug text-foreground/75">
            {p.customerThought}
          </blockquote>
          <figcaption className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">мысль клиента</figcaption>
        </figure>
      )}

      {/* Why it hurts + impact */}
      <div className="mt-3 flex items-start justify-between gap-3 text-sm">
        <p className="leading-relaxed text-foreground/80">{p.whyItHurts}</p>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-money">Влияние</span>
          <span className="font-display text-xl font-bold text-money tabular-nums">
            {p.impactScore}<span className="text-sm text-money/55">/10</span>
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-foreground/90">{p.moneyImpact}</p>

      <Accordion type="single" collapsible className="mt-3">
        <AccordionItem value="fix" className="border-0">
          <AccordionTrigger className="rounded-lg border border-border/40 px-3 py-2 text-sm font-medium hover:no-underline">
            Как исправить ({p.howToFix.length})
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <ul className="space-y-1.5">
              {p.howToFix.map((f, j) => (
                <li key={j} className="flex gap-2 text-sm text-foreground/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}

function BrowserMockup({
  variant,
  label,
  text,
  hostname,
}: {
  variant: "before" | "after";
  label: string;
  text: string;
  hostname: string;
}) {
  const isBefore = variant === "before";
  const tone = isBefore
    ? {
        frame: "border-destructive/30 bg-destructive/[0.04]",
        chrome: "bg-destructive/10 border-destructive/20",
        chip: "border-destructive/30 bg-destructive/15 text-destructive",
        ctaBg: "bg-muted text-muted-foreground border-border",
        textTone: "text-foreground/70",
        accent: "text-destructive",
        addr: "bg-background/40 text-muted-foreground",
        watermark: "✗",
      }
    : {
        frame: "border-money/30 bg-money/[0.05] shadow-[0_0_0_1px_hsl(var(--money)/0.15),0_25px_60px_-30px_hsl(var(--money)/0.4)]",
        chrome: "bg-money/10 border-money/20",
        chip: "border-money/30 bg-money/15 text-money",
        ctaBg: "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent",
        textTone: "text-foreground",
        accent: "text-money",
        addr: "bg-background/40 text-foreground/80",
        watermark: "✓",
      };

  return (
    <div className={`relative overflow-hidden rounded-xl border ${tone.frame}`}>
      {/* Browser chrome */}
      <div className={`flex items-center gap-2 border-b ${tone.chrome} px-3 py-2`}>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-money/60" />
        </div>
        <div className={`ml-2 flex-1 truncate rounded-md px-2 py-0.5 text-[10px] font-mono ${tone.addr}`}>
          {hostname}
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone.chip}`}>
          {isBefore ? "✗ Сейчас" : "✓ Стало"}
        </span>
      </div>
      {/* Page content */}
      <div className="relative px-5 py-6">
        <div className={`text-[10px] uppercase tracking-wider ${tone.accent} mb-2`}>{label}</div>
        <p className={`font-display text-base font-semibold leading-snug ${tone.textTone}`}>
          {text}
        </p>
        {/* Fake CTA mock */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium ${tone.ctaBg}`}>
            {isBefore ? "Отправить" : "Получить расчёт →"}
          </div>
          <div className="h-2 flex-1 rounded-full bg-secondary/60" />
        </div>
        {/* Skeleton lines */}
        <div className="mt-4 space-y-1.5 opacity-50">
          <div className="h-1.5 w-11/12 rounded bg-secondary/60" />
          <div className="h-1.5 w-9/12 rounded bg-secondary/60" />
          <div className="h-1.5 w-7/12 rounded bg-secondary/60" />
        </div>
        {/* Big watermark */}
        <div className={`pointer-events-none absolute right-3 top-2 select-none font-display text-5xl font-black opacity-[0.06] ${tone.accent}`}>
          {tone.watermark}
        </div>
      </div>
    </div>
  );
}

function MoneyWaterfall({
  waterfall,
}: {
  waterfall: NonNullable<Audit["waterfall"]>;
}) {
  const { currentConversion, steps, finalConversion } = waterfall;
  // Накопленные значения по шагам
  const cumulative: number[] = [];
  let acc = currentConversion;
  for (const s of steps) {
    acc += s.uplift;
    cumulative.push(acc);
  }
  const max = Math.max(finalConversion, ...cumulative, currentConversion) * 1.15;
  const heightPct = (v: number) => `${Math.max(2, (v / max) * 100)}%`;
  const upliftHeightPct = (u: number) => `${Math.max(1, (u / max) * 100)}%`;
  const totalUplift = +(finalConversion - currentConversion).toFixed(2);
  const multiplier = currentConversion > 0 ? (finalConversion / currentConversion).toFixed(1) : "—";

  // Палитра: для каждого uplift свой акцент
  const upliftColors = [
    "bg-primary",
    "bg-accent",
    "bg-money",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-primary/70",
  ];

  return (
    <div className="space-y-5">
      {/* График */}
      <div className="relative rounded-xl border border-border/60 bg-background/40 p-4">
        <div className="flex h-56 items-end gap-2 sm:gap-3">
          {/* Текущая конверсия */}
          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div className="mb-1 font-display text-xs font-semibold text-muted-foreground">
              {currentConversion.toFixed(1)}%
            </div>
            <div
              className="w-full rounded-t-md border border-muted-foreground/30 bg-muted/60"
              style={{ height: heightPct(currentConversion) }}
              title={`Текущая конверсия ${currentConversion}%`}
            />
            <div className="mt-1.5 line-clamp-2 text-center text-[10px] text-muted-foreground">
              Сейчас
            </div>
          </div>

          {/* Шаги-аплифты */}
          {steps.map((s, i) => {
            const baseV = i === 0 ? currentConversion : cumulative[i - 1];
            const color = upliftColors[i % upliftColors.length];
            return (
              <div
                key={i}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-end justify-end"
              >
                <div className="mb-1 self-center font-display text-xs font-semibold text-money">
                  +{s.uplift.toFixed(1)}
                </div>
                {/* Стек: серый base + цветной uplift сверху */}
                <div className="relative w-full" style={{ height: heightPct(baseV + s.uplift) }}>
                  {/* Невидимая база (просто оставляет место под uplift) */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-transparent"
                    style={{ height: `${(baseV / (baseV + s.uplift)) * 100}%` }}
                  />
                  {/* Цветной uplift поверх */}
                  <div
                    className={`absolute left-0 w-full ${color} rounded-t-md opacity-90 transition-opacity group-hover:opacity-100`}
                    style={{
                      bottom: `${(baseV / (baseV + s.uplift)) * 100}%`,
                      height: `${(s.uplift / (baseV + s.uplift)) * 100}%`,
                    }}
                  />
                  {/* Пунктирная база */}
                  <div
                    className="absolute bottom-0 left-0 w-full border-t border-dashed border-border"
                    style={{ top: `${100 - (baseV / (baseV + s.uplift)) * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 line-clamp-2 text-center text-[10px] text-foreground/80">
                  {s.label}
                </div>
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden w-44 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover p-2 text-[11px] text-popover-foreground shadow-lg group-hover:block">
                  <div className="font-medium">{s.label}</div>
                  <div className="mt-0.5 text-money">+{s.uplift.toFixed(2)} п.п.</div>
                  <div className="mt-0.5 text-muted-foreground">{s.rationale}</div>
                </div>
              </div>
            );
          })}

          {/* Итог */}
          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div className="mb-1 font-display text-xs font-semibold text-money">
              {finalConversion.toFixed(1)}%
            </div>
            <div
              className="w-full rounded-t-md border border-money/40 bg-gradient-to-t from-money/40 to-money/80 shadow-[0_0_0_1px_hsl(var(--money)/0.25),0_15px_40px_-20px_hsl(var(--money)/0.6)]"
              style={{ height: heightPct(finalConversion) }}
            />
            <div className="mt-1.5 line-clamp-2 text-center text-[10px] font-medium text-money">
              Итог
            </div>
          </div>
        </div>
      </div>

      {/* Сводка */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">CR сейчас</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {currentConversion.toFixed(1)}<span className="text-base text-muted-foreground">%</span>
          </div>
        </div>
        <div className="rounded-xl border border-money/30 bg-money/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-money">Прирост</div>
          <div className="mt-1 font-display text-2xl font-bold text-money">
            +{totalUplift.toFixed(1)}<span className="text-base">п.п.</span>
          </div>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-primary">CR после фиксов</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {finalConversion.toFixed(1)}<span className="text-base text-muted-foreground">%</span>
            <span className="ml-2 align-middle text-xs font-semibold text-primary">×{multiplier}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforeAfterMockup({ item }: { item: Audit["beforeAfter"][number] }) {
  // hostname для адресной строки
  let hostname = "your-site.ru";
  try {
    const u = new URL(window.location.href);
    hostname = u.hostname;
  } catch {}
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <span>✍️</span>
        <span>{item.label}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <BrowserMockup variant="before" label={item.label} text={item.before} hostname={hostname} />
        <div className="hidden items-center justify-center md:flex">
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="h-6 w-6 text-money" />
            <span className="rounded-full border border-money/30 bg-money/10 px-2 py-0.5 text-[10px] font-medium text-money">
              fix
            </span>
          </div>
        </div>
        <BrowserMockup variant="after" label={item.label} text={item.after} hostname={hostname} />
      </div>
    </div>
  );
}

function RoadmapColumn({
  title,
  subtitle,
  icon,
  accent,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: "money" | "primary" | "orange";
  items: { problemIndex: number; action: string; expectedEffect: string }[];
}) {
  const styles = {
    money: {
      border: "border-money/30",
      bg: "bg-money/5",
      chip: "bg-money/15 text-money border-money/30",
      effect: "text-money",
    },
    primary: {
      border: "border-primary/30",
      bg: "bg-primary/5",
      chip: "bg-primary/15 text-primary border-primary/30",
      effect: "text-primary",
    },
    orange: {
      border: "border-orange-500/30",
      bg: "bg-orange-500/5",
      chip: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      effect: "text-orange-400",
    },
  }[accent];

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-5 backdrop-blur`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${styles.chip}`}>
            {icon}
          </span>
          <div>
            <div className="font-display text-base font-semibold text-foreground">{title}</div>
            <div className="text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles.chip}`}>
          {items?.length || 0}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items?.length ? (
          items.map((it, i) => (
            <li
              key={i}
              className="rounded-xl border border-border/60 bg-background/50 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                  {i + 1}
                </span>
                <p className="text-sm leading-snug text-foreground">{it.action}</p>
              </div>
              <div className={`mt-2 pl-7 font-display text-xs font-semibold ${styles.effect}`}>
                {it.expectedEffect}
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-border/40 bg-background/30 p-3 text-xs text-muted-foreground">
            Здесь пока пусто — основной фокус в других колонках
          </li>
        )}
      </ul>
    </div>
  );
}

export function AuditDashboard({
  audit,
  onReset,
  siteUrl,
  shareId,
  readOnly = false,
  projectId,
}: {
  audit: Audit;
  onReset: () => void;
  siteUrl?: string;
  shareId?: string | null;
  readOnly?: boolean;
  /** Для переходов в оффер/прототип с контекстом проекта из аудита */
  projectId?: string;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  /** PDF-вёрстка монтируется только на время экспорта — иначе раздувает scrollHeight страницы. */
  const [pdfLayerMounted, setPdfLayerMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportTab, setReportTab] = useState<AuditReportTabId>("essence");

  const hostname = useMemo(() => hostnameLabel(siteUrl), [siteUrl]);
  const sortedProblems = useMemo(
    () =>
      [...audit.problems].sort(
        (a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0) || (a.severity === "critical" ? -1 : 0),
      ),
    [audit.problems],
  );
  const weakBlocks = useMemo(
    () =>
      [...(audit.blocks ?? [])]
        .filter((b) => b.status === "critical" || b.status === "bad")
        .sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99)),
    [audit.blocks],
  );
  const showQuickestWin =
    audit.quickestWin && !(audit.roadmap?.quickWins?.length);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw || !SECTION_TAB[raw]) return;
    setReportTab(SECTION_TAB[raw]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, []);

  const shareUrl = shareId ? reportPreviewUrl(shareId) : null;
  useReportPageMeta(audit, siteUrl, shareId);

  const handleCopyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Ссылка скопирована — в мессенджере будет превью с цифрой потерь");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    setPdfLayerMounted(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const node = pdfRef.current;
      if (!node) {
        toast.error("Не удалось подготовить PDF");
        return;
      }

      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      await new Promise((r) => setTimeout(r, 100));

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const PAGE_W = pdf.internal.pageSize.getWidth();
      const PAGE_H = pdf.internal.pageSize.getHeight();
      const MARGIN = 14;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const MAX_H = PAGE_H - MARGIN * 2;
      const GAP = 6;
      const BG = "#ffffff";
      pdf.setFillColor(BG);
      pdf.rect(0, 0, PAGE_W, PAGE_H, "F");

      const sections = Array.from(
        node.querySelectorAll<HTMLElement>("[data-pdf-section]")
      );

      let cursorY = MARGIN;
      const renderImage = async (el: HTMLElement) => {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: BG,
          windowWidth: el.scrollWidth,
        });
        const ratio = canvas.height / canvas.width;
        return {
          data: canvas.toDataURL("image/jpeg", 0.92),
          ratio,
          h: CONTENT_W * ratio,
        };
      };

      const addNewPage = () => {
        pdf.addPage();
        pdf.setFillColor(BG);
        pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
        cursorY = MARGIN;
      };

      for (const section of sections) {
        const { data, ratio, h } = await renderImage(section);
        // Никогда не режем секцию по середине — атомарная вставка.
        if (h > MAX_H) {
          // Слишком высокая — масштабируем под полную страницу целиком, центрируем.
          if (cursorY > MARGIN) addNewPage();
          const fitH = MAX_H;
          const fitW = fitH / ratio;
          const offsetX = MARGIN + (CONTENT_W - fitW) / 2;
          pdf.addImage(data, "JPEG", offsetX, MARGIN, fitW, fitH);
          cursorY = MARGIN + fitH + GAP;
        } else {
          if (cursorY + h > PAGE_H - MARGIN) addNewPage();
          pdf.addImage(data, "JPEG", MARGIN, cursorY, CONTENT_W, h);
          cursorY += h + GAP;
        }
      }
      pdf.save(`razbor-sayta-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF готов — можно передавать ассистенту");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сохранить PDF");
    } finally {
      setPdfLayerMounted(false);
      setExporting(false);
    }
  };

  return (
    <div ref={reportRef} className={REPORT_SHELL}>
      {pdfLayerMounted &&
        createPortal(
          <div className="pdf-export-sink" aria-hidden>
            <AuditPdfReport ref={pdfRef} audit={audit} siteUrl={siteUrl} />
          </div>,
          document.body,
        )}

      <div className="mb-8" data-pdf-hide>
        <ReportHero
          audit={audit}
          hostname={hostname}
          onExportPdf={handleExportPdf}
          exporting={exporting}
          shareUrl={shareUrl}
          copied={copied}
          onCopyShare={handleCopyShare}
          onReset={onReset}
          readOnly={readOnly}
        />
      </div>

      <div className="mb-6 lg:hidden" data-pdf-hide>
        <ReportTabStrip<AuditReportTabId> tabs={REPORT_TABS} active={reportTab} onChange={setReportTab} />
      </div>

      <div className="mb-12 lg:grid lg:grid-cols-[minmax(140px,168px)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-10">
        <ReportSideNav<AuditReportTabId> tabs={REPORT_TABS} active={reportTab} onChange={setReportTab} />
        <div className={cn(REPORT_MAX, "space-y-8")}>
        <div className={cn("space-y-8", reportTab !== "essence" && "hidden")}>
          <div id="sec-summary" className="xl:grid xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] xl:gap-6 xl:items-start">
            <ExecutiveSummary audit={audit} siteUrl={siteUrl} />
            {showQuickestWin && (
              <motion.div
                {...fade(0.12)}
                data-pdf-section
                className="rounded-2xl border border-border bg-card p-6 xl:mt-0"
              >
                <div className="text-xs font-medium text-muted-foreground">Сделать первым</div>
                <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                  {audit.quickestWin!.action}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{audit.quickestWin!.why}</p>
              </motion.div>
            )}
          </div>

      <motion.div {...fade(0.1)} id="sec-problems">
        <div data-pdf-section className="space-y-5">
          <ReportSectionHeader
            eyebrow="Суть"
            title={`Что мешает ${hostname} продавать`}
            description={`Топ-${WEB_TOP_PROBLEMS} по влиянию · остальное в PDF`}
            icon={AlertTriangle}
            iconClassName="text-destructive"
          />
        <div className="grid gap-3 xl:grid-cols-2">
          {sortedProblems.slice(0, WEB_TOP_PROBLEMS).map((p, i) => (
            <ProblemCard key={`top-${i}`} p={p} index={i} />
          ))}
        </div>
          {sortedProblems.length > 0 && <MidCta />}
          {sortedProblems.length > WEB_TOP_PROBLEMS && (
            <Accordion type="single" collapsible>
              <AccordionItem value="more-problems" className="border-0">
                <AccordionTrigger className="rounded-lg border border-border/40 bg-card/30 px-4 py-3 text-sm font-medium hover:no-underline">
                  Ещё {sortedProblems.length - WEB_TOP_PROBLEMS} проблем
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-3">
                  {sortedProblems.slice(WEB_TOP_PROBLEMS).map((p, i) => (
                    <ProblemCard key={`rest-${i}`} p={p} index={WEB_TOP_PROBLEMS + i} compact />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </motion.div>

      {showQuickestWin && (
        <motion.div {...fade(0.12)} data-pdf-section className="rounded-2xl border border-border bg-card p-6 xl:hidden">
          <div className="text-xs font-medium text-muted-foreground">Сделать первым</div>
          <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">{audit.quickestWin!.action}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{audit.quickestWin!.why}</p>
        </motion.div>
      )}

      {weakBlocks.length > 0 && (
      <motion.div {...fade(0.15)} id="sec-blocks">
        <div data-pdf-section className="space-y-5">
          <ReportSectionHeader
            eyebrow="Суть"
            title={`Где ${hostname} проседает`}
            description="Только критичные и провальные · полный разбор в PDF"
            icon={Layers}
          />
        <Accordion type="multiple" className="space-y-2">
          {weakBlocks.map((b, i) => {
            const st = BLOCK_STATUS[b.status] ?? BLOCK_STATUS["weak"];
            const isCriticalOrBad = b.status === "critical" || b.status === "bad";
            return (
              <AccordionItem
                key={i}
                value={`b-${i}`}
                data-pdf-section
                className="overflow-hidden rounded-xl border border-border/40 bg-card/30"
              >
                <div className="relative">
                  <div className={`absolute left-0 top-0 h-full w-1 ${st.bar}`} />
                  <AccordionTrigger className="px-5 py-3.5 hover:no-underline">
                    <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                      {b.priorityRank && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {b.priorityRank}
                        </span>
                      )}
                      <span className="font-display text-base font-semibold text-foreground">
                        {b.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.chip}`}
                      >
                        <st.Icon className="h-3.5 w-3.5 shrink-0" />
                        {st.label}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Проблема</div>
                        <p className="mt-1 text-sm text-foreground/90">{b.problem}</p>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Почему важно</div>
                        <p className="mt-1 text-sm text-foreground/85">{b.whyImportant}</p>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-money">Как исправить</div>
                        <p className="mt-1 text-sm font-medium text-foreground">{b.howToFix}</p>
                      </div>
                      {b.rewriteExample && isCriticalOrBad && (
                        <div className="rounded-lg border border-money/20 bg-money/5 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-money mb-1.5">Готовый текст →</div>
                          <p className="text-sm text-foreground/90 italic">"{b.rewriteExample}"</p>
                        </div>
                      )}
                      {b.ctaVariants && b.ctaVariants.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-primary mb-1.5">Варианты CTA</div>
                          <div className="flex flex-wrap gap-2">
                            {b.ctaVariants.map((v, j) => (
                              <span key={j} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {b.testimonialScript && (
                        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-orange-400 mb-1.5">Скрипт сбора отзывов</div>
                          <p className="text-sm text-foreground/85 whitespace-pre-line">{b.testimonialScript}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
        </div>
      </motion.div>
      )}

          {(audit.offerScore || audit.marketContext || audit.meclabsScore) && (
            <div id="sec-packaging">
              <Accordion type="single" collapsible>
                <AccordionItem value="packaging" className="overflow-hidden rounded-2xl border border-border/40 bg-card/30">
                  <AccordionTrigger className="px-5 py-4 font-display text-base font-semibold hover:no-underline md:px-6">
                    Оффер и рынок · подробный разбор
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 border-t border-border/30 px-2 pb-4 pt-4 md:px-3">
                    {audit.offerScore && <OfferScoreBlock data={audit.offerScore} compact />}
                    {audit.marketContext && <MarketContextBlock data={audit.marketContext} compact />}
                    {audit.meclabsScore && <MeclabsScoreBlock data={audit.meclabsScore} compact />}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>

        <div className={cn("space-y-8", reportTab !== "money" && "hidden")}>
      <motion.div id="sec-leaks" {...fade(0.2)}>
        <div data-pdf-section className="space-y-5">
          <ReportSectionHeader
            eyebrow="Деньги"
            title={`Куда ${hostname} теряет деньги`}
            icon={TrendingDown}
            iconClassName="text-destructive"
          />
        <div className="flex items-baseline justify-between gap-4 border-b border-border/30 pb-5">
          <span className="text-sm font-medium text-muted-foreground">Суммарная потеря от трафика</span>
          <CountUp
            value={audit.moneyLeaks.totalLoss}
            duration={1.4}
            className="font-display text-3xl font-bold text-destructive sm:text-4xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
        </div>
        <ul className="space-y-2">
          {audit.moneyLeaks.items.map((it, i) => (
            <li
              key={i}
              className="rounded-lg border border-border/40 bg-card/30 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground/90">{it.reason}</span>
                <span className="font-display text-sm font-semibold text-destructive" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {it.lossPercent}
                </span>
              </div>
              {it.verification && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Filter className="mt-0.5 h-3 w-3 shrink-0" />
                  <span><span className="font-medium text-foreground/70">Замер:</span> {it.verification}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
        </div>
      </motion.div>

      <motion.div id="sec-growth" {...fade(0.25)}>
        <div data-pdf-section className="space-y-5">
          <ReportSectionHeader eyebrow="Деньги" title="Что вы получите после правок" icon={TrendingUp} iconClassName="text-money" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/40 bg-card/30 p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-money">Рост заявок</div>
            <CountUp
              value={audit.growthPotential.requestsGrowth}
              duration={1.4}
              className="mt-1 block font-display text-3xl font-bold text-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
          <div className="rounded-xl border border-border/40 bg-card/30 p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-money">Рост конверсии</div>
            <CountUp
              value={audit.growthPotential.conversionGrowth}
              duration={1.4}
              className="mt-1 block font-display text-3xl font-bold text-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">{audit.growthPotential.revenueLogic}</p>
        </div>
      </motion.div>

      {audit.beforeAfter?.length > 0 && (
        <motion.div {...fade(0.3)} id="sec-ba">
          <div data-pdf-section className="space-y-5">
            <ReportSectionHeader
              eyebrow="Деньги"
              title="Было / Стало"
              description={`Топ-${WEB_BEFORE_AFTER} · остальное в PDF`}
              icon={Wrench}
            />
          <div className="space-y-4">
            {audit.beforeAfter.slice(0, WEB_BEFORE_AFTER).map((b, i) => (
              <div
                key={i}
                data-pdf-section
                className="rounded-2xl border border-border/40 bg-card/30 p-5"
              >
                <BeforeAfterMockup item={b} />
              </div>
            ))}
          </div>
          </div>
        </motion.div>
      )}

      {audit.waterfall?.steps?.length ? (
        <motion.div id="sec-waterfall" {...fade(0.315)}>
          <div data-pdf-section className="space-y-5">
            <ReportSectionHeader
              eyebrow="Деньги"
              title="Каскад роста конверсии"
              icon={BarChart3}
              iconClassName="text-money"
            />
            <MoneyWaterfall waterfall={audit.waterfall} />
            <p className="text-sm font-medium leading-relaxed text-foreground/95">{audit.waterfall.insight}</p>
          </div>
        </motion.div>
      ) : null}

      {(audit.firstScreenRewrite || audit.ctaPath) && (
        <motion.div {...fade(0.318)} id="sec-readyfixes">
          <div data-pdf-section className="space-y-5">
          <ReportSectionHeader
            eyebrow="Деньги"
            title="Готовые правки"
            description="Первый экран и путь после кнопки"
            icon={Sparkles}
          />
          {audit.firstScreenRewrite && (
          <>
          <div className="rounded-xl border border-border/40 bg-card/30 p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">H1</div>
            <p className="mt-1 font-display text-xl font-bold leading-tight text-foreground">
              {audit.firstScreenRewrite.h1}
            </p>
            <p className="mt-2 text-sm text-foreground/85">{audit.firstScreenRewrite.subtitle}</p>
            <ul className="mt-4 space-y-1.5">
              {audit.firstScreenRewrite.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground">
                {audit.firstScreenRewrite.cta}
              </div>
              <span className="text-xs text-muted-foreground">{audit.firstScreenRewrite.microtext}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-money">Что показать рядом</div>
              <p className="mt-1.5 text-sm text-foreground/90">{audit.firstScreenRewrite.proofNearby}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-destructive">Что убрать</div>
              <ul className="mt-1.5 space-y-1">
                {audit.firstScreenRewrite.removeList.map((r, i) => (
                  <li key={i} className="text-sm text-foreground/90">— {r}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-primary">Визуал</div>
              <p className="mt-1.5 text-sm text-foreground/90">{audit.firstScreenRewrite.visualHint}</p>
            </div>
          </div>
          </>
          )}
          {audit.ctaPath && (
          <div className={cn("space-y-3", audit.firstScreenRewrite && "border-t border-border/30 pt-5")}>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MousePointerClick className="h-4 w-4 text-orange-400" />
            Путь после кнопки
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Куда ведёт</div>
              <p className="mt-1 text-sm font-medium text-foreground">{audit.ctaPath.leadsTo}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Что видит</div>
              <p className="mt-1 text-sm text-foreground/90">{audit.ctaPath.userSees}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-destructive">Где трение</div>
              <p className="mt-1 text-sm text-foreground/90">{audit.ctaPath.friction}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-money">Что после формы</div>
              <p className="mt-1 text-sm text-foreground/90">{audit.ctaPath.afterForm}</p>
            </div>
          </div>
          </div>
          )}
          </div>
        </motion.div>
      )}

        </div>

        <div className={cn("space-y-8", reportTab !== "actions" && "hidden")}>
      {projectId && (audit.hypotheses?.length ?? 0) > 0 && (
        <motion.div
          {...fade(0.08)}
          className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-foreground">
              {audit.hypotheses!.length} гипотез готовы к внедрению
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Работа с гипотезами — в отдельном контуре «Цикл внедрения» в лаборатории, не в обзоре проекта.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 bg-gradient-money text-primary-foreground">
            <Link to={growthCycleHref(projectId)}>
              Открыть цикл внедрения
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </motion.div>
      )}
      {audit.roadmap && (
        <motion.div {...fade(0.32)} id="sec-roadmap">
          <div data-pdf-section className="space-y-5">
            <ReportSectionHeader
              eyebrow="Действия"
              title={`Что делать ${hostname} прямо сейчас`}
              description="Сортировка по ROI: где быстрее всего получить деньги"
              icon={Rocket}
              iconClassName="text-money"
            />
            <div className="grid gap-3 lg:grid-cols-3">
            <RoadmapColumn
              title="Сегодня"
              subtitle="1 день · максимальный ROI"
              icon={<Rocket className="h-4 w-4" />}
              accent="money"
              items={audit.roadmap.quickWins}
            />
            <RoadmapColumn
              title="На неделю"
              subtitle="до 7 дней работы"
              icon={<CalendarDays className="h-4 w-4" />}
              accent="primary"
              items={audit.roadmap.thisWeek}
            />
            <RoadmapColumn
              title="На месяц"
              subtitle="стратегические правки"
              icon={<CalendarRange className="h-4 w-4" />}
              accent="orange"
              items={audit.roadmap.thisMonth}
            />
            </div>
          </div>
        </motion.div>
      )}

        </div>

      <FinalCta finalCta={audit.finalCta} hostname={hostname} />

        {shareId && <AuditFeedback auditId={shareId} />}
        </div>
      </div>
    </div>
  );
}
