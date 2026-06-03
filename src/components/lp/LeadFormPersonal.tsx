import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClipCtaButton } from "./clipDesign";
import type { ForgeClipStepContent } from "@/lib/forge/types";

type Props = {
  prototypeId: string;
  step: string;
  content: NonNullable<ForgeClipStepContent["lead_form_personal"]>;
  personaImageUrl?: string;
  onSubmitted?: () => void;
  variant?: "default" | "clip";
};

export function LeadFormPersonal({
  prototypeId,
  step,
  content,
  personaImageUrl,
  onSubmitted,
  variant = "default",
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fields = content.fields ?? [
    { id: "name" as const, placeholder: "Ваше имя" },
    { id: "phone" as const, placeholder: "Телефон" },
  ];
  const isClip = variant === "clip";

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
    if (!consent) return toast.error("Подтвердите согласие на обработку данных");
    if (!name.trim() || !phone.trim()) return toast.error("Заполните имя и телефон");
    setSubmitting(true);
    try {
      const { forgeApi } = await import("@/lib/forge/api");
      await forgeApi.submitLead({
        prototype_id: prototypeId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source_step: step,
        utm: getUtm(),
      });
      setDone(true);
      onSubmitted?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Не удалось отправить";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={
          isClip
            ? "rounded-2xl p-8 text-center text-white"
            : "rounded-3xl bg-emerald-600 text-white p-8 text-center"
        }
        style={isClip ? { backgroundColor: "#12141D" } : undefined}
      >
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={isClip ? { color: "#F9C846" } : undefined} />
        <h3 className="text-xl font-semibold">Заявка принята</h3>
        <p className="text-sm opacity-90 mt-1">Скоро с вами свяжется специалист.</p>
      </motion.div>
    );
  }

  if (isClip) {
    return (
      <div className="rounded-2xl p-5 md:p-6 text-white" style={{ backgroundColor: "#12141D" }}>
        <div className="grid gap-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold leading-tight">{content.headline}</h2>
            {content.subheadline && (
              <p className="text-sm text-white/75 mt-2 leading-relaxed">{content.subheadline}</p>
            )}

            <form onSubmit={submit} className="mt-4 space-y-3">
              <div className="space-y-2">
                {fields.map((f) => (
                  <div key={f.id} className="relative">
                    {f.id === "name" && (
                      <User className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                    {f.id === "phone" && (
                      <Phone className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                    {f.id === "email" && (
                      <Mail className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                    <input
                      type={f.id === "phone" ? "tel" : f.id === "email" ? "email" : "text"}
                      inputMode={f.id === "phone" ? "tel" : undefined}
                      placeholder={f.placeholder}
                      value={f.id === "name" ? name : f.id === "phone" ? phone : email}
                      onChange={(e) => {
                        if (f.id === "name") setName(e.target.value);
                        else if (f.id === "phone") setPhone(e.target.value);
                        else if (f.id === "email") setEmail(e.target.value);
                      }}
                      className="w-full h-12 rounded-xl bg-white text-slate-900 px-4 pr-10 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F9C846]/60"
                      required={f.id !== "email"}
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-2 text-[11px] text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{content.consent_text}</span>
              </label>

              {submitting ? (
                <div
                  className="w-full h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#F9C846" }}
                >
                  <Loader2 className="h-5 w-5 animate-spin text-black" />
                </div>
              ) : (
                <ClipCtaButton label={content.cta} type="submit" />
              )}
            </form>
          </div>

          {(content.persona_name || personaImageUrl) && (
            <div className="flex items-center gap-3 pt-1 border-t border-white/10">
              {personaImageUrl ? (
                <img
                  src={personaImageUrl}
                  alt={content.persona_name ?? ""}
                  className="h-14 w-14 object-cover rounded-full ring-2 ring-white/20"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-white/40" />
                </div>
              )}
              <div>
                {content.persona_name && (
                  <p className="font-medium text-sm">
                    {content.persona_name}
                    {content.persona_role && <span className="text-white/70">, {content.persona_role}</span>}
                  </p>
                )}
                {content.persona_status && (
                  <p className="text-xs text-white/70 mt-0.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1" />
                    {content.persona_status}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-indigo-600 text-white p-6 md:p-8 overflow-hidden">
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold uppercase leading-tight">{content.headline}</h2>
          {content.subheadline && (
            <p className="text-sm md:text-base opacity-90 mt-2 max-w-md">{content.subheadline}</p>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              {fields.map((f) => (
                <div key={f.id} className="relative">
                  {f.id === "name" && (
                    <User className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
                  )}
                  {f.id === "phone" && (
                    <Phone className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
                  )}
                  {f.id === "email" && (
                    <Mail className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
                  )}
                  <input
                    type={f.id === "phone" ? "tel" : f.id === "email" ? "email" : "text"}
                    inputMode={f.id === "phone" ? "tel" : undefined}
                    placeholder={f.placeholder}
                    value={f.id === "name" ? name : f.id === "phone" ? phone : email}
                    onChange={(e) => {
                      if (f.id === "name") setName(e.target.value);
                      else if (f.id === "phone") setPhone(e.target.value);
                      else if (f.id === "email") setEmail(e.target.value);
                    }}
                    className="w-full h-12 rounded-xl bg-white text-slate-900 px-4 pr-10 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                    required={f.id !== "email"}
                  />
                </div>
              ))}
            </div>

            <label className="flex items-start gap-2 text-xs opacity-90 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>{content.consent_text}</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold inline-flex items-center"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {content.cta}
            </button>
          </form>
        </div>

        {(content.persona_name || personaImageUrl) && (
          <div className="hidden md:flex flex-col items-end text-right shrink-0">
            {personaImageUrl ? (
              <img
                src={personaImageUrl}
                alt={content.persona_name ?? ""}
                className="h-44 w-44 object-cover rounded-full ring-4 ring-white/20"
              />
            ) : (
              <div className="h-44 w-44 rounded-full bg-white/10 ring-4 ring-white/20 flex items-center justify-center">
                <User className="h-16 w-16 text-white/40" />
              </div>
            )}
            {content.persona_name && (
              <p className="mt-3 font-medium">
                {content.persona_name}
                {content.persona_role && <span className="opacity-80">, {content.persona_role}</span>}
              </p>
            )}
            {content.persona_status && (
              <p className="text-xs opacity-90 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1" />
                {content.persona_status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
