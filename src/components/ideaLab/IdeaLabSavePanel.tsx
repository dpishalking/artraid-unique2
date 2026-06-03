import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { authRedirectUrl } from "@/lib/auth/redirect";
import { isIdeaLabHost } from "@/constants/site";
import { ideaLabDashboardPath } from "@/lib/ideaLab/constants";

const emailSchema = z.string().trim().email("Некорректный email");

type Props = {
  onContinueLoggedIn: () => void;
  saving?: boolean;
};

export function IdeaLabSavePanel({ onContinueLoggedIn, saving }: Props) {
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    if (!ev.success) {
      toast.error(ev.error.issues[0].message);
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ev.data,
        options: {
          emailRedirectTo: authRedirectUrl(ideaLabDashboardPath()),
        },
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success("Ссылка отправлена — проверьте почту");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить письмо");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <FolderKanban className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Сохранить в проект</p>
          <p className="text-xs text-muted-foreground mt-1">
            Демо остаётся в браузере. Создайте аккаунт — перенесём диалог и карточку в ваш Idea Lab.
          </p>
        </div>
      </div>

      {emailSent ? (
        <p className="text-sm text-muted-foreground">
          Откройте ссылку из письма на этом устройстве — прогресс подтянется автоматически.
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="idea-lab-email" className="text-xs">
              Email
            </Label>
            <Input
              id="idea-lab-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full" disabled={authLoading}>
            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Получить ссылку для входа"}
          </Button>
        </form>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={onContinueLoggedIn}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Создаём проект…
          </>
        ) : (
          "Уже вошёл — создать проект"
        )}
      </Button>
    </div>
  );
}
