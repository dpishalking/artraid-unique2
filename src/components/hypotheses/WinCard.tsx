import { useRef, useState } from "react";
import { Check, Download, Loader2, Share2, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Hypothesis } from "@/lib/hypotheses/api";
import { parseHypothesisResult } from "@/lib/hypotheses/api";

type Props = {
  hypothesis: Hypothesis;
  domain?: string;
  open: boolean;
  onClose: () => void;
};

export function WinCardModal({ hypothesis, domain, open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { crBefore, crAfter, resultNote, liftPercent } = parseHypothesisResult(hypothesis);
  const displayDomain = domain || "ваш-сайт.ru";

  const handleDownload = async () => {
    const el = cardRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d0f14",
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.95),
      );
      if (!blob) throw new Error("no blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pobeda-${displayDomain.replace(/[^a-z0-9.-]/gi, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Карточка сохранена — поделитесь в Telegram или соцсетях!");
    } catch {
      toast.error("Не удалось сохранить карточку");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(
      `Внедрил правку на ${displayDomain} — конверсия выросла${liftPercent ? ` на ${liftPercent}%` : ""}! Сделано с pishalking.ru`,
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-money">
            <Trophy className="h-5 w-5" />
            Карточка победы
          </DialogTitle>
        </DialogHeader>

        {/* Visual card for screenshot */}
        <div
          ref={cardRef}
          className="rounded-2xl bg-gradient-to-br from-[#0d0f14] to-[#111827] border border-money/30 p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-money" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-money">
              Результат внедрения
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground font-mono">{displayDomain}</p>

          <p className="font-display text-base font-semibold text-foreground leading-snug">
            {hypothesis.title}
          </p>

          {(crBefore || crAfter || liftPercent !== null) && (
            <div className="flex items-center gap-4">
              {crBefore && (
                <div className="text-center">
                  <p className="text-[10px] uppercase text-muted-foreground">Было</p>
                  <p className="font-display text-xl font-bold text-foreground">{crBefore}%</p>
                </div>
              )}
              {crAfter && (
                <>
                  <TrendingUp className="h-5 w-5 text-money shrink-0" />
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Стало</p>
                    <p className="font-display text-xl font-bold text-money">{crAfter}%</p>
                  </div>
                </>
              )}
              {liftPercent !== null && (
                <div className="ml-auto rounded-full bg-money/20 border border-money/40 px-3 py-1">
                  <p className="font-display text-lg font-bold text-money">
                    +{liftPercent}%
                  </p>
                </div>
              )}
            </div>
          )}

          {resultNote && (
            <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
              {resultNote}
            </p>
          )}

          <div className="border-t border-border/30 pt-3 text-[10px] text-muted-foreground/60">
            pishalking.ru · AI-аудит и маркетинговый штаб
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-gradient-money text-primary-foreground font-semibold"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Скачать PNG
          </Button>

          <Button variant="outline" onClick={handleCopyLink}>
            {copied ? <Check className="mr-2 h-4 w-4 text-money" /> : <Share2 className="mr-2 h-4 w-4" />}
            {copied ? "Скопировано" : "Копировать ссылку"}
          </Button>

          <Button variant="secondary" onClick={handleTelegram}>
            Поделиться в Telegram
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
