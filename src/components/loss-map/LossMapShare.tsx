import { useState } from "react";
import { Check, Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportLossMapPng } from "@/lib/loss-map/exportLossMapPng";

type Props = {
  cardRef: React.RefObject<HTMLDivElement | null>;
  hostname: string;
  shareUrl: string | null;
  onCopyShare?: () => void;
  copiedShare?: boolean;
};

export function LossMapShare({ cardRef, hostname, shareUrl, onCopyShare, copiedShare }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const el = cardRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const safeHost = hostname.replace(/[^a-z0-9.-]+/gi, "-").slice(0, 40);
      await exportLossMapPng(el, `karta-poter-${safeHost}.png`);
      toast.success("Карта сохранена — можно отправить в чат");
    } catch {
      toast.error("Не удалось сохранить картинку");
    } finally {
      setDownloading(false);
    }
  };

  const handleTelegram = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(
      `Разбор сайта ${hostname}: карта потерь заявок и полный AI-аудит`,
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" data-pdf-hide>
      <Button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="bg-gradient-money text-primary-foreground font-semibold shadow-glow"
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Скачать карту (PNG)
      </Button>

      {shareUrl && onCopyShare && (
        <Button type="button" variant="outline" onClick={onCopyShare}>
          {copiedShare ? <Check className="mr-2 h-4 w-4 text-money" /> : <Share2 className="mr-2 h-4 w-4" />}
          {copiedShare ? "Ссылка скопирована" : "Ссылка на полный отчёт"}
        </Button>
      )}

      {shareUrl && (
        <Button type="button" variant="secondary" onClick={handleTelegram}>
          Отправить в Telegram
        </Button>
      )}
    </div>
  );
}
