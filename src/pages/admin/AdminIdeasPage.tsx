import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminProductIdea } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "reviewed", label: "Просмотрена" },
  { value: "planned", label: "В плане" },
  { value: "done", label: "Сделано" },
  { value: "dismissed", label: "Отклонена" },
] as const;

export default function AdminIdeasPage() {
  const legacyToken = useAdminLegacyToken();
  const { canMutate } = useAdminAccess();
  const [rows, setRows] = useState<AdminProductIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<AdminProductIdea | null>(null);
  const [editStatus, setEditStatus] = useState("new");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.ideas
      .list({ q: q || undefined, status: statusFilter || undefined, limit: 300 }, legacyToken)
      .then((r) => setRows(r.ideas))
      .finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  const openIdea = (row: AdminProductIdea) => {
    setSelected(row);
    setEditStatus(row.status ?? "new");
    setAdminNote(row.admin_note ?? "");
  };

  const saveIdea = async () => {
    if (!selected || !canMutate) return;
    setSaving(true);
    try {
      await adminApi.ideas.update(
        selected.id,
        { status: editStatus, admin_note: adminNote.trim() || "" },
        legacyToken,
      );
      toast.success("Сохранено");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const contactEmail = (r: AdminProductIdea) => r.email ?? r.profile_email ?? null;

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <Input
          placeholder="Текст, email, страница…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>

      <AdminTableShell
        loading={loading}
        rows={rows}
        empty="Идей пока нет — появятся после отправки с кнопки «Предложить идею»"
        onRowClick={openIdea}
        columns={[
          { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
          {
            key: "email",
            header: "Контакт",
            render: (r) => contactEmail(r) ?? (r.user_id ? r.user_id.slice(0, 8) : "—"),
          },
          {
            key: "msg",
            header: "Идея",
            render: (r) => (
              <span className="line-clamp-2 max-w-md text-sm" title={r.message}>
                {r.message}
              </span>
            ),
          },
          {
            key: "page",
            header: "Страница",
            render: (r) => (
              <span className="text-xs text-muted-foreground max-w-[120px] truncate block">
                {r.page_path ?? "—"}
              </span>
            ),
          },
          { key: "status", header: "Статус", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Идея от пользователя</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  {new Date(selected.created_at).toLocaleString("ru-RU")}
                  {selected.source ? ` · ${selected.source}` : ""}
                  {selected.ip ? ` · IP ${selected.ip}` : ""}
                </p>

                <div className="rounded-lg border border-border bg-muted/30 p-4 whitespace-pre-wrap">
                  {selected.message}
                </div>

                <div className="grid gap-2 text-muted-foreground">
                  {contactEmail(selected) && <p>Email: {contactEmail(selected)}</p>}
                  {selected.page_path && <p>Страница: {selected.page_path}</p>}
                  {selected.user_id && (
                    <p>
                      Пользователь:{" "}
                      <Link to={`/admin/users/${selected.user_id}`} className="text-primary hover:underline">
                        {selected.profile_name ?? selected.profile_email ?? selected.user_id}
                      </Link>
                    </p>
                  )}
                </div>

                {canMutate && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="idea-status">Статус</Label>
                      <select
                        id="idea-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        disabled={saving}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idea-note">Заметка (только для админов)</Label>
                      <Textarea
                        id="idea-note"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={3}
                        placeholder="Почему в плане / что ответить пользователю…"
                        disabled={saving}
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelected(null)} disabled={saving}>
                  Закрыть
                </Button>
                {canMutate && (
                  <Button onClick={saveIdea} disabled={saving}>
                    Сохранить
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
