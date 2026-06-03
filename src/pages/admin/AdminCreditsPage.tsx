import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminCreditTx } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";

export default function AdminCreditsPage() {
  const legacyToken = useAdminLegacyToken();
  const [rows, setRows] = useState<AdminCreditTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.credits.list(legacyToken).then((r) => setRows(r.transactions)).finally(() => setLoading(false));
  }, [legacyToken]);

  return (
    <AdminTableShell
      loading={loading}
      rows={rows}
      columns={[
        { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
        { key: "user", header: "User", render: (r) => r.user_id.slice(0, 8) },
        { key: "amount", header: "Сумма", render: (r) => (r.amount > 0 ? `+${r.amount}` : r.amount) },
        { key: "type", header: "Тип", render: (r) => r.type },
        { key: "desc", header: "Описание", render: (r) => r.description ?? "—" },
        { key: "bal", header: "Баланс после", render: (r) => r.balance_after ?? "—" },
      ]}
    />
  );
}
