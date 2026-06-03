import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminProvisionUserResult, AdminUserRow } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminProvisionUserDialog } from "@/components/admin/AdminProvisionUserDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminUsersPage() {
  const legacyToken = useAdminLegacyToken();
  const nav = useNavigate();
  const { canMutate } = useAdminAccess();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [provisionOpen, setProvisionOpen] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.users
      .list({ q }, legacyToken)
      .then((r) => setRows(r.users))
      .finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken, q]);

  const handleCreated = (result: AdminProvisionUserResult) => {
    load();
    nav(`/admin/users/${result.user_id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Пользователи</h1>
          <p className="text-sm text-muted-foreground">Аккаунты, кредиты и активность</p>
        </div>
        {canMutate && (
          <Button onClick={() => setProvisionOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Создать аккаунт
          </Button>
        )}
      </div>

      <AdminTableShell
        search={q}
        onSearchChange={setQ}
        searchPlaceholder="Email или имя…"
        loading={loading}
        rows={rows}
        onRowClick={(r) => nav(`/admin/users/${r.user_id}`)}
        columns={[
          { key: "email", header: "Email", render: (r) => r.email ?? "—" },
          { key: "name", header: "Имя", render: (r) => r.name ?? "—" },
          { key: "role", header: "Роль", render: (r) => r.role },
          { key: "status", header: "Статус", render: (r) => <StatusBadge status={r.status} /> },
          { key: "credits", header: "Кредиты", render: (r) => r.credits_balance },
          { key: "gens", header: "Генерации", render: (r) => r.total_generations },
          {
            key: "created",
            header: "Регистрация",
            render: (r) => new Date(r.created_at).toLocaleDateString("ru-RU"),
          },
        ]}
      />

      <AdminProvisionUserDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        legacyToken={legacyToken}
        onCreated={handleCreated}
      />
    </div>
  );
}
