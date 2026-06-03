import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Lightbulb, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { submitProductIdea } from "@/lib/submitProductIdea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HIDDEN_PREFIXES = ["/admin"];

export function SuggestIdeaFab() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const handleSubmit = async () => {
    const text = message.trim();
    if (text.length < 10) {
      toast.error("Опишите идею чуть подробнее (минимум 10 символов)");
      return;
    }
    if (!user && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Проверьте email");
      return;
    }

    setSending(true);
    try {
      await submitProductIdea({
        message: text,
        email: user ? undefined : email.trim() || undefined,
        page_path: pathname,
        source: "fab",
      });
      toast.success("Спасибо! Идея отправлена — учтём при развитии сервиса");
      setMessage("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="fixed bottom-4 right-4 z-40 gap-2 rounded-full border border-border/80 bg-card/95 px-4 shadow-lg backdrop-blur hover:bg-card md:bottom-6 md:right-6"
        onClick={() => setOpen(true)}
      >
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">Предложить идею</span>
        <span className="sm:hidden">Идея</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Предложить идею</DialogTitle>
            <DialogDescription>
              Расскажите, какую функцию или инструмент вам не хватает — мы читаем все предложения.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="idea-message">Ваша идея</Label>
              <Textarea
                id="idea-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Например: хочу выгружать аудит в Notion или сравнивать два варианта оффера рядом…"
                rows={5}
                maxLength={2000}
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="idea-email">Email (необязательно)</Label>
                <Input
                  id="idea-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Чтобы ответить, если уточним детали"
                  disabled={sending}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Отмена
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
