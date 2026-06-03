import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminAudit } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAuditsPage() {
  const legacyToken = useAdminLegacyToken();
  const [rows, setRows] = useState<AdminAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.audits
      .list({ q: q || undefined, status: status || undefined, limit: 300 }, legacyToken)
      .then((r) => setRows(r.audits))
      .finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

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
          placeholder="URL, IP или ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Все статусы</option>
          <option value="success">success</option>
          <option value="ai_error">ai_error</option>
          <option value="error">error</option>
        </select>
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>

      <AdminTableShell
        loading={loading}
        rows={rows}
        empty="Аудитов пока нет"
        columns={[
          { key: "date", header: "Дата", render: (r) => new Date(r.created_at).toLocaleString("ru-RU") },
          {
            key: "url",
            header: "Сайт",
            render: (r) => (
              <span className="max-w-[240px] truncate block" title={r.url}>
                {r.url}
              </span>
            ),
          },
          { key: "ip", header: "IP", render: (r) => r.ip ?? "—" },
          { key: "status", header: "Статус", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "open",
            header: "",
            render: (r) =>
              r.status === "success" ? (
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/r/${r.id}`} target="_blank" rel="noreferrer">
                    Отчёт
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={r.error ?? ""}>
                  {r.error?.slice(0, 40) ?? "—"}
                </span>
              ),
          },
        ]}
      />
    </div>
  );
}
