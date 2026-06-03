import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";
import { formatBestOfferCopy } from "@/lib/offer-generator/formatters";
import type { OfferResult } from "@/lib/offer-generator/types";

type Props = {
  result: OfferResult;
  onRegenerate: () => void;
  onRestart: () => void;
  loading?: boolean;
};

export function OfferActions({ result, onRegenerate, onRestart, loading }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <CopyButton
        text={formatBestOfferCopy(result)}
        label="Скопировать лучший оффер"
        variant="secondary"
        size="default"
      />
      <Button
        type="button"
        onClick={onRegenerate}
        disabled={loading}
        className="bg-gradient-money text-primary-foreground font-semibold shadow-glow"
      >
        {loading ? "Генерируем…" : "Сгенерировать ещё"}
      </Button>
      <Button type="button" variant="outline" onClick={onRestart} disabled={loading}>
        Начать заново
      </Button>
    </div>
  );
}
