import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminLog } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";

export default function AdminLogsPage() {
  const legacyToken = useAdminLegacyToken();
  const { canMutate } = useAdminAccess();
  const [rows, setRows] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.logs.list(legacyToken).then((r) => setRows(r.logs)).finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  return (
    <AdminTableShell
      loading={loading}
      rows={rows}
      empty="Логов пока нет — они появятся при ошибках генераций и аудитов"
      columns={[
        { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
        { key: "type", header: "Тип", render: (r) => r.type },
        { key: "svc", header: "Сервис", render: (r) => r.service ?? "—" },
        { key: "msg", header: "Сообщение", render: (r) => r.message.slice(0, 100) },
        { key: "sev", header: "Severity", render: (r) => <StatusBadge status={r.severity} /> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        {
          key: "act",
          header: "",
          render: (r) =>
            canMutate && r.status === "new" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await adminApi.logs.update(r.id, { status: "resolved" }, legacyToken);
                  toast.success("Отмечено resolved");
                  load();
                }}
              >
                Resolved
              </Button>
            ) : null,
        },
      ]}
    />
  );
}
