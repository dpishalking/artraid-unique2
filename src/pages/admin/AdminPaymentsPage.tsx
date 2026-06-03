import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminPayment } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminPaymentsPage() {
  const legacyToken = useAdminLegacyToken();
  const { canMutate } = useAdminAccess();
  const [rows, setRows] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.payments.list(legacyToken).then((r) => setRows(r.payments)).finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  return (
    <div className="space-y-4">
      <AdminTableShell
        loading={loading}
        rows={rows}
        empty="Нет оплат. Создайте вручную через API или дождитесь webhook."
        columns={[
          { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
          { key: "user", header: "User", render: (r) => r.user_id.slice(0, 8) },
          { key: "pkg", header: "Пакет", render: (r) => r.package_id },
          { key: "amount", header: "Сумма", render: (r) => `${r.amount} ${r.currency}` },
          { key: "status", header: "Статус", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "actions",
            header: "",
            render: (r) =>
              canMutate && r.status === "pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await adminApi.payments.markPaid(r.id, legacyToken);
                    toast.success("Оплата подтверждена, кредиты начислены");
                    load();
                  }}
                >
                  Paid
                </Button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
