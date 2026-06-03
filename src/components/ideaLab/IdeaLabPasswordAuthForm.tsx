import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowRight, Loader2, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LegalDocLink } from "@/components/legal/LegalDocLink";
import { mapAuthErrorMessage } from "@/lib/auth/authErrors";
import { signInWithLoginPassword, signUpWithPassword } from "@/lib/auth/passwordAuth";
import { il } from "@/lib/ideaLab/uiClasses";

const identitySchema = z.string().trim().min(1, "Укажите email или логин").max(255);
const passwordSchema = z.string().min(8, "Минимум 8 символов").max(72);

type AuthMode = "signin" | "signup";

type Props = {
  redirectNext: string;
  className?: string;
  defaultMode?: AuthMode;
};

export function IdeaLabPasswordAuthForm({
  redirectNext,
  className,
  defaultMode = "signup",
}: Props) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const idv = identitySchema.safeParse(identity);
    if (!idv.success) {
      toast.error(idv.error.issues[0].message);
      return;
    }
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) {
      toast.error(pv.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await signUpWithPassword({
          identity: idv.data,
          password: pv.data,
          redirectNext,
        });
        if (error) throw error;
        toast.success("Аккаунт создан — открываем дашборд…");
      } else {
        const { error } = await signInWithLoginPassword({
          identity: idv.data,
          password: pv.data,
        });
        if (error) throw error;
        toast.success("Добро пожаловать!");
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Не удалось войти";
      toast.error(mapAuthErrorMessage(raw), { duration: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  const authForgotHref = `/auth?next=${encodeURIComponent(redirectNext)}`;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-3 flex rounded-lg border border-border/80 bg-muted/30 p-0.5">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
            mode === "signup"
              ? "bg-amber-500/15 text-amber-200 shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Регистрация
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
            mode === "signin"
              ? "bg-amber-500/15 text-amber-200 shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Вход
        </button>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="idea-auth-identity">
            {mode === "signup" ? "Email или логин" : "Логин или email"}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="idea-auth-identity"
              type="text"
              required
              autoComplete={mode === "signup" ? "username" : "username"}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              className="h-10 pl-10"
              placeholder={mode === "signup" ? "ivan или you@mail.com" : "Ваш логин"}
            />
          </div>
          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Без почты — только логин (латиница, цифры, точка, дефис). Так не тратится лимит
              писем и вход сразу после регистрации.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="idea-auth-password">Пароль</Label>
            {mode === "signin" && (
              <Link
                to={authForgotHref}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Забыли пароль?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="idea-auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 pl-10"
              placeholder="Минимум 8 символов"
            />
          </div>
        </div>

        <Button type="submit" className={cn("mt-1 h-10 w-full", il.btnPrimary)} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === "signup" ? "Создать аккаунт" : "Войти"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {mode === "signup" && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground leading-snug">
          Регистрируясь, вы принимаете{" "}
          <LegalDocLink doc="oferta" className="underline hover:text-foreground">
            оферту
          </LegalDocLink>{" "}
          и{" "}
          <LegalDocLink doc="privacy" className="underline hover:text-foreground">
            политику конфиденциальности
          </LegalDocLink>
          .
        </p>
      )}
    </div>
  );
}
