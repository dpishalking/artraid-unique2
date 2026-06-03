import { Download, Share2, Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Audit } from "../AuditDashboard";

type Props = {
  audit: Audit;
  hostname: string;
  onExportPdf: () => void;
  exporting: boolean;
  shareUrl: string | null;
  copied: boolean;
  onCopyShare: () => void;
  onReset: () => void;
  readOnly: boolean;
};

/** Заголовок отчёта — один вывод, без визуального шума. */
export function ReportHero({
  audit,
  hostname,
  onExportPdf,
  exporting,
  shareUrl,
  copied,
  onCopyShare,
  onReset,
  readOnly,
}: Props) {
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const loss = audit.diagnosis.estimatedLossPercent || "—";
  const mainLever = audit.diagnosis.mainLever || audit.diagnosis.mainProblem;

  return (
    <section
      data-pdf-section
      className="rounded-2xl border border-border bg-card px-6 py-8 sm:px-8"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>AI-разбор</span>
        <span aria-hidden>·</span>
        <span>{date}</span>
        <span aria-hidden>·</span>
        <span className="truncate">{hostname}</span>
      </div>

      <h1 className="mt-4 max-w-3xl text-xl font-semibold leading-snug text-foreground sm:text-2xl">
        Потери на первом экране и в форме — около{" "}
        <span className="font-bold tabular-nums">{loss}</span> выручки.
      </h1>

      {mainLever && (
        <div className="mt-5 max-w-2xl space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Главный рычаг · 1–2 недели
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">{mainLever}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={onExportPdf} disabled={exporting} size="sm" data-event="pdf-download">
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? "Готовлю PDF…" : "Скачать PDF"}
        </Button>

        {shareUrl ? (
          <Button variant="outline" size="sm" onClick={onCopyShare}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Скопировано
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </>
            )}
          </Button>
        ) : null}

        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Новый разбор
          </Button>
        )}
      </div>
    </section>
  );
}
