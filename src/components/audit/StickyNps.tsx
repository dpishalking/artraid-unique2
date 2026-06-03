import { useEffect, useState } from "react";
import { X, Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface StickyNpsProps {
  auditId: string;
}

const STORAGE_KEY = "nps-submitted:";

export function StickyNps({ auditId }: StickyNpsProps) {
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY + auditId)) setHidden(true);
    } catch {
      /* ignore */
    }
  }, [auditId]);

  const submit = async (n: number) => {
    if (sending || sent) return;
    setSending(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-feedback`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ audit_id: auditId, nps: n }),
      });
      if (!r.ok) throw new Error("send failed");
      setSent(true);
      try {
        localStorage.setItem(STORAGE_KEY + auditId, "1");
      } catch {
        /* ignore */
      }
      toast.success("Спасибо за оценку!");
      setTimeout(() => setHidden(true), 1800);
    } catch {
      toast.error("Не получилось отправить. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 print:hidden sm:bottom-4">
      <div
        className={`pointer-events-auto w-full max-w-3xl rounded-2xl border border-border/50 bg-background/85 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ${
          open ? "opacity-100 translate-y-0" : "opacity-90 translate-y-1"
        }`}
      >
        {open ? (
          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-3.5">
            <div className="flex min-w-0 items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm leading-snug text-foreground/90">
                <span className="font-medium">Оцените разбор</span>
                <span className="hidden text-muted-foreground sm:inline">
                  {" "}— насколько готовы порекомендовать сервис?
                </span>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 sm:justify-end">
              {sent ? (
                <div className="flex items-center gap-2 text-sm text-money">
                  <Check className="h-4 w-4" /> Спасибо!
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const tone =
                      n <= 6
                        ? "border-destructive/40 hover:bg-destructive/15 hover:border-destructive/70"
                        : n <= 8
                          ? "border-yellow-500/40 hover:bg-yellow-500/15 hover:border-yellow-500/70"
                          : "border-money/40 hover:bg-money/15 hover:border-money/70";
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={sending}
                        onClick={() => submit(n)}
                        className={`h-8 w-8 rounded-md border bg-background/60 text-xs font-medium transition-colors disabled:opacity-50 sm:h-9 sm:w-9 sm:text-sm ${tone}`}
                      >
                        {sending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : n}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                aria-label="Свернуть"
                onClick={() => setOpen(false)}
                className="ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-foreground/80 hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Оценить разбор
          </button>
        )}
      </div>
    </div>
  );
}