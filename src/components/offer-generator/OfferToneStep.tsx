import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OFFER_TONE_OPTIONS } from "@/lib/offer-generator/constants";
import type { OfferBrief, OfferTone } from "@/lib/offer-generator/types";

type Props = {
  brief: OfferBrief;
  onSelect: (tone: OfferTone) => void;
  onAdditionalContextChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function OfferToneStep({
  brief,
  onSelect,
  onAdditionalContextChange,
  onBack,
  onSubmit,
  loading,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="w-full"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5">Бриф</span>
        <span>Шаг 8 из 8</span>
      </div>

      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
        Какой тон нужен?
      </h2>
      <p className="mt-3 text-muted-foreground">Выберите стиль подачи — от него зависит формулировка оффера.</p>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {OFFER_TONE_OPTIONS.map((opt) => {
          const selected = brief.tone === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`flex items-start justify-between rounded-xl border px-4 py-3 text-left transition-all hover:border-primary/40 ${
                selected ? "border-primary/60 bg-primary/10" : "border-border bg-card/60"
              }`}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium leading-snug">{opt.label}</span>
                <span className="text-[12px] leading-snug text-muted-foreground">{opt.hint}</span>
              </span>
              {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card/60 p-4">
        <label className="text-sm font-semibold text-foreground" htmlFor="offer-additional-context">
          Что ещё важно учесть? <span className="font-normal text-muted-foreground">(необязательно)</span>
        </label>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Можно дописать дедлайн, цену, ограничения, фразы клиента, желаемый стиль, примеры сильных офферов
          или то, что нельзя обещать.
        </p>
        <Textarea
          id="offer-additional-context"
          value={brief.additionalContext}
          onChange={(e) => onAdditionalContextChange(e.target.value)}
          placeholder="Например: не обещать рост продаж напрямую; цена от 45 000 ₽; аудитория скептичная, уже пробовала подрядчиков; хочется звучать спокойно, но уверенно."
          rows={4}
          maxLength={900}
          className="mt-3 min-h-[110px] resize-none rounded-2xl border-2 bg-background/60 p-4 text-base leading-relaxed placeholder:text-sm placeholder:italic"
        />
        <div className="mt-2 text-right text-xs tabular-nums text-muted-foreground">
          {brief.additionalContext.trim().length > 0 ? `${brief.additionalContext.trim().length} симв.` : ""}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          ← Назад
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || !brief.tone}
          className="h-12 px-8 bg-gradient-money text-primary-foreground font-semibold shadow-glow disabled:opacity-40"
        >
          {loading ? "Генерируем…" : "Собрать оффер"}
        </Button>
      </div>
    </motion.div>
  );
}
