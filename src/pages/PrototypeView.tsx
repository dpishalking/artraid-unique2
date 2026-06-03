import { useEffect, useState, useRef } from "react";
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Copy, Check, RefreshCw, RotateCcw, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPrototypeMarkdown,
  downloadPrototypeMarkdown,
  type PrototypeMarkdownContent,
} from "@/lib/prototypeMarkdown";
import { exportSectionsToPdf, sanitizePdfFilenameBase } from "@/lib/exportSectionsToPdf";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getScenarioById, scenarioToSnapshot, type ScenarioSnapshot } from "@/config/landingScenarios";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { ParadigmShiftSection } from "@/components/lp/ParadigmShiftSection";
import {
  flowExitHome,
  flowExitProjectPrototypes,
  flowExitProjects,
} from "@/lib/navigation/flowExit";

type Block = { note?: string };
type Hero = Block & { headline: string; headline_variants?: string[]; subheadline: string; cta: string; trust: string[]; story_opening?: string; story_bridge?: string };
type ParadigmShift = Block & { headline: string; old_belief: string; new_belief: string; bridge: string };
type Listish = Block & { title: string; intro?: string; points: string[] };
type EnemySection = Block & { headline: string; enemy_name: string; how_enemy_works: string; proof: string };
type Steps = Block & { title: string; steps: { title: string; desc: string; duration?: string }[] };
type Transformation = Block & { headline: string; before: string[]; after: string[]; timeline: string };
type Metrics = Block & { title: string; metrics: { number: string; label: string; loss_framing?: string }[] };
type Product = Block & { title: string; anchor_context?: string; tiers: { name: string; price: string; description?: string; features: string[]; cta?: string }[] };
type Comparison = Block & { title: string; us_label: string; them_label: string; differentiation_angle?: string; rows: { feature: string; us: string; them: string }[] };
type Social = Block & { title: string; items: { quote: string; author: string; role: string; result?: string }[] };
type Founder = Block & { headline: string; story: string; credentials: string[]; why_this: string };
type Items = Block & { title: string; items: { objection?: string; answer?: string; q?: string; a?: string; frequency?: string }[] };
type FuturePacing = Block & { headline: string; scene: string; emotions: string; contrast: string };
type Guarantee = Block & { headline: string; type: string; duration: string; conditions: string; emotional_hook: string };
type FinalCta = Block & { headline: string; subheadline: string; cta: string; urgency?: string; risk_reversal?: string };
type MicroCopy = { form_placeholder: string; form_submit: string; form_success: string; trust_badge: string; nav_cta?: string; hero_badge?: string };

type Blocks = {
  hero?: Hero; paradigm_shift?: ParadigmShift; pain?: Listish; enemy_section?: EnemySection;
  solution?: Steps; transformation?: Transformation; value?: Metrics;
  product?: Product; process?: Steps; founder?: Founder; comparison?: Comparison;
  social_proof?: Social; not_for?: Listish; objections?: Items;
  faq?: Items; future_pacing?: FuturePacing; guarantee?: Guarantee; final_cta?: FinalCta; micro_copy?: MicroCopy;
};

type Content = {
  meta: {
    project_name: string; tone_of_voice: string; target_action: string;
    awareness_stage?: string; sophistication_level?: number;
    voc_phrases?: string[]; emotional_arc?: string;
    sequence?: string[]; sequence_rationale?: string;
    scenario?: ScenarioSnapshot;
  };
  blocks: Blocks;
};

function resolveScenario(
  content: Content | null,
  brief: Record<string, string> | null,
): ScenarioSnapshot | undefined {
  if (content?.meta?.scenario) return content.meta.scenario;
  const fromBrief = getScenarioById(brief?.scenario_id);
  return fromBrief ? scenarioToSnapshot(fromBrief) : undefined;
}

function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [started, text]);

  return <>{displayed}<span className="animate-pulse opacity-60">|</span></>;
}

function Section({ index, name, note, children, animDelay = 0, blockKey, onRegenerate, isRegenerating }: {
  index: number; name: string; note?: string; children: React.ReactNode; animDelay?: number;
  blockKey?: string; onRegenerate?: (key: string) => void; isRegenerating?: boolean;
}) {
  return (
    <motion.section
      data-pdf-section
      className="border-t border-border py-10 md:py-14"
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: animDelay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-mono text-muted-foreground">{String(index).padStart(2, "0")}</span>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{name}</h2>
        </div>
        {blockKey && onRegenerate && (
          <div data-pdf-hide>
            <button
            onClick={() => onRegenerate(blockKey)}
            disabled={isRegenerating}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-40"
            title="Переписать этот блок"
          >
            {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Переписать
          </button>
          </div>
        )}
      </div>
      {children}
      {note && (
        <div className="mt-6 rounded-lg border-l-2 border-primary/60 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Заметка дизайнеру: </span>{note}
        </div>
      )}
    </motion.section>
  );
}

export default function PrototypeView() {
  const { user } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [copied, setCopied] = useState(false);
  const [brief, setBrief] = useState<Record<string, string> | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingBlock, setRegeneratingBlock] = useState<string | null>(null);
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const [guestReadonly, setGuestReadonly] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("prototypes").select("content, status, brief, anonymous_demo, project_id").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) { setStatus("not_found"); return; }
      setGuestReadonly(data.anonymous_demo === true);
      setLinkedProjectId(typeof data.project_id === "string" ? data.project_id : null);
      setStatus(data.status);
      if (data.content) setContent(data.content as unknown as Content);
      if (data.brief) setBrief(data.brief as Record<string, string>);
    });
  }, [id]);

  const regenerateBlock = async (blockKey: string) => {
    if (!id || guestReadonly) return;
    setRegeneratingBlock(blockKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const bearer = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearer}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ prototype_id: id, block_key: blockKey }),
      });
      let data: Record<string, unknown> = {};
      try { data = await r.json(); } catch { /* non-json response */ }
      if (!r.ok) {
        toast.error(String(data.error || `Ошибка ${r.status}: обратитесь к администратору`));
        return;
      }
      setContent(prev => prev ? {
        ...prev,
        blocks: { ...prev.blocks, [blockKey]: data.block },
      } : prev);
      toast.success("Блок переписан");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось переписать блок");
    } finally {
      setRegeneratingBlock(null);
    }
  };

  const regenerate = async () => {
    if (!brief) return;
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const bearer = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prototype`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearer}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ brief }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error || "Ошибка генерации"); return; }
      toast.success("Пересобрано по новой системе моделей");
      nav(`/p/${data.id}`);
    } catch {
      toast.error("Не удалось пересобрать. Попробуйте ещё раз.");
    } finally {
      setRegenerating(false);
    }
  };

  const exportMarkdown = async () => {
    if (!content) return;
    const payload = content as PrototypeMarkdownContent;
    downloadPrototypeMarkdown(payload);
    try {
      await navigator.clipboard.writeText(buildPrototypeMarkdown(payload));
      setCopied(true);
      toast.success("Markdown: файл скачан и скопирован в буфер");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.success("Файл .md скачан (буфер обмена недоступен)");
    }
  };

  const handleExportPdf = async () => {
    if (!pdfRootRef.current || !content || exportingPdf) return;
    setExportingPdf(true);
    const toastId = toast.loading("Готовим PDF… ждём окончания анимации заголовка (~3 с)");
    try {
      const base = sanitizePdfFilenameBase(content.meta.project_name);
      await exportSectionsToPdf(
        pdfRootRef.current,
        `prototip-${base}-${new Date().toISOString().slice(0, 10)}.pdf`,
        { prepareDelayMs: 2800 },
      );
      toast.success("PDF готов — можно передать нейросети", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Не удалось собрать PDF", { id: toastId });
    } finally {
      setExportingPdf(false);
    }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (status === "not_found") return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Прототип не найден</div>;
  if (!content) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Прототип ещё генерируется…</div>;

  const b = content.blocks;

  const ALL_VALID_KEYS = new Set([
    "hero", "paradigm_shift", "pain", "enemy_section", "solution",
    "transformation", "value", "product", "process", "founder",
    "comparison", "social_proof", "not_for", "objections",
    "faq", "future_pacing", "guarantee", "final_cta",
  ]);

  // Use AI-generated sequence if available, validated and sanitized client-side
  function buildSequence(): string[] {
    const aiSeq = content.meta.sequence;
    const base = (aiSeq && aiSeq.length > 0 ? aiSeq : [...ALL_VALID_KEYS])
      .filter(k => ALL_VALID_KEYS.has(k));          // strip unknown keys
    const withoutHero = base.filter(k => k !== "hero");
    const withoutCta = withoutHero.filter(k => k !== "final_cta");
    return ["hero", ...withoutCta, "final_cta"];    // hero always first, final_cta always last
  }

  const SEQUENCE = buildSequence();
  const scenarioInfo = resolveScenario(content, brief);

  // Render **bold** markdown in plain text strings
  function bold(text: string): React.ReactNode[] {
    return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part
    );
  }

  const BLOCK_LABELS: Record<string, string> = {
    hero: "Hero · первый экран",
    paradigm_shift: "Миф и правда",
    pain: "Боль · контекст",
    enemy_section: "Враг · причина проблемы",
    solution: "Решение",
    transformation: "Трансформация · ДО и ПОСЛЕ",
    value: "Ценность · в цифрах",
    product: "Продукт · тарифы",
    process: "Процесс · как мы работаем",
    founder: "Основатель · почему мы",
    comparison: "Сравнение · мы vs остальные",
    social_proof: "Соц. доказательства",
    not_for: "Кому не подходит",
    objections: "Возражения · страхи и сомнения",
    faq: "FAQ · практические вопросы",
    future_pacing: "Future Pacing · жизнь после",
    guarantee: "Гарантия · снятие риска",
    final_cta: "Финальный CTA",
  };

  function TransitionHook({ text }: { text?: string }) {
    if (!text) return null;
    return (
      <p className="mt-5 text-sm font-medium text-primary/80 italic border-l-2 border-primary/30 pl-3">
        {text}
      </p>
    );
  }

  function renderBlock(key: string, idx: number) {
    const delay = Math.min(idx * 0.08, 1.2);
    const rewriteProps = guestReadonly
      ? {}
      : {
          blockKey: key,
          onRegenerate: regenerateBlock,
          isRegenerating: regeneratingBlock === key,
        };
    switch (key) {
      case "hero": {
        const bl = b.hero; if (!bl) return null;

        // Story mode — narrative prose opening (like natkozlova.ru)
        if (bl.story_opening) {
          return (
            <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
              <div className="space-y-4 text-lg leading-relaxed text-foreground/90">
                {bl.story_opening.split(/\n\n+/).map((para, i) => {
                  const isDialogue = para.trim().startsWith('"') || para.trim().startsWith('«') || para.trim().startsWith('—');
                  return (
                    <p key={i} className={isDialogue ? "pl-4 border-l-2 border-primary/40 italic text-foreground/80" : ""}>
                      {para}
                    </p>
                  );
                })}
              </div>
              {bl.story_bridge && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-muted-foreground leading-relaxed">{bl.story_bridge}</p>
                </div>
              )}
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                  <TypedText text={bl.headline} delay={200} />
                </h3>
                <p className="mt-3 text-lg text-muted-foreground">{bl.subheadline}</p>
                <div className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-semibold">{bl.cta}</div>
                <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {bl.trust.map((t, i) => <li key={i}>· {t}</li>)}
                </ul>
              </div>
            </Section>
          );
        }

        // Classic mode
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              <TypedText text={bl.headline} delay={200} />
            </h3>
            <p className="mt-3 text-lg text-muted-foreground">{bl.subheadline}</p>
            <div className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-semibold">{bl.cta}</div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {bl.trust.map((t, i) => <li key={i}>· {t}</li>)}
            </ul>
            {bl.headline_variants && bl.headline_variants.length > 0 && (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-card/50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">3 варианта заголовка</div>
                <ol className="space-y-2">
                  {bl.headline_variants.map((v, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 text-[10px] font-bold text-primary mt-0.5">{["Результат", "Боль", "Механизм"][i]}</span>
                      <span className="text-foreground/80">{v}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Section>
        );
      }
      case "paradigm_shift": {
        const bl = b.paradigm_shift; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <ParadigmShiftSection block={bl} variant="full" />
            <TransitionHook text={(bl as any).transition_hook} />
          </Section>
        );
      }
      case "pain": {
        const bl = b.pain; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-3">{bl.title}</h3>
            {bl.intro && <p className="text-muted-foreground mb-4 leading-relaxed">{bl.intro}</p>}
            <ul className="space-y-2">{bl.points.map((p, i) => <li key={i} className="flex gap-3"><span className="text-primary">→</span><span>{bold(p)}</span></li>)}</ul>
            <TransitionHook text={(bl as any).transition_hook} />
          </Section>
        );
      }
      case "enemy_section": {
        const bl = b.enemy_section; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-bold mb-4">{bl.headline}</h3>
            <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-2">Имя врага</div>
              <p className="font-semibold text-lg text-foreground">{bl.enemy_name}</p>
            </div>
            <p className="text-muted-foreground mb-3">{bl.how_enemy_works}</p>
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <span className="font-semibold text-foreground">Доказательство: </span>
              <span className="text-muted-foreground">{bl.proof}</span>
            </div>
            <TransitionHook text={(bl as any).transition_hook} />
          </Section>
        );
      }
      case "solution": {
        const bl = b.solution; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <ol className="space-y-4">{bl.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">{i + 1}</span>
                <div><div className="font-semibold">{s.title}</div><div className="text-muted-foreground text-sm mt-0.5">{s.desc}</div></div>
              </li>
            ))}</ol>
            <TransitionHook text={(bl as any).transition_hook} />
          </Section>
        );
      }
      case "transformation": {
        const bl = b.transformation; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-bold mb-5">{bl.headline}</h3>
            {bl.timeline && <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">За {bl.timeline}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-destructive/70 mb-3">До</div>
                <ul className="space-y-2">{bl.before.map((item, i) => <li key={i} className="flex gap-2 text-sm text-foreground/70"><span className="text-destructive/50 flex-shrink-0">✗</span>{item}</li>)}</ul>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">После</div>
                <ul className="space-y-2">{bl.after.map((item, i) => <li key={i} className="flex gap-2 text-sm text-foreground font-medium"><span className="text-primary flex-shrink-0">✓</span>{item}</li>)}</ul>
              </div>
            </div>
          </Section>
        );
      }
      case "value": {
        const bl = b.value; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{bl.metrics.map((m, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="font-display text-3xl font-bold text-primary">{m.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{m.label}</div>
                {(m as any).fascination && <div className="mt-2 text-xs text-foreground/70 border-t border-border pt-2 italic">{(m as any).fascination}</div>}
                {m.loss_framing && <div className="mt-1 text-xs text-destructive/80">Без этого: {m.loss_framing}</div>}
              </div>
            ))}</div>
          </Section>
        );
      }
      case "product": {
        const bl = b.product; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-3">{bl.title}</h3>
            {bl.anchor_context && <div className="mb-5 rounded-lg border-l-2 border-destructive/60 bg-destructive/5 px-4 py-2 text-sm text-muted-foreground">{bl.anchor_context}</div>}
            <div className="grid gap-4 md:grid-cols-2">{bl.tiers.map((t, i) => (
              <div key={i} className="rounded-xl border border-border p-5">
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="font-display text-2xl font-bold mt-1">{t.price}</div>
                {t.description && <div className="text-sm text-muted-foreground mt-1">{t.description}</div>}
                <ul className="mt-4 space-y-1.5 text-sm">{t.features.map((f, j) => <li key={j}>· {f}</li>)}</ul>
                {t.cta && <div className="mt-4 inline-block rounded-md bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium">{t.cta}</div>}
              </div>
            ))}</div>
          </Section>
        );
      }
      case "process": {
        const bl = b.process; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <ol className="space-y-4 border-l-2 border-border pl-5">{bl.steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary" />
                <div className="font-semibold">{s.title}{s.duration && <span className="text-muted-foreground font-normal text-sm ml-2">· {s.duration}</span>}</div>
                <div className="text-muted-foreground text-sm mt-0.5">{s.desc}</div>
              </li>
            ))}</ol>
          </Section>
        );
      }
      case "founder": {
        const bl = b.founder; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-bold mb-4">{bl.headline}</h3>
            <p className="text-muted-foreground mb-5 leading-relaxed">{bl.story}</p>
            <ul className="space-y-2 mb-4">{bl.credentials.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm"><span className="text-primary font-bold flex-shrink-0">✓</span><span>{c}</span></li>
            ))}</ul>
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">{bl.why_this}</div>
            <TransitionHook text={(bl as any).transition_hook} />
          </Section>
        );
      }
      case "comparison": {
        const bl = b.comparison; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-3">{bl.title}</h3>
            {bl.differentiation_angle && <div className="mb-4 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">{bl.differentiation_angle}</div>}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium"></th>
                    <th className="px-4 py-3 font-semibold text-primary">{bl.us_label}</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">{bl.them_label}</th>
                  </tr>
                </thead>
                <tbody>{bl.rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.feature}</td>
                    <td className="px-4 py-3">{r.us}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.them}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Section>
        );
      }
      case "social_proof": {
        const bl = b.social_proof; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <div className="space-y-4">{bl.items.map((s, i) => (
              <blockquote key={i} className="rounded-xl border-l-2 border-primary bg-card px-5 py-4">
                {(s as any).before_state && <p className="text-xs text-muted-foreground mb-2 italic">До: {(s as any).before_state}</p>}
                <p className="italic">«{s.quote}»</p>
                <footer className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">{s.author}</span>, {s.role}{s.result && <> · <span className="text-primary font-medium">{s.result}</span></>}</footer>
              </blockquote>
            ))}</div>
          </Section>
        );
      }
      case "not_for": {
        const bl = b.not_for; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-3">{bl.title}</h3>
            {bl.intro && <p className="text-muted-foreground mb-4">{bl.intro}</p>}
            <ul className="space-y-2">{bl.points.map((p, i) => <li key={i} className="flex gap-3"><span className="text-muted-foreground">×</span><span>{bold(p)}</span></li>)}</ul>
          </Section>
        );
      }
      case "objections": {
        const bl = b.objections; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <div className="space-y-5">{bl.items.map((it, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="font-semibold flex items-center gap-2 mb-2">
                  — {bold(it.objection ?? "")}
                  {it.frequency === "высокая" && <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">частое</span>}
                </div>
                {(it as any).reframe && <p className="text-xs text-muted-foreground italic mb-1.5 pl-3 border-l border-border">{(it as any).reframe}</p>}
                <div className="text-muted-foreground text-sm">{bold(it.answer ?? "")}</div>
              </div>
            ))}</div>
          </Section>
        );
      }
      case "faq": {
        const bl = b.faq; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-semibold mb-5">{bl.title}</h3>
            <div className="space-y-4">{bl.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="font-semibold">{bold(it.q ?? "")}</div>
                <div className="text-muted-foreground text-sm mt-1.5">{bold(it.a ?? "")}</div>
              </div>
            ))}</div>
          </Section>
        );
      }
      case "future_pacing": {
        const bl = b.future_pacing; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-2xl font-bold mb-5">{bl.headline}</h3>
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 mb-4">
              <p className="text-lg leading-relaxed text-foreground mb-3">{bl.scene}</p>
              <p className="text-primary font-medium">{bl.emotions}</p>
            </div>
            <p className="text-sm text-muted-foreground border-t border-border pt-3">{bl.contrast}</p>
          </Section>
        );
      }
      case "guarantee": {
        const bl = b.guarantee; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
              <h3 className="font-display text-2xl font-bold mb-2">{bl.headline}</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">✓ {bl.type}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-sm text-muted-foreground">{bl.duration}</span>
              </div>
              <p className="text-foreground leading-relaxed mb-4">{bl.emotional_hook}</p>
              <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Условия: </span>{bl.conditions}
              </div>
            </div>
          </Section>
        );
      }
      case "final_cta": {
        const bl = b.final_cta; if (!bl) return null;
        return (
          <Section key={key} index={idx + 1} name={BLOCK_LABELS[key]} note={bl.note} animDelay={delay} {...rewriteProps}>
            <h3 className="font-display text-3xl md:text-4xl font-bold leading-tight">{bl.headline}</h3>
            <p className="mt-3 text-lg text-muted-foreground">{bl.subheadline}</p>
            <div className="mt-5 inline-block rounded-lg bg-gradient-money px-6 py-3 text-primary-foreground font-semibold shadow-glow">{bl.cta}</div>
            {bl.urgency && <p className="mt-3 text-sm text-muted-foreground">{bl.urgency}</p>}
            {bl.risk_reversal && <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="text-money">✓</span> {bl.risk_reversal}</div>}
          </Section>
        );
      }
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FlowPageHeader
        exit={
          linkedProjectId
            ? flowExitProjectPrototypes(linkedProjectId)
            : user
              ? flowExitProjects()
              : flowExitHome()
        }
        showHomeLink={!!linkedProjectId || !!user}
        title="Прототип"
        stackBelowProductNav
        className="max-w-4xl"
      >
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {brief && !guestReadonly && (
              <Button variant="outline" size="sm" onClick={regenerate} disabled={regenerating}>
                {regenerating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Пересобрать
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void exportMarkdown()}>
              {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleExportPdf()} disabled={exportingPdf}>
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-1.5" />
              )}
              Скачать PDF
            </Button>
            {user && (
              <Link to="/prototype" className="text-xs text-muted-foreground hover:text-foreground">
                Новый
              </Link>
            )}
          </div>
      </FlowPageHeader>

      <article className="mx-auto max-w-3xl px-6 pb-24">
        <div ref={pdfRootRef} className="pdf-export">
          <div data-pdf-section>
            <header className="py-12">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Смысловой прототип</div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">{content.meta.project_name}</h1>
              <p className="mt-3 text-muted-foreground">Tone of voice: <span className="text-foreground">{content.meta.tone_of_voice}</span> · Целевое действие: <span className="text-foreground">{content.meta.target_action}</span></p>

              {content.meta.sequence_rationale && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Почему такая структура</div>
                  <p className="text-sm text-foreground/80">{content.meta.sequence_rationale}</p>
                </div>
              )}

              {(content.meta.awareness_stage || content.meta.emotional_arc || content.meta.sophistication_level) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {content.meta.awareness_stage && (
                    <div className="rounded-lg border border-border bg-primary/5 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Стадия осознанности</div>
                      <div className="text-sm text-foreground">{content.meta.awareness_stage}{content.meta.sophistication_level ? ` · Sophistication ${content.meta.sophistication_level}/5` : ""}</div>
                    </div>
                  )}
                  {content.meta.emotional_arc && (
                    <div className="rounded-lg border border-border bg-card px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Эмоциональная дуга</div>
                      <div className="text-sm text-foreground">{content.meta.emotional_arc}</div>
                    </div>
                  )}
                </div>
              )}

              {content.meta.voc_phrases && content.meta.voc_phrases.length > 0 && (
                <div className="mt-4 rounded-lg border border-border bg-card px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Голос клиента — 7 реальных фраз</div>
                  <ul className="space-y-1.5">
                    {content.meta.voc_phrases.map((phrase, i) => (
                      <li key={i} className="text-sm text-foreground/80 before:content-['«'] after:content-['»']">{phrase}</li>
                    ))}
                  </ul>
                </div>
              )}
            </header>
          </div>

          {scenarioInfo && (
            <motion.div
              data-pdf-section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10 rounded-xl border border-primary/25 bg-primary/5 px-5 py-4"
            >
            <motion.div className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Логика этого прототипа</motion.div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                <dt className="text-muted-foreground">Сценарий</dt>
                <dd className="font-medium text-foreground">{scenarioInfo.title}</dd>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <dt className="text-muted-foreground">Цель</dt>
                <dd className="font-medium text-foreground">{scenarioInfo.goal}</dd>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="sm:col-span-2">
                <dt className="text-muted-foreground">Логика</dt>
                <dd className="font-medium text-foreground">{scenarioInfo.logic}</dd>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <dt className="text-muted-foreground">Основное действие</dt>
                <dd className="font-medium text-foreground">{scenarioInfo.primaryCTA}</dd>
              </motion.div>
            </dl>
            {scenarioInfo.landingStructure && scenarioInfo.landingStructure.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 border-t border-primary/15 pt-4"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Структура страницы
                </div>
                <ol className="space-y-1 text-sm text-foreground/90">
                  {scenarioInfo.landingStructure.map((block, i) => (
                    <li key={block.id} className="flex gap-2">
                      <span className="text-muted-foreground tabular-nums shrink-0">{i + 1}.</span>
                      <span>{block.title}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            )}
          </motion.div>
        )}

        {SEQUENCE.map((key, idx) => renderBlock(key, idx))}

        {b.micro_copy && (
          <motion.section
            data-pdf-section
            className="border-t border-border py-10 md:py-14"
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-baseline gap-3">
              <span className="text-sm font-mono text-muted-foreground">19</span>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Micro-copy</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Placeholder формы", value: b.micro_copy.form_placeholder },
                { label: "Кнопка отправки", value: b.micro_copy.form_submit },
                { label: "Сообщение после отправки", value: b.micro_copy.form_success },
                { label: "Доверие под кнопкой", value: b.micro_copy.trust_badge },
                b.micro_copy.nav_cta ? { label: "CTA в навигации", value: b.micro_copy.nav_cta } : null,
                b.micro_copy.hero_badge ? { label: "Бейдж над заголовком", value: b.micro_copy.hero_badge } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item!.label}</div>
                  <div className="text-sm text-foreground font-medium">«{item!.value}»</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
        </div>
      </article>
    </div>
  );
}
