import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminGeneration } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminGenerationsPage() {
  const legacyToken = useAdminLegacyToken();
  const { canMutate } = useAdminAccess();
  const [rows, setRows] = useState<AdminGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.generations.list(legacyToken).then((r) => setRows(r.generations)).finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  return (
    <AdminTableShell
      loading={loading}
      rows={rows}
      columns={[
        { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
        { key: "user", header: "User", render: (r) => r.user_id.slice(0, 8) },
        { key: "type", header: "Тип", render: (r) => r.type },
        { key: "status", header: "Статус", render: (r) => <StatusBadge status={r.status} /> },
        { key: "credits", header: "Кредиты", render: (r) => r.credits_spent },
        {
          key: "open",
          header: "",
          render: (r) => (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/p/${r.id}`} onClick={(e) => e.stopPropagation()}>Открыть</Link>
              </Button>
              {canMutate && r.status === "failed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await adminApi.generations.refundCredit(r.user_id, "Возврат из админки", legacyToken);
                    toast.success("Кредит возвращён");
                  }}
                >
                  Refund
                </Button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
