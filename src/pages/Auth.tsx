import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  authRedirectUrl,
  authRecoveryUrl,
  clearAuthOriginMemory,
  rememberAuthOrigin,
} from "@/lib/auth/redirect";
import { mapAuthErrorMessage } from "@/lib/auth/authErrors";
import { resolveAuthEmail } from "@/lib/auth/login";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { defaultAuthNextPath } from "@/lib/auth/redirect";
import { flowExitHome } from "@/lib/navigation/flowExit";

const emailSchema = z.string().trim().email("Некорректный email").max(255);
const loginSchema = z.string().trim().min(1, "Укажите email или логин").max(255);
const passwordSchema = z.string().min(8, "Минимум 8 символов").max(72);

type AuthMode = "signin" | "signup" | "forgot" | "recovery";

export default function Auth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || params.get("redirect") || defaultAuthNextPath();
  const [mode, setMode] = useState<AuthMode>(() =>
    params.get("type") === "recovery" ? "recovery" : "signup",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const recoveryPending = useRef(mode === "recovery");

  useEffect(() => {
    rememberAuthOrigin(next);
  }, [next]);

  useEffect(() => {
    if (params.get("type") === "recovery") {
      recoveryPending.current = true;
      setMode("recovery");
    }
  }, [params]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryPending.current = true;
        setMode("recovery");
        return;
      }
      if (session && !recoveryPending.current) {
        clearAuthOriginMemory();
        nav(next, { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !recoveryPending.current && params.get("type") !== "recovery") {
        clearAuthOriginMemory();
        nav(next, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [nav, next, params]);

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) { toast.error(pv.error.issues[0].message); return; }

    let authEmail: string;
    if (mode === "signup") {
      const ev = emailSchema.safeParse(email);
      if (!ev.success) { toast.error(ev.error.issues[0].message); return; }
      authEmail = ev.data;
    } else {
      const lv = loginSchema.safeParse(email);
      if (!lv.success) { toast.error(lv.error.issues[0].message); return; }
      try {
        authEmail = resolveAuthEmail(lv.data);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Некорректный логин");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: pv.data,
          options: {
            emailRedirectTo: authRedirectUrl(next),
            data: { name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Готово! Заходим…");
        nav(next, { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: pv.data });
        if (error) throw error;
        nav(next, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка";
      toast.error(mapAuthErrorMessage(msg), { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    if (!ev.success) { toast.error(ev.error.issues[0].message); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(ev.data, {
        redirectTo: authRecoveryUrl(next),
      });
      if (error) throw error;
      setResetEmailSent(true);
      toast.success("Письмо отправлено — проверьте почту");
    } catch (err: unknown) {
      toast.error(
        mapAuthErrorMessage(err instanceof Error ? err.message : "Не удалось отправить письмо"),
        { duration: 8000 },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    const pv = passwordSchema.safeParse(password);
    if (!pv.success) { toast.error(pv.error.issues[0].message); return; }
    if (password !== passwordConfirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pv.data });
      if (error) throw error;
      recoveryPending.current = false;
      clearAuthOriginMemory();
      toast.success("Пароль обновлён");
      nav(next, { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authRedirectUrl(next) },
    });
    if (error) {
      toast.error("Не получилось войти через Google");
      setLoading(false);
    }
  };

  const title =
    mode === "signup" ? "Создайте аккаунт"
    : mode === "forgot" ? "Восстановление пароля"
    : mode === "recovery" ? "Новый пароль"
    : "С возвращением";

  const subtitle =
    mode === "signup" ? "Доступ к генератору смысловых прототипов"
    : mode === "forgot"
      ? resetEmailSent
        ? "Мы отправили ссылку на ваш email"
        : "Укажите email — пришлём ссылку для сброса"
    : mode === "recovery"
      ? "Придумайте новый пароль для входа"
    : "Войдите, чтобы продолжить";

  const switchToSignIn = () => {
    setMode("signin");
    setResetEmailSent(false);
    recoveryPending.current = false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FlowPageHeader
        exit={
          next.startsWith("/") && !next.startsWith("/auth")
            ? { to: next, label: "Вернуться" }
            : flowExitHome()
        }
        title="Вход"
        sticky={false}
        className="border-b-0"
      />
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {mode === "forgot" ? (
              resetEmailSent ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Откройте письмо и перейдите по ссылке. Если письма нет — проверьте папку «Спам».
                  </p>
                  <Button type="button" variant="outline" className="w-full h-11" onClick={() => setResetEmailSent(false)}>
                    Отправить ещё раз
                  </Button>
                  <button type="button" onClick={switchToSignIn} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                    Вернуться ко входу
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-forgot">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email-forgot"
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-money text-primary-foreground">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Отправить ссылку
                  </Button>
                  <div className="text-center">
                    <button type="button" onClick={switchToSignIn} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                      Вернуться ко входу
                    </button>
                  </div>
                </form>
              )
            ) : mode === "recovery" ? (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password-new">Новый пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-new"
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      className="pl-9"
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-confirm">Повторите пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password-confirm"
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Ещё раз"
                      className="pl-9"
                      minLength={8}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-money text-primary-foreground">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить пароль
                </Button>
              </form>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleGoogle}
                  className="w-full h-11"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Продолжить через Google
                </Button>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span>{mode === "signup" ? "или email" : "или логин / email"}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleEmail} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Как вас зовут</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" maxLength={100} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{mode === "signup" ? "Email" : "Email или логин"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="text"
                        autoComplete={mode === "signup" ? "email" : "username"}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={mode === "signup" ? "you@company.com" : "you@company.com или логин"}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Пароль</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => { setMode("forgot"); setResetEmailSent(false); }}
                          className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                        >
                          Забыли пароль?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов" className="pl-9" minLength={8} />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-money text-primary-foreground">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "signup" ? "Создать аккаунт" : "Войти"}
                  </Button>
                </form>

                <div className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "signup" ? "Уже есть аккаунт? " : "Нет аккаунта? "}
                  <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {mode === "signup" ? "Войти" : "Создать"}
                  </button>
                </div>

                {mode === "signup" && (
                  <p className="mt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
                    Регистрируясь, вы принимаете{" "}
                    <Link to="/oferta" className="underline hover:text-foreground transition-colors">условия оферты</Link>
                    {" "}и{" "}
                    <Link to="/privacy" className="underline hover:text-foreground transition-colors">политику конфиденциальности</Link>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}