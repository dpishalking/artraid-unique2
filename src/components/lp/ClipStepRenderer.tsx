import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { LeadFormPersonal } from "./LeadFormPersonal";
import { CLIP, ClipCtaButton } from "./clipDesign";
import { ParadigmShiftSection } from "./ParadigmShiftSection";
import type { ForgeClipMeta, ForgeClipStepContent } from "@/lib/forge/types";

type Props = {
  prototypeId: string;
  slug: string;
  step: ForgeClipStepContent;
  stepIndex: number;
  total: number;
  nextHref: string | null;
  clipMeta?: ForgeClipMeta;
};

export function ClipStepRenderer({
  prototypeId,
  slug,
  step,
  stepIndex,
  total,
  nextHref,
  clipMeta,
}: Props) {
  const supportPhone = clipMeta?.support_phone?.trim() || "8 800 555-35-35";
  const liveReaders = clipMeta?.live_readers_hint ?? 12;

  return (
    <div
      className="min-h-screen text-[#1a1a1a]"
      style={{
        backgroundColor: CLIP.bg,
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 48px)",
      }}
    >
      <ClipTopBar phone={supportPhone} readers={liveReaders} />

      <div className="max-w-lg mx-auto px-4 pb-10 pt-4 space-y-6">
        <StepProgress current={stepIndex + 1} total={total} />

        {step.hero && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 px-1"
          >
            {step.hero.badge && (
              <span
                className="inline-block text-xs font-medium px-3 py-1 rounded-full"
                style={{ backgroundColor: `${CLIP.yellow}33`, color: "#5c4a00" }}
              >
                {step.hero.badge}
              </span>
            )}
            <h1 className="text-[1.65rem] leading-tight md:text-4xl font-bold tracking-tight text-[#2a2a2a]">
              {step.hero.headline}
            </h1>
            {step.hero.subheadline && (
              <p className="text-sm md:text-base text-[#6b7280] leading-relaxed max-w-md mx-auto">
                {step.hero.subheadline}
              </p>
            )}
          </motion.section>
        )}

        {step.pain && (
          <DarkCard>
            <h2 className="font-bold text-base md:text-lg text-white leading-snug">{step.pain.title}</h2>
            <ul className="mt-4 space-y-3">
              {step.pain.points.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm md:text-[15px] text-white/95 leading-snug">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CLIP.red }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </DarkCard>
        )}

        {step.old_loop && (
          <DarkCard>
            <h2 className="font-bold text-base md:text-lg text-white leading-snug">{step.old_loop.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {step.old_loop.items.map((item, i) => (
                <li key={i} className="text-sm md:text-[15px] text-white/85 leading-snug pl-3 border-l-2 border-white/20">
                  {item}
                </li>
              ))}
            </ul>
          </DarkCard>
        )}

        {step.pain_escalation && (
          <section
            className="rounded-2xl p-5 border text-center space-y-2"
            style={{ backgroundColor: `${CLIP.red}12`, borderColor: `${CLIP.red}44` }}
          >
            <h2 className="font-bold text-base md:text-lg text-[#2a2a2a] leading-snug">
              {step.pain_escalation.headline}
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-wrap">
              {step.pain_escalation.body}
            </p>
          </section>
        )}

        {step.mechanism && (
          <DarkCard>
            <h2 className="font-bold text-base md:text-lg text-white">{step.mechanism.title}</h2>
            <p className="mt-3 text-sm md:text-[15px] text-white/85 leading-relaxed whitespace-pre-wrap">
              {step.mechanism.body}
            </p>
          </DarkCard>
        )}

        {step.paradigm_shift && (
          <DarkCard>
            <ParadigmShiftSection block={step.paradigm_shift} variant="clip" />
          </DarkCard>
        )}

        {step.benefits && (
          <section className="rounded-2xl p-5 bg-white border border-black/5 space-y-3">
            <h2 className="font-bold text-base text-[#2a2a2a]">{step.benefits.title}</h2>
            <ul className="space-y-2">
              {step.benefits.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-[#374151] leading-snug">
                  <span className="font-bold shrink-0" style={{ color: CLIP.yellow }}>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step.story && (
          <DarkCard>
            <h2 className="font-bold text-base md:text-lg text-white">{step.story.headline}</h2>
            <p className="mt-3 text-sm md:text-[15px] text-white/85 leading-relaxed whitespace-pre-wrap">
              {step.story.body}
            </p>
            {(step.story.author || step.story.result) && (
              <p className="mt-4 text-xs text-white/60 border-t border-white/10 pt-3">
                {step.story.author && <span>— {step.story.author}</span>}
                {step.story.result && (
                  <span className="block mt-1 text-white/80">{step.story.result}</span>
                )}
              </p>
            )}
          </DarkCard>
        )}

        {step.social_proof && (
          <section className="space-y-3">
            <h2 className="font-bold text-base text-center text-[#2a2a2a]">{step.social_proof.title}</h2>
            <div className="space-y-3">
              {step.social_proof.items.map((it, i) => (
                <DarkCard key={i} className="!py-4">
                  <p className="text-sm text-white/95 leading-relaxed">&ldquo;{it.quote}&rdquo;</p>
                  <p className="text-xs text-white/60 mt-2">
                    — {it.author}
                    {it.role ? `, ${it.role}` : ""}
                  </p>
                </DarkCard>
              ))}
            </div>
          </section>
        )}

        {step.metrics && (
          <section>
            <h2 className="font-bold text-base text-center text-[#2a2a2a] mb-3">{step.metrics.title}</h2>
            <div className="grid grid-cols-2 gap-2">
              {step.metrics.items.map((m, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 text-center"
                  style={{ backgroundColor: CLIP.card }}
                >
                  <div className="text-2xl font-bold" style={{ color: CLIP.yellow }}>
                    {m.number}
                  </div>
                  <div className="text-[11px] text-white/70 mt-1 leading-tight">{m.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step.who_for && (
          <section className="rounded-2xl p-5 bg-white border border-black/5 space-y-4">
            <h2 className="font-bold text-base text-[#2a2a2a]">{step.who_for.title}</h2>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-[#9ca3af] mb-2">Подойдёт, если</div>
              <ul className="space-y-1.5">
                {step.who_for.for_items.map((item, i) => (
                  <li key={i} className="text-sm text-[#374151] flex gap-2">
                    <span style={{ color: CLIP.yellow }}>+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {step.who_for.not_for_items && step.who_for.not_for_items.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[#9ca3af] mb-2">Пока не для вас, если</div>
                <ul className="space-y-1.5">
                  {step.who_for.not_for_items.map((item, i) => (
                    <li key={i} className="text-sm text-[#6b7280] flex gap-2">
                      <span className="text-[#9ca3af]">−</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {step.lead_form_personal && (
          <LeadFormPersonal
            prototypeId={prototypeId}
            step={step.key}
            content={step.lead_form_personal}
            variant="clip"
          />
        )}

        {step.guarantee && (
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: `${CLIP.yellow}18`, borderColor: `${CLIP.yellow}55` }}
          >
            <h3 className="font-semibold text-[#2a2a2a]">{step.guarantee.headline}</h3>
            {step.guarantee.body && (
              <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{step.guarantee.body}</p>
            )}
          </div>
        )}

        {step.micro_trust && step.micro_trust.items.length > 0 && (
          <section className="flex flex-wrap gap-2 justify-center text-[11px] text-[#6b7280]">
            {step.micro_trust.items.map((t, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full border border-black/10 bg-white/70"
              >
                {t}
              </span>
            ))}
          </section>
        )}

        {step.objections && step.objections.items.length > 0 && (
          <section className="space-y-2">
            {step.objections.items.map((item, i) => (
              <div key={i} className="rounded-xl border border-black/8 bg-white/80 p-3.5">
                <div className="text-sm font-medium text-[#2a2a2a]">{item.question}</div>
                <p className="text-sm text-[#6b7280] mt-1 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </section>
        )}

        {step.cta && nextHref && (
          <div className="pt-1">
            <Link to={nextHref} className="block">
              <ClipCtaButton label={step.cta.label} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ClipTopBar({ phone, readers }: { phone: string; readers: number }) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs border-b border-black/5"
      style={{ backgroundColor: CLIP.bg }}
    >
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 font-medium text-[#374151]">
        <Phone className="h-3.5 w-3.5" />
        {phone}
      </a>
      <span className="text-[#9ca3af]">
        Сейчас читают: <span className="text-[#374151] font-medium">{readers}</span>
      </span>
    </div>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-[#9ca3af]">
      <span>
        Шаг {current} из {total}
      </span>
      <div className="flex gap-1.5 items-center">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i < current ? 28 : 18,
              backgroundColor: i < current ? CLIP.yellow : CLIP.card,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DarkCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl p-5 md:p-6 ${className}`}
      style={{ backgroundColor: CLIP.card }}
    >
      {children}
    </section>
  );
}
