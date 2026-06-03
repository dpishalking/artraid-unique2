import { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Check, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AuditFeedbackProps {
  auditId: string;
}

export function AuditFeedback({ auditId }: AuditFeedbackProps) {
  const [nps, setNps] = useState<number | null>(null);
  const [thumb, setThumb] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (sending || sent) return;
    if (nps === null && thumb === null && !comment.trim()) {
      toast.error("Оцените или оставьте комментарий");
      return;
    }
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
        body: JSON.stringify({
          audit_id: auditId,
          nps,
          thumb,
          comment: comment.trim() || null,
        }),
      });
      if (!r.ok) throw new Error("send failed");
      setSent(true);
      toast.success("Спасибо! Учли вашу обратную связь");
    } catch {
      toast.error("Не получилось отправить. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="mt-12 rounded-2xl border border-border/40 bg-background/50 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-money/15 text-money">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-semibold text-foreground">Обратная связь принята</div>
            <div>Каждый отзыв делает следующий разбор лучше.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-border/40 bg-background/40 p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Помогите улучшить разбор</h3>
      </div>

      {/* NPS */}
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium">
          По шкале 1–10, насколько вы готовы порекомендовать этот сервис коллегам или друзьям?
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = nps === n;
            const tone =
              n <= 6
                ? "border-destructive/40 hover:bg-destructive/10"
                : n <= 8
                  ? "border-yellow-500/40 hover:bg-yellow-500/10"
                  : "border-money/40 hover:bg-money/10";
            return (
              <button
                key={n}
                type="button"
                onClick={() => setNps(n)}
                className={`h-10 w-10 rounded-lg border text-sm font-medium transition-colors ${tone} ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-background/60"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>Точно не порекомендую</span>
          <span>Однозначно порекомендую</span>
        </div>
      </div>

      {/* Thumbs */}
      <div className="mb-6">
        <div className="mb-2 text-sm font-medium">Сам разбор был полезен?</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={thumb === "up" ? "default" : "outline"}
            size="sm"
            onClick={() => setThumb(thumb === "up" ? null : "up")}
          >
            <ThumbsUp className="mr-2 h-4 w-4" /> Да, полезно
          </Button>
          <Button
            type="button"
            variant={thumb === "down" ? "default" : "outline"}
            size="sm"
            onClick={() => setThumb(thumb === "down" ? null : "down")}
          >
            <ThumbsDown className="mr-2 h-4 w-4" /> Не очень
          </Button>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium">Что было ценно, чего не хватило, что было не так?</div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="Например: «По блоку отзывов разбор поверхностный», «Не хватило конкретики по оффер-упаковке»…"
        />
      </div>

      <Button onClick={submit} disabled={sending}>
        {sending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправляем…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Отправить отзыв
          </>
        )}
      </Button>
    </section>
  );
}