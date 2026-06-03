import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Audit } from "@/components/AuditDashboard";
import {
  AUDIT_CLOSING_CTAS,
  AUDIT_FOCUS_SECTIONS,
  type AuditFocusNextKind,
} from "@/config/auditSections";
import { resolveAuditFocusContent } from "@/lib/audit/resolveAuditFocusContent";
import { toolHref } from "@/lib/navigation/productNav";

type LabelKey =
  | "currentState"
  | "conversionProblem"
  | "visitorFeeling"
  | "improvement"
  | "nextStep";

const LABELS: Record<LabelKey, string> = {
  currentState: "Что происходит сейчас",
  conversionProblem: "Почему это снижает конверсию",
  visitorFeeling: "Что чувствует посетитель",
  improvement: "Что есть смысл усилить первым делом",
  nextStep: "Следующее действие без лишней суеты",
};

function hostFromUrl(url?: string) {
  if (!url?.trim()) return "Сайт";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function heroLead(audit: Audit) {
  const raw = (audit.systemMessage ?? "").trim();
  if (!raw) return audit.finalCta?.trim() || audit.diagnosis.mainProblem;
  const firstChunk = raw.split(/\n+/).slice(0, 2).join(" ");
  return firstChunk.length > 420 ? `${firstChunk.slice(0, 420).trimEnd()}…` : firstChunk;
}

function nextHref(kind: AuditFocusNextKind, projectId?: string): string | null {
  if (kind === "none") return null;
  if (kind === "generate_offer") return toolHref("/offer-generator", projectId, { pick: "vectors" });
  if (kind === "prototype_hero" || kind === "trust_blocks") return toolHref("/prototype", projectId);
  return null;
}

export function ProgressiveAuditHub({
  audit,
  siteUrl,
  projectId,
  integrationsEnabled = true,
}: {
  audit: Audit;
  siteUrl?: string;
  projectId?: string;
  /** Основная витрина «только аудит»: без переходов в оффер-конструктор и прототип */
  integrationsEnabled?: boolean;
}) {
  const host = useMemo(() => hostFromUrl(siteUrl), [siteUrl]);
  const chips = useMemo(
    () => audit.problems?.slice(0, 5).map((pr) => pr.title.trim()) ?? [],
    [audit.problems],
  );

  const scrollContinue = () => {
    document.getElementById("audit-depth-focus")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-12">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/65 p-6 shadow-card backdrop-blur md:p-9"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),transparent_58%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Результат аудита · живой язык маркетолога, не сухая табличка
              </p>
              <p className="mt-2 font-display text-2xl font-semibold md:text-3xl">{host}</p>
            </div>
            <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.07] px-4 py-3 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive/90">
                Недополучено выручки этого потока
              </div>
              <div
                className="mt-1 font-display text-3xl font-bold text-destructive md:text-[2.65rem]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {audit.diagnosis.estimatedLossPercent}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg font-medium leading-relaxed text-foreground md:text-xl">{heroLead(audit)}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <InsightCard eyebrow="Главная проблема сайта сейчас" body={audit.diagnosis.mainProblem} tone="warning" />
              <InsightCard eyebrow="Главная «дыра» по деньгам" body={audit.diagnosis.mainMoneyLeak} tone="leak" />
              <InsightCard
                eyebrow="Главный рычаг усиления"
                body={audit.diagnosis.mainLever ?? leverFallback(audit)}
                tone="lever"
              />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Инсайты в двух строках · что режет слух при разборе
              </p>
              <div className="flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-sm text-foreground/90"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            onClick={scrollContinue}
            className="h-12 w-full rounded-2xl bg-gradient-money px-6 text-base font-semibold shadow-glow sm:w-auto sm:min-w-[260px]"
          >
            Продолжить разбор
            <ArrowDown className="ml-2 h-4 w-4" />
          </Button>
          <p className="max-w-xl text-xs text-muted-foreground">
            Полную версию с таблицами и всеми разделами оставили ниже — открывайте, когда понадобится методично пройти всё или
            распечатать для команды.
          </p>
        </div>
      </motion.section>

      <section id="audit-depth-focus" className="space-y-4">
        <div>
          <h3 className="font-display text-xl font-semibold md:text-2xl">Выберите, что открыть следующим</h3>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Каждый блок раскрывается отдельно — можно идти в глубину в своём темпе.
          </p>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {AUDIT_FOCUS_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const body = resolveAuditFocusContent(sec.id, audit);
            const nav =
              integrationsEnabled && sec.nextAction ? nextHref(sec.nextAction.kind, projectId) : null;
            return (
              <AccordionItem
                key={sec.id}
                value={sec.id}
                className="rounded-2xl border border-border/70 bg-background/40 backdrop-blur"
              >
                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline md:px-5 md:py-5">
                  <div className="flex w-full items-start gap-3 pr-2">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-money/35 bg-money/15 text-money shadow-inner">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display text-base font-semibold leading-snug text-foreground md:text-lg">
                        {sec.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{sec.shortDescription}</span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/50 bg-muted/10 px-4 pb-5 pt-4 md:px-5">
                  <FivePart body={body} />
                  {sec.nextAction && nav ? (
                    <div className="mt-5">
                      <Button asChild className="rounded-xl bg-gradient-money font-semibold text-primary-foreground shadow-glow">
                        <Link to={nav}>
                          {sec.nextAction.label}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {integrationsEnabled ? (
        <section className="space-y-4">
          <h3 className="font-display text-xl font-semibold md:text-2xl">Логичный следующий ход без лишних меню</h3>
          <p className="text-sm text-muted-foreground md:max-w-2xl">
            Тот же оффер-конструктор и прототип, что есть в вашем проекте — здесь они выглядят как продолжение нахождённых дырок.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {AUDIT_CLOSING_CTAS.map((row) => {
              const Icon = row.icon;
              const href = nextHref(row.nextAction.kind, projectId);
              return (
                <Link
                  key={row.id}
                  to={href ?? "#"}
                  className={
                    href
                      ? "group flex gap-4 rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:border-primary/40 hover:bg-card"
                      : "pointer-events-none opacity-45"
                  }
                  onClick={href ? undefined : (e) => e.preventDefault()}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/18">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="font-display font-semibold text-foreground group-hover:text-primary">{row.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{row.shortDescription}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-money">
                      {row.nextAction.label}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FivePart({ body }: { body: ReturnType<typeof resolveAuditFocusContent> }) {
  type RowKey = keyof typeof LABELS;
  const rows: { key: RowKey; text: string }[] = [
    { key: "currentState", text: body.currentState },
    { key: "conversionProblem", text: body.conversionProblem },
    { key: "visitorFeeling", text: body.visitorFeeling },
    { key: "improvement", text: body.improvement },
    { key: "nextStep", text: body.nextStep },
  ].filter((r) => Boolean(r.text?.trim()));

  return (
    <div className="space-y-4">
      {rows.map(({ key, text }) => (
        <div key={key} className="rounded-xl border border-border/60 bg-background/40 p-3.5 md:p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {LABELS[key]}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{text}</p>
        </div>
      ))}
    </div>
  );
}

function InsightCard({
  eyebrow,
  body,
  tone,
}: {
  eyebrow: string;
  body: string;
  tone: "warning" | "leak" | "lever";
}) {
  const styles = (
    {
      warning: {
        chip: "text-destructive",
        bg: "bg-destructive/[0.06] border-destructive/25",
      },
      leak: {
        chip: "text-orange-400",
        bg: "bg-orange-500/[0.05] border-orange-400/35",
      },
      lever: {
        chip: "text-money",
        bg: "bg-money/[0.06] border-money/35",
      },
    } as const
  )[tone];

  return (
    <div className={`rounded-2xl border p-4 ${styles.bg}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${styles.chip}`}>{eyebrow}</div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{body}</p>
    </div>
  );
}

function leverFallback(audit: Audit): string {
  return (
    audit.offerScore?.biggestLever ||
    `Потестировать рост без лишней суеты: ${audit.growthPotential.requestsGrowth} заявок и ${audit.growthPotential.conversionGrowth} к конверсии уже на горизонте правок главного оффера.`
  );
}
