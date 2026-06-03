import { useState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgeApi } from "@/lib/forge/api";
import {
  buildFullLandingSequence,
  type FullLandingBlocks,
  type FullLandingContent,
} from "@/components/lp/fullLandingTypes";
import { ParadigmShiftSection } from "@/components/lp/ParadigmShiftSection";

type Props = {
  prototypeId: string;
  content: FullLandingContent;
  /** preview = show designer notes; public = clean landing */
  mode?: "public" | "preview";
};

function bold(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function Section({
  children,
  note,
  showNote,
  className = "",
}: {
  children: ReactNode;
  note?: string;
  showNote?: boolean;
  className?: string;
}) {
  return (
    <section className={`py-10 md:py-14 border-t border-border first:border-t-0 ${className}`}>
      {children}
      {showNote && note && (
        <div className="mt-6 rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Заметка дизайнеру: </span>
          {note}
        </div>
      )}
    </section>
  );
}

function TransitionHook({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-5 text-sm font-medium text-primary/80 italic border-l-2 border-primary/30 pl-3">
      {text}
    </p>
  );
}

function FullLandingLeadForm({
  prototypeId,
  blocks,
}: {
  prototypeId: string;
  blocks: FullLandingBlocks;
}) {
  const mc = blocks.micro_copy;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function getUtm(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
    return out;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error("Заполните имя и телефон");
    setSubmitting(true);
    try {
      await forgeApi.submitLead({
        prototype_id: prototypeId,
        name: name.trim(),
        phone: phone.trim(),
        source_step: "final_cta",
        utm: getUtm(),
      });
      setDone(true);
      toast.success(mc?.form_success ?? "Заявка отправлена");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
        <span>{mc?.form_success ?? "Спасибо! Мы свяжемся с вами."}</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-md space-y-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={mc?.form_placeholder ?? "Ваше имя"}
        className="h-12"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Телефон"
        type="tel"
        className="h-12"
      />
      <Button type="submit" disabled={submitting} className="w-full h-12 text-base">
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          mc?.form_submit ?? blocks.final_cta?.cta ?? "Оставить заявку"
        )}
      </Button>
      {mc?.trust_badge && (
        <p className="text-xs text-center text-muted-foreground">{mc.trust_badge}</p>
      )}
    </form>
  );
}

function renderBlock(key: string, b: FullLandingBlocks, showNote: boolean) {
  switch (key) {
    case "hero": {
      const bl = b.hero;
      if (!bl) return null;
      if (bl.story_opening) {
        return (
          <Section key={key} note={bl.note} showNote={showNote} className="pt-6 md:pt-10">
            <div className="space-y-4 text-lg leading-relaxed text-foreground/90">
              {bl.story_opening.split(/\n\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {bl.story_bridge && (
              <p className="mt-6 text-muted-foreground leading-relaxed">{bl.story_bridge}</p>
            )}
            <div className="mt-10 pt-6 border-t border-border">
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">{bl.headline}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{bl.subheadline}</p>
              <div className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold">
                {bl.cta}
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {bl.trust.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            </div>
          </Section>
        );
      }
      return (
        <Section key={key} note={bl.note} showNote={showNote} className="pt-6 md:pt-10">
          {b.micro_copy?.hero_badge && (
            <div className="mb-4 inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              {b.micro_copy.hero_badge}
            </div>
          )}
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">{bl.headline}</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">{bl.subheadline}</p>
          <div className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold">
            {bl.cta}
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {bl.trust.map((t, i) => (
              <li key={i}>· {t}</li>
            ))}
          </ul>
          {showNote && bl.headline_variants && bl.headline_variants.length > 0 && (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-card/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                3 варианта заголовка
              </div>
              <ol className="space-y-2">
                {bl.headline_variants.map((v, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {["Результат", "Боль", "Механизм"][i]}: {v}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Section>
      );
    }
    case "paradigm_shift": {
      const bl = b.paradigm_shift;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <ParadigmShiftSection block={bl} variant="full" />
          <TransitionHook text={bl.transition_hook} />
        </Section>
      );
    }
    case "pain": {
      const bl = b.pain;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{bl.title}</h2>
          {bl.intro && <p className="text-muted-foreground mb-4 leading-relaxed">{bl.intro}</p>}
          <ul className="space-y-2">
            {bl.points.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary">→</span>
                <span>{bold(p)}</span>
              </li>
            ))}
          </ul>
          <TransitionHook text={bl.transition_hook} />
        </Section>
      );
    }
    case "enemy_section": {
      const bl = b.enemy_section;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{bl.headline}</h2>
          <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 mb-4">
            <p className="font-semibold text-lg">{bl.enemy_name}</p>
          </div>
          <p className="text-muted-foreground mb-3">{bl.how_enemy_works}</p>
          <p className="text-sm">
            <span className="font-semibold">Доказательство: </span>
            <span className="text-muted-foreground">{bl.proof}</span>
          </p>
          <TransitionHook text={bl.transition_hook} />
        </Section>
      );
    }
    case "solution": {
      const bl = b.solution;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <ol className="space-y-4">
            {bl.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-muted-foreground text-sm mt-0.5">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
          <TransitionHook text={bl.transition_hook} />
        </Section>
      );
    }
    case "transformation": {
      const bl = b.transformation;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">{bl.headline}</h2>
          {bl.timeline && (
            <div className="mb-4 inline-flex rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              За {bl.timeline}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <div className="text-[10px] font-bold uppercase text-destructive/70 mb-3">До</div>
              <ul className="space-y-2">
                {bl.before.map((item, i) => (
                  <li key={i} className="text-sm">
                    ✗ {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="text-[10px] font-bold uppercase text-primary mb-3">После</div>
              <ul className="space-y-2">
                {bl.after.map((item, i) => (
                  <li key={i} className="text-sm font-medium">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      );
    }
    case "value": {
      const bl = b.value;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {bl.metrics.map((m, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="font-display text-2xl md:text-3xl font-bold text-primary">{m.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    case "product": {
      const bl = b.product;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{bl.title}</h2>
          {bl.anchor_context && (
            <p className="mb-5 rounded-lg border-l-2 border-destructive/60 bg-destructive/5 px-4 py-2 text-sm text-muted-foreground">
              {bl.anchor_context}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {bl.tiers.map((t, i) => (
              <div key={i} className="rounded-xl border border-border p-5">
                <div className="font-semibold text-lg">{t.name}</div>
                <div className="font-display text-2xl font-bold mt-1">{t.price}</div>
                {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                <ul className="mt-4 space-y-1.5 text-sm">
                  {t.features.map((f, j) => (
                    <li key={j}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    case "process": {
      const bl = b.process;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <ol className="space-y-4 border-l-2 border-border pl-5">
            {bl.steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary" />
                <div className="font-semibold">{s.title}</div>
                <div className="text-muted-foreground text-sm mt-0.5">{s.desc}</div>
              </li>
            ))}
          </ol>
        </Section>
      );
    }
    case "founder": {
      const bl = b.founder;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">{bl.headline}</h2>
          <p className="text-muted-foreground mb-5 leading-relaxed">{bl.story}</p>
          <ul className="space-y-2 mb-4">
            {bl.credentials.map((c, i) => (
              <li key={i} className="text-sm">
                ✓ {c}
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {bl.why_this}
          </p>
        </Section>
      );
    }
    case "comparison": {
      const bl = b.comparison;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{bl.title}</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left">
                <tr>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3 font-semibold text-primary">{bl.us_label}</th>
                  <th className="px-4 py-3 text-muted-foreground">{bl.them_label}</th>
                </tr>
              </thead>
              <tbody>
                {bl.rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.feature}</td>
                    <td className="px-4 py-3">{r.us}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      );
    }
    case "social_proof": {
      const bl = b.social_proof;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <div className="space-y-4">
            {bl.items.map((s, i) => (
              <blockquote key={i} className="rounded-xl border-l-2 border-primary bg-card px-5 py-4">
                <p className="italic">«{s.quote}»</p>
                <footer className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{s.author}</span>, {s.role}
                  {s.result && <> · <span className="text-primary">{s.result}</span></>}
                </footer>
              </blockquote>
            ))}
          </div>
        </Section>
      );
    }
    case "not_for": {
      const bl = b.not_for;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{bl.title}</h2>
          <ul className="space-y-2">
            {bl.points.map((p, i) => (
              <li key={i}>× {bold(p)}</li>
            ))}
          </ul>
        </Section>
      );
    }
    case "objections": {
      const bl = b.objections;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <div className="space-y-4">
            {bl.items.map((it, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="font-semibold mb-2">— {bold(it.objection)}</div>
                <div className="text-muted-foreground text-sm">{bold(it.answer)}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    case "faq": {
      const bl = b.faq;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-5">{bl.title}</h2>
          <div className="space-y-4">
            {bl.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="font-semibold">{bold(it.q)}</div>
                <div className="text-muted-foreground text-sm mt-1.5">{bold(it.a)}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    case "future_pacing": {
      const bl = b.future_pacing;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-5">{bl.headline}</h2>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <p className="text-lg leading-relaxed">{bl.scene}</p>
            <p className="mt-3 text-primary font-medium">{bl.emotions}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{bl.contrast}</p>
        </Section>
      );
    }
    case "guarantee": {
      const bl = b.guarantee;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote}>
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{bl.headline}</h2>
            <p className="mb-4">{bl.emotional_hook}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{bl.type}</span> · {bl.duration} · {bl.conditions}
            </p>
          </div>
        </Section>
      );
    }
    case "final_cta": {
      const bl = b.final_cta;
      if (!bl) return null;
      return (
        <Section key={key} note={bl.note} showNote={showNote} className="pb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">{bl.headline}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{bl.subheadline}</p>
          {bl.urgency && <p className="mt-3 text-sm text-muted-foreground">{bl.urgency}</p>}
          {bl.risk_reversal && <p className="mt-2 text-xs text-muted-foreground">✓ {bl.risk_reversal}</p>}
        </Section>
      );
    }
    default:
      return null;
  }
}

export function FullLandingRenderer({ prototypeId, content, mode = "public" }: Props) {
  const blocks = (content.blocks ?? {}) as FullLandingBlocks;
  const showNote = mode === "preview";
  const sequence = buildFullLandingSequence(content.meta?.sequence);
  const isPublic = mode === "public";

  if ((blocks as Record<string, unknown>)._placeholder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground text-center max-w-md">
          Страница ещё не сгенерирована. Перегенерируйте прототип в Лаборатории.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="mx-auto max-w-3xl px-5 md:px-8 pb-8">
        {sequence.map((key) => renderBlock(key, blocks, showNote))}
        {isPublic && <FullLandingLeadForm prototypeId={prototypeId} blocks={blocks} />}
      </article>
    </div>
  );
}
