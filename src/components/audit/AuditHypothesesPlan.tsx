import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Lock,
  Megaphone,
  MousePointerClick,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createHypothesis } from "@/lib/hypotheses/api";
import { saveHypothesisMethodology } from "@/lib/hypotheses/api";
import {
  HYPOTHESIS_CHANNELS,
  type HypothesisChannel,
} from "@/lib/hypotheses/methodology";
import { HypothesisProtocolModal } from "@/components/hypotheses/HypothesisProtocolModal";
import type { Hypothesis } from "@/lib/hypotheses/api";
import type { AuditHypothesisDraft } from "@/components/AuditDashboard";
import { REPORT_CARD, REPORT_CARD_PAD } from "@/components/audit/reportDesign";

type Props = {
  hypotheses: AuditHypothesisDraft[];
  projectId?: string;
  siteUrl?: string;
};

const CHANNEL_LABEL: Record<AuditHypothesisDraft["channel"], string> = {
  website: "Сайт",
  offer: "Оффер",
  funnel: "Воронка",
  sales: "Продажи",
  creative: "Реклама",
  research: "Research",
};

const CHANNEL_ICON: Record<AuditHypothesisDraft["channel"], LucideIcon> = {
  website: MousePointerClick,
  offer: ShoppingBag,
  funnel: Target,
  sales: Users,
  creative: Megaphone,
  research: Search,
};

const PRIORITY_LABEL: Record<AuditHypothesisDraft["priority"], string> = {
  high: "Сначала",
  medium: "Дальше",
  low: "Потом",
};

const PRIORITY_STYLES: Record<
  AuditHypothesisDraft["priority"],
  { chip: string; ring: string; dot: string }
> = {
  high: {
    chip: "bg-money/15 text-money border-money/30",
    ring: "ring-money/20",
    dot: "bg-money",
  },
  medium: {
    chip: "bg-primary/15 text-primary border-primary/30",
    ring: "ring-primary/15",
    dot: "bg-primary",
  },
  low: {
    chip: "bg-muted text-muted-foreground border-border",
    ring: "ring-border/40",
    dot: "bg-muted-foreground",
  },
};

const PRIORITY_ORDER: Record<AuditHypothesisDraft["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function FilterChip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
          active ? "bg-primary/15 text-primary" : "bg-muted text-foreground/70",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function HypothesisCard({
  h,
  index,
  busy,
  takenAt,
  onTake,
  onLogin,
}: {
  h: AuditHypothesisDraft;
  index: number;
  busy: boolean;
  takenAt: boolean;
  onTake: () => void;
  onLogin: () => void;
}) {
  const { user } = useAuth();
  const ChannelIcon = CHANNEL_ICON[h.channel];
  const styles = PRIORITY_STYLES[h.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      data-pdf-section
      className={cn(
        REPORT_CARD,
        "flex h-full flex-col gap-4 p-5 ring-1 ring-inset transition-shadow md:p-6",
        styles.ring,
        takenAt && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
              styles.chip,
            )}
          >
            {index + 1}
          </span>
          <Badge variant="outline" className={cn("border", styles.chip)}>
            <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", styles.dot)} />
            {PRIORITY_LABEL[h.priority]}
          </Badge>
          <Badge variant="secondary" className="inline-flex items-center gap-1">
            <ChannelIcon className="h-3 w-3" />
            {CHANNEL_LABEL[h.channel]}
          </Badge>
        </div>
      </div>

      <p className="font-display text-base font-semibold leading-snug text-foreground md:text-[17px]">
        {h.title}
      </p>

      {h.why && (
        <p className="text-sm leading-relaxed text-muted-foreground">{h.why}</p>
      )}

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        {h.expectedImpact && (
          <div className="rounded-lg bg-money/[0.06] px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-money/90">
              Эффект
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-money">{h.expectedImpact}</dd>
          </div>
        )}
        {h.metricName && (
          <div className="rounded-lg bg-background/40 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Метрика
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{h.metricName}</dd>
          </div>
        )}
        {h.testWindow && (
          <div className="rounded-lg bg-background/40 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Срок
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{h.testWindow}</dd>
          </div>
        )}
        {h.guardrail && (
          <div className="rounded-lg bg-background/40 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Не ухудшить
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{h.guardrail}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        {takenAt ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-money">
            <CheckCircle2 className="h-4 w-4" />
            Уже в работе
          </span>
        ) : !user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onLogin}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Lock className="mr-2 h-4 w-4" />
            Войдите, чтобы взять
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onTake}
            disabled={busy}
            className="bg-gradient-money text-primary-foreground shadow-glow"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="mr-2 h-4 w-4" />
            )}
            Взять в работу
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function AuditHypothesesPlan({ hypotheses, projectId, siteUrl }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<HypothesisChannel | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [taken, setTaken] = useState<Record<number, string>>({});
  const [protocolTarget, setProtocolTarget] = useState<Hypothesis | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const sortedHypotheses = useMemo(
    () =>
      [...(hypotheses ?? [])].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      ),
    [hypotheses],
  );

  const channelsInList = useMemo(() => {
    const counts = new Map<HypothesisChannel, number>();
    sortedHypotheses.forEach((h) => {
      counts.set(h.channel, (counts.get(h.channel) ?? 0) + 1);
    });
    return HYPOTHESIS_CHANNELS.filter((c) => (counts.get(c.id) ?? 0) > 0).map((c) => ({
      id: c.id,
      count: counts.get(c.id) ?? 0,
    }));
  }, [sortedHypotheses]);

  const filtered = useMemo(
    () =>
      activeChannel === "all"
        ? sortedHypotheses
        : sortedHypotheses.filter((h) => h.channel === activeChannel),
    [sortedHypotheses, activeChannel],
  );

  const visible = showAll ? filtered : filtered.slice(0, 6);

  const handleLogin = () => {
    const returnTo = projectId ? `/projects/${projectId}` : "/cabinet";
    navigate(`/auth?next=${encodeURIComponent(returnTo)}`);
  };

  const handleTake = async (originalIndex: number, h: AuditHypothesisDraft) => {
    if (!user) {
      handleLogin();
      return;
    }
    if (!projectId) {
      toast.error("Привяжите аудит к проекту, чтобы взять гипотезу в работу");
      return;
    }
    setBusyIdx(originalIndex);
    try {
      const channelConfig =
        HYPOTHESIS_CHANNELS.find((c) => c.id === h.channel) ?? HYPOTHESIS_CHANNELS[0];
      const created = await createHypothesis({
        projectId,
        title: h.title,
        description: h.why,
        expectedImpact: h.expectedImpact,
        whatToChange: h.title,
        sourceType: "audit_hypothesis",
        hypothesisType: channelConfig.type,
        priority: h.priority,
        status: "selected",
      });
      await saveHypothesisMethodology(
        created.id,
        {
          metricName: h.metricName,
          testWindow: h.testWindow,
          source: h.channel,
          guardrail: h.guardrail ?? "",
        },
        {
          hypothesisType: channelConfig.type,
          sourceType: "audit_hypothesis",
        },
      );
      setTaken((prev) => ({ ...prev, [originalIndex]: created.id }));
      setProtocolTarget({
        ...created,
        implementation_difficulty: [
          h.metricName && `metric:${h.metricName}`,
          h.testWindow && `window:${h.testWindow}`,
          h.guardrail && `guardrail:${h.guardrail}`,
          `source:${h.channel}`,
        ]
          .filter(Boolean)
          .join("|"),
      });
      toast.success("Гипотеза в работе — настройте протокол");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось взять гипотезу");
    } finally {
      setBusyIdx(null);
    }
  };

  if (!sortedHypotheses.length) return null;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        id="sec-hypotheses"
        data-pdf-section
        className="space-y-5"
      >
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-money/15 text-money">
                <Wand2 className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-money">
                План внедрения
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {sortedHypotheses.length} конкретных гипотез к внедрению
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Готовые SMART-формулировки для тестов. Берёте в работу — фиксируете результат через
              7 дней.
            </p>
          </div>

          {sortedHypotheses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              className="text-muted-foreground hover:text-foreground"
            >
              {collapsed ? "Показать" : "Свернуть"}
              {collapsed ? (
                <ChevronDown className="ml-1 h-4 w-4" />
              ) : (
                <ChevronUp className="ml-1 h-4 w-4" />
              )}
            </Button>
          )}
        </header>

        {!collapsed && (
          <>
            {channelsInList.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip
                  active={activeChannel === "all"}
                  onClick={() => setActiveChannel("all")}
                  count={sortedHypotheses.length}
                >
                  <Sparkles className="h-3 w-3" />
                  Все
                </FilterChip>
                {channelsInList.map((c) => {
                  const Icon = CHANNEL_ICON[c.id];
                  return (
                    <FilterChip
                      key={c.id}
                      active={activeChannel === c.id}
                      onClick={() => setActiveChannel(c.id)}
                      count={c.count}
                    >
                      <Icon className="h-3 w-3" />
                      {CHANNEL_LABEL[c.id]}
                    </FilterChip>
                  );
                })}
              </div>
            )}

            {!user && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-foreground">
                  Войдите, чтобы взять гипотезы в работу — мы напомним через 7 дней зафиксировать
                  результат.
                </span>
                <Button size="sm" onClick={handleLogin}>
                  Войти
                </Button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((h) => {
                const originalIdx = sortedHypotheses.indexOf(h);
                return (
                  <HypothesisCard
                    key={`${originalIdx}-${h.title}`}
                    h={h}
                    index={originalIdx}
                    busy={busyIdx === originalIdx}
                    takenAt={Boolean(taken[originalIdx])}
                    onTake={() => handleTake(originalIdx, h)}
                    onLogin={handleLogin}
                  />
                );
              })}
            </div>

            {filtered.length > 6 && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll((v) => !v)}
                  className="border-border/60"
                >
                  {showAll
                    ? "Скрыть"
                    : `Показать ещё ${filtered.length - 6}`}
                  {showAll ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {projectId && Object.keys(taken).length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-money/25 bg-money/[0.06] px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-money" />
                  {Object.keys(taken).length} гипотез{
                    Object.keys(taken).length === 1 ? "а" : ""
                  } уже в работе
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/projects/${projectId}`)}
                >
                  В дашборд проекта
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </motion.section>

      <HypothesisProtocolModal
        hypothesis={protocolTarget}
        open={protocolTarget !== null}
        onClose={() => setProtocolTarget(null)}
        onSaved={() => {
          toast.success("Протокол гипотезы сохранён");
        }}
      />
    </>
  );
}
