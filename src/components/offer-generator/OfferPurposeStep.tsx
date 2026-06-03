import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, LayoutTemplate, Megaphone, MessagesSquare, BriefcaseBusiness, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  OFFER_PURPOSE_VECTORS,
  offerPurposeOptionsForVector,
  offerPurposeVector,
  type OfferPurposeVectorId,
} from "@/lib/offer-generator/constants";
import type { OfferBrief, OfferPurpose } from "@/lib/offer-generator/types";
import { OfferPurposeThumb } from "@/components/offer-generator/OfferPurposeThumb";

type Props = {
  brief: OfferBrief;
  onSelect: (purpose: OfferPurpose) => void;
  onCustomChange: (v: string) => void;
  onQuickStart?: () => void;
  onNext: () => void;
  error?: string | null;
};

const VECTOR_ICON: Record<
  OfferPurposeVectorId,
  typeof LayoutTemplate
> = {
  site_pages: LayoutTemplate,
  social_chat: MessagesSquare,
  ads_email: Megaphone,
  sales_materials: BriefcaseBusiness,
};

export function OfferPurposeStep({ brief, onSelect, onCustomChange, onQuickStart, onNext, error }: Props) {
  const [expandedVector, setExpandedVector] = useState<OfferPurposeVectorId | null>(null);
  const canNext =
    brief.offerPurpose !== "custom" || (brief.customPurpose?.trim().length ?? 0) >= 2;

  const selectedVectorHint = offerPurposeVector(brief.offerPurpose);

  const handlePickVector = (id: OfferPurposeVectorId) => {
    setExpandedVector(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const vectorMeta = expandedVector
    ? OFFER_PURPOSE_VECTORS.find((v) => v.id === expandedVector)
    : undefined;

  const purposeOptions = expandedVector ? offerPurposeOptionsForVector(expandedVector) : [];

  const CustomBlock = (
    <>
      {brief.offerPurpose === "custom" && (
        <div className="mt-6">
          <Input
            value={brief.customPurpose ?? ""}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="Опишите свой формат, например: скрипт для холодного звонка"
            className="h-12 rounded-xl border-2 text-base"
          />
        </div>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full"
    >
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
        Для чего вам нужен оффер?
      </h1>
      <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl">
        Можно выбрать конкретный формат, а можно начать с простого брифа. После генерации мы всё равно дадим
        версии для лендинга, поста, рекламы, сторис и email.
      </p>

      <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-background/80 text-primary">
              <Wand2 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-foreground">Самый простой старт</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Ответьте на вопросы про продукт, аудиторию и результат. Формат можно уточнить позже — оффер
                всё равно появится в нескольких готовых версиях.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onQuickStart}
            className="shrink-0 rounded-xl font-semibold"
          >
            Начать с брифа →
          </Button>
        </div>
      </div>

      {!expandedVector ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {OFFER_PURPOSE_VECTORS.map((vec) => {
              const Icon = VECTOR_ICON[vec.id];
              const highlighted =
                brief.offerPurpose !== "custom" && selectedVectorHint === vec.id;
              return (
                <button
                  key={vec.id}
                  type="button"
                  onClick={() => handlePickVector(vec.id)}
                  className={cn(
                    "group relative text-left rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                    highlighted
                      ? "border-primary/50 bg-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-card/60 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background/80 text-primary",
                        highlighted ? "border-primary/40" : "border-border",
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-base">{vec.label}</div>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {vec.description}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground/80">
                        {vec.purposes.length === 1
                          ? "1 формат"
                          : vec.purposes.length >= 2 && vec.purposes.length <= 4
                            ? `${vec.purposes.length} формата`
                            : `${vec.purposes.length} форматов`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 sm:px-5">
            <p className="text-sm text-muted-foreground mb-3">
              Нужен другой носитель — не входит ни в один раздел?
            </p>
            <button
              type="button"
              onClick={() => onSelect("custom")}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors sm:w-auto sm:inline-flex sm:items-center sm:justify-center",
                brief.offerPurpose === "custom"
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border bg-card/40 text-foreground hover:border-primary/35 hover:bg-card/70",
              )}
            >
              Свой формат вручную
            </button>
          </div>

          {CustomBlock}
        </>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setExpandedVector(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Все разделы
            </button>
            {vectorMeta && (
              <p className="text-sm text-muted-foreground sm:text-right">{vectorMeta.description}</p>
            )}
          </div>

          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            {vectorMeta?.label ?? "Формат"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Выберите носитель оффера в этом разделе.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {purposeOptions.map((opt) => {
              const selected = brief.offerPurpose === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelect(opt.id)}
                  className={`group relative text-left rounded-2xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    selected
                      ? "border-primary/60 bg-primary/10 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-card/60 hover:border-primary/30"
                  }`}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-money shadow-md">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </span>
                  )}
                  <OfferPurposeThumb id={opt.id} selected={selected} />
                  <motion.div className="font-semibold text-foreground pr-8 text-sm md:text-base">
                    {opt.label}
                  </motion.div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-4">
            <button
              type="button"
              onClick={() => {
                onSelect("custom");
                setExpandedVector(null);
              }}
              className={cn(
                "text-sm font-medium underline-offset-4 hover:underline",
                brief.offerPurpose === "custom" ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Нужен другой формат — указать вручную
            </button>
          </div>

          {CustomBlock}
        </>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-10 flex justify-end">
        <Button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="h-12 px-8 bg-gradient-money text-primary-foreground font-semibold shadow-glow disabled:opacity-40"
        >
          Дальше →
        </Button>
      </div>
    </motion.div>
  );
}
