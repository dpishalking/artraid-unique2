import { useMemo, useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminProvisionUserInput, AdminProvisionUserResult } from "@/lib/admin/types.ext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legacyToken?: string;
  onCreated?: (result: AdminProvisionUserResult) => void;
};

const ROLE_OPTIONS = [
  { value: "user", label: "Пользователь" },
  { value: "support", label: "Поддержка" },
  { value: "analyst", label: "Аналитик" },
  { value: "prompt_manager", label: "Промпты" },
  { value: "admin", label: "Админ" },
  { value: "super_admin", label: "Супер-админ" },
] as const;

function randomPassword(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const EMPTY: AdminProvisionUserInput = {
  login: "",
  password: "",
  role: "user",
};

export function AdminProvisionUserDialog({ open, onOpenChange, legacyToken, onCreated }: Props) {
  const [form, setForm] = useState<AdminProvisionUserInput>(EMPTY);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => form.login.trim().length > 0, [form.login]);

  const handleClose = (next: boolean) => {
    if (!loading) {
      if (!next) setForm(EMPTY);
      onOpenChange(next);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const password = form.password?.trim() || randomPassword();
      const result = await adminApi.users.provision(
        {
          login: form.login.trim(),
          password: form.password?.trim() || undefined,
          role: form.role ?? "user",
        },
        legacyToken,
      );
      const creds = `Логин: ${result.login}\nEmail для входа: ${result.email}\nПароль: ${result.password ?? password}`;
      toast.success(`Аккаунт создан (${result.role})`, {
        description: result.email !== result.login ? `Email для входа: ${result.email}` : undefined,
        action: {
          label: "Скопировать",
          onClick: () => {
            void navigator.clipboard.writeText(creds);
            toast.message("Данные для входа скопированы");
          },
        },
        duration: 12000,
      });
      onCreated?.(result);
      setForm(EMPTY);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать аккаунт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать аккаунт</DialogTitle>
          <DialogDescription>
            Только логин и роль — проект и профиль пользователь заполнит сам. Email для входа в Supabase
            создаётся автоматически, если логин не похож на email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="prov-login">Логин</Label>
            <Input
              id="prov-login"
              autoComplete="off"
              autoFocus
              value={form.login}
              onChange={(e) => setForm((prev) => ({ ...prev, login: e.target.value }))}
              placeholder="ivan или client@company.ru"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Роль</Label>
            <Select
              value={form.role ?? "user"}
              onValueChange={(v) => setForm((prev) => ({ ...prev, role: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prov-password">Пароль</Label>
            <div className="flex gap-2">
              <Input
                id="prov-password"
                type="text"
                autoComplete="new-password"
                value={form.password ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Сгенерируется автоматически"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Сгенерировать пароль"
                onClick={() => setForm((prev) => ({ ...prev, password: randomPassword() }))}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Необязательно — если оставить пустым, пароль сгенерируется и покажется после создания.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создаём…
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2 opacity-70" />
                Создать аккаунт
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
