import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CreditsDialog } from "@/components/admin/CreditsDialog";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const legacyToken = useAdminLegacyToken();
  const { canMutate } = useAdminAccess();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [creditMode, setCreditMode] = useState<"add" | "remove" | null>(null);
  const [note, setNote] = useState("");

  const load = () => {
    if (!id) return;
    adminApi.users.get(id, legacyToken).then(setData);
  };

  useEffect(load, [id, legacyToken]);

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const profile = data.profile as Record<string, unknown>;
  const credits = data.credits as Record<string, unknown> | null;
  const payments = (data.payments as Record<string, unknown>[]) ?? [];
  const prototypes = (data.prototypes as Record<string, unknown>[]) ?? [];
  const projects = (data.projects as Record<string, unknown>[]) ?? [];
  const transactions = (data.transactions as Record<string, unknown>[]) ?? [];
  const notes = (data.notes as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/users" className="hover:text-foreground">← Users</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{String(profile.email ?? id)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Имя: {String(profile.display_name ?? "—")}</p>
          <p>Роль: {String(profile.role ?? "user")} · <StatusBadge status={String(profile.status ?? "active")} /></p>
          <p>Компания: {String(profile.company_name ?? "—")}</p>
          <p>Регистрация: {new Date(String(profile.created_at)).toLocaleString("ru-RU")}</p>
          {canMutate && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setCreditMode("add")}>+ Кредиты</Button>
              <Button size="sm" variant="outline" onClick={() => setCreditMode("remove")}>− Кредиты</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await adminApi.users.update(id!, {
                    status: profile.status === "blocked" ? "active" : "blocked",
                  }, legacyToken);
                  toast.success("Статус обновлён");
                  load();
                }}
              >
                {profile.status === "blocked" ? "Разблокировать" : "Заблокировать"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Кредиты</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Баланс: <strong>{Number(credits?.balance ?? 0)}</strong></p>
          <p>Куплено: {Number(credits?.total_purchased ?? 0)} · Потрачено: {Number(credits?.total_used ?? 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Проекты ({projects.length})</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {projects.length === 0 && <p className="text-muted-foreground">Нет активных проектов</p>}
          {projects.map((p) => (
            <Link
              key={String(p.id)}
              to={`/projects/${String(p.id)}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="font-medium truncate">{String(p.name)}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {p.packaging_score != null ? `${p.packaging_score}/100` : "—"}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Оплаты ({payments.length})</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {payments.slice(0, 10).map((p) => (
            <div key={String(p.id)} className="flex justify-between">
              <span>{String(p.package_id)}</span>
              <StatusBadge status={String(p.status)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Прототипы ({prototypes.length})</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {prototypes.slice(0, 10).map((p) => (
            <Link key={String(p.id)} to={`/p/${p.id}`} className="block hover:text-primary">
              {String(p.id).slice(0, 8)}… · <StatusBadge status={String(p.status)} />
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Заметки</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notes.map((n) => (
            <p key={String(n.id)} className="text-sm border-l-2 pl-3">{String(n.note)}</p>
          ))}
          {canMutate && (
            <>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Внутренняя заметка…" rows={2} />
              <Button
                size="sm"
                disabled={!note.trim()}
                onClick={async () => {
                  await adminApi.notes.create(id!, note, legacyToken);
                  setNote("");
                  toast.success("Заметка сохранена");
                  load();
                }}
              >
                Добавить заметку
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <CreditsDialog
        open={creditMode !== null}
        onOpenChange={(o) => !o && setCreditMode(null)}
        mode={creditMode ?? "add"}
        onSubmit={async (amount, description) => {
          await adminApi.credits.adjust(id!, amount, description, legacyToken);
          toast.success("Кредиты обновлены");
          load();
        }}
      />
    </div>
  );
}
