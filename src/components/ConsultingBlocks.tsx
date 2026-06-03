import { motion } from "framer-motion";
import { Target, Compass, Calculator, Gauge } from "lucide-react";
import type { Audit } from "./AuditDashboard";
import { REPORT_CARD, REPORT_CARD_PAD } from "./audit/reportDesign";
import { cn } from "@/lib/utils";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const AWARENESS_LABEL: Record<NonNullable<Audit["marketContext"]>["awarenessLevel"], string> = {
  unaware: "Не осознаёт проблемы",
  "problem-aware": "Осознаёт проблему",
  "solution-aware": "Знает о решениях",
  "product-aware": "Знает о продукте",
  "most-aware": "Готов покупать",
};

const HEALTH_LABEL: Record<NonNullable<Audit["unitEconomics"]>["healthStatus"], { label: string; cls: string }> = {
  healthy: { label: "Сходится", cls: "text-money border-money/30 bg-money/10" },
  tight: { label: "На грани", cls: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  broken: { label: "Не сходится", cls: "text-destructive border-destructive/30 bg-destructive/10" },
};

function ScoreBar({
  value,
  max = 10,
  color = "primary",
  inverse = false,
}: {
  value: number;
  max?: number;
  color?: "primary" | "money" | "destructive";
  inverse?: boolean;
}) {
  // Для inverse-метрик (трение, тревога) low value = good,
  // показываем «сколько НЕ-трения» — иначе зелёный бар выглядит коротким и читается как «мало хорошего».
  const display = inverse ? max - value : value;
  const pct = Math.max(0, Math.min(100, (display / max) * 100));
  const cls = color === "money" ? "bg-money" : color === "destructive" ? "bg-destructive" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-background/60">
      <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Metric({
  label,
  value,
  comment,
  hint,
  inverse = false,
}: {
  label: string;
  value: number;
  comment: string;
  hint?: string;
  inverse?: boolean;
}) {
  // inverse — ниже значит лучше (friction, anxiety)
  const good = inverse ? value <= 4 : value >= 7;
  const bad = inverse ? value >= 7 : value <= 4;
  const color: "primary" | "money" | "destructive" = good ? "money" : bad ? "destructive" : "primary";
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className="font-display text-base font-bold">
          {value}<span className="text-muted-foreground font-normal">/10</span>
        </div>
      </div>
      <div className="mt-2"><ScoreBar value={value} color={color} inverse={inverse} /></div>
      <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{comment}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OfferScoreBlock({
  data,
  compact = false,
}: {
  data: NonNullable<Audit["offerScore"]>;
  compact?: boolean;
}) {
  return (
    <motion.div {...fade(0.05)} data-pdf-section className={cn(REPORT_CARD, REPORT_CARD_PAD)}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="rounded-lg bg-money/15 p-2 text-money"><Target className="h-5 w-5" /></div>
        <h3 className="font-display text-xl font-semibold">Сила оффера</h3>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-money/30 bg-money/10 px-3 py-1">
          <span className="text-[11px] uppercase tracking-wide text-money/80">Балл</span>
          <span className="font-display text-lg font-bold text-money">{data.totalScore.toFixed(1)}<span className="text-money/60 text-sm font-normal">/10</span></span>
        </div>
      </div>
      {!compact && (
        <p className="text-sm text-muted-foreground">Формула: (Результат × Правдоподобность) ÷ (Сроки × Усилия). Каждое — 1–10.</p>
      )}

      {compact ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-foreground/90">{data.verdict}</p>
          <p className="text-sm font-medium text-money">{data.biggestLever}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Картина результата" value={data.dream} comment={data.dreamComment} hint="Насколько ярко описано «после»" />
            <Metric label="Правдоподобность" value={data.likelihood} comment={data.likelihoodComment} hint="Доказательства, кейсы, гарантии" />
            <Metric label="Скорость результата" value={data.timeDelay} comment={data.timeComment} hint="Чем быстрее — тем дороже воспринимается" />
            <Metric label="Простота шага" value={data.effort} comment={data.effortComment} hint="Чем меньше трения — тем сильнее оффер" />
          </div>
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="text-[11px] uppercase tracking-wide text-destructive font-semibold">Вердикт</div>
            <p className="mt-1.5 text-sm font-medium text-foreground">{data.verdict}</p>
          </div>
          <div className="mt-3 rounded-xl border border-money/30 bg-money/5 p-4">
            <div className="text-[11px] uppercase tracking-wide text-money font-semibold">Главный рычаг усиления</div>
            <p className="mt-1.5 text-sm font-medium text-foreground">{data.biggestLever}</p>
          </div>
        </>
      )}
    </motion.div>
  );
}

export function MarketContextBlock({
  data,
  compact = false,
}: {
  data: NonNullable<Audit["marketContext"]>;
  compact?: boolean;
}) {
  return (
    <motion.div {...fade(0.1)} data-pdf-section className={cn(REPORT_CARD, REPORT_CARD_PAD)}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="rounded-lg bg-primary/15 p-2 text-primary"><Compass className="h-5 w-5" /></div>
        <h3 className="font-display text-xl font-semibold">Контекст рынка</h3>
      </div>
      {compact ? (
        <div className="mt-4 space-y-3 text-sm">
          <p className="font-medium text-foreground">{data.mismatch}</p>
          <p className="text-foreground/85">{data.uniqueMechanism}</p>
        </div>
      ) : (
        <>
      <p className="text-sm text-muted-foreground">На каком уровне насыщения рынок и под кого написан сайт</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Насыщенность рынка</div>
          <div className="mt-2 flex items-center gap-2">
            {[1,2,3,4,5].map((n) => (
              <div key={n} className={`h-2 flex-1 rounded-full ${n <= data.sophisticationLevel ? "bg-primary" : "bg-background/60 border border-border"}`} />
            ))}
            <div className="font-display text-base font-bold ml-2">{data.sophisticationLevel}/5</div>
          </div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{data.sophisticationComment}</p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Уровень осознанности трафика</div>
          <div className="mt-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {AWARENESS_LABEL[data.awarenessLevel] ?? data.awarenessLevel}
          </div>
          <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{data.awarenessComment}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="text-[11px] uppercase tracking-wide text-destructive font-semibold">Главный конфликт</div>
        <p className="mt-1.5 text-sm font-medium text-foreground">{data.mismatch}</p>
      </div>
      <div className="mt-3 rounded-xl border border-money/30 bg-money/5 p-4">
        <div className="text-[11px] uppercase tracking-wide text-money font-semibold">Уникальный механизм</div>
        <p className="mt-1.5 text-sm text-foreground">{data.uniqueMechanism}</p>
      </div>
        </>
      )}
    </motion.div>
  );
}

export function UnitEconomicsBlock({ data }: { data: NonNullable<Audit["unitEconomics"]> }) {
  const health = HEALTH_LABEL[data.healthStatus] ?? HEALTH_LABEL.tight;
  return (
    <motion.div {...fade(0.15)} data-pdf-section className={cn(REPORT_CARD, REPORT_CARD_PAD)}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="rounded-lg bg-money/15 p-2 text-money"><Calculator className="h-5 w-5" /></div>
        <h3 className="font-display text-xl font-semibold">Экономика воронки</h3>
        <div className={`ml-auto inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${health.cls}`}>
          {health.label}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Прикидка по типовым бенчмаркам ниши: {data.niche}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <EcoCell label="Средний чек" value={data.assumedAvgCheck} />
        <EcoCell label="CPC (контекст)" value={data.assumedCpc} />
        <EcoCell label="Текущая CR" value={data.assumedCurrentCr} />
        <EcoCell label="CPL (стоимость лида)" value={data.estimatedCpl} accent />
        <EcoCell label="CAC (стоимость клиента)" value={data.estimatedCac} accent />
        <EcoCell label="Окупаемость" value={data.paybackVerdict} />
      </div>

      <div className="mt-4 rounded-xl border border-money/30 bg-money/5 p-4">
        <div className="text-[11px] uppercase tracking-wide text-money font-semibold">Если поднять конверсию в 2 раза</div>
        <p className="mt-1.5 text-sm font-medium text-foreground">{data.uplift}</p>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground italic">{data.disclaimer}</p>
    </motion.div>
  );
}

function EcoCell({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-money/30 bg-money/5" : "border-border bg-background/40"}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1.5 font-display text-base font-bold ${accent ? "text-money" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

export function MeclabsScoreBlock({
  data,
  compact = false,
}: {
  data: NonNullable<Audit["meclabsScore"]>;
  compact?: boolean;
}) {
  const max = 90;
  const pct = Math.max(0, Math.min(100, ((data.score + 20) / (max + 20)) * 100));
  return (
    <motion.div {...fade(0.2)} data-pdf-section className={cn(REPORT_CARD, REPORT_CARD_PAD)}>
      <div className="mb-1 flex items-center gap-2.5">
        <div className="rounded-lg bg-primary/15 p-2 text-primary"><Gauge className="h-5 w-5" /></div>
        <h3 className="font-display text-xl font-semibold">Скоринг главного экрана</h3>
        <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
          <span className="text-[11px] uppercase tracking-wide text-primary/80">Балл</span>
          <span className="font-display text-lg font-bold text-primary">{data.score.toFixed(0)}<span className="text-primary/60 text-sm font-normal">/90</span></span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background/60">
        <div className="h-full bg-gradient-to-r from-destructive via-orange-400 to-money" style={{ width: `${pct}%` }} />
      </div>

      {compact ? (
        <p className="mt-4 text-sm font-medium text-foreground">{data.interpretation}</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">C = 4×Мотивация + 3×Ценность + 2×(Стимул − Трение) − 2×Тревога</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Мотивация ×4" value={data.motivation} comment={data.motivationComment} />
            <Metric label="Ценность ×3" value={data.valueProposition} comment={data.valueComment} />
            <Metric label="Стимул ×2" value={data.incentive} comment={data.incentiveComment} />
            <Metric label="Трение ×2 (ниже = лучше)" value={data.friction} comment={data.frictionComment} inverse />
            <Metric label="Тревога ×2 (ниже = лучше)" value={data.anxiety} comment={data.anxietyComment} inverse />
          </div>
          <div className="mt-5 rounded-xl border border-money/30 bg-money/5 p-4">
            <div className="text-[11px] uppercase tracking-wide text-money font-semibold">Интерпретация</div>
            <p className="mt-1.5 text-sm font-medium text-foreground">{data.interpretation}</p>
          </div>
        </>
      )}
    </motion.div>
  );
}
