import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/api.v2";
import type { AdminPrompt } from "@/lib/admin/types.ext";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { useAdminLegacyToken } from "@/components/admin/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminPromptsPage() {
  const legacyToken = useAdminLegacyToken();
  const [rows, setRows] = useState<AdminPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.prompts.list(legacyToken).then((r) => setRows(r.prompts)).finally(() => setLoading(false));
  };

  useEffect(load, [legacyToken]);

  return (
    <AdminTableShell
      loading={loading}
      rows={rows}
      columns={[
        { key: "name", header: "Название", render: (r) => r.name },
        { key: "type", header: "Тип", render: (r) => r.type },
        { key: "ver", header: "v", render: (r) => r.version },
        {
          key: "active",
          header: "Активен",
          render: (r) => (r.is_active ? <Badge>active</Badge> : "—"),
        },
        { key: "uses", header: "Uses", render: (r) => r.uses_count },
        {
          key: "act",
          header: "",
          render: (r) =>
            !r.is_active ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await adminApi.prompts.setActive(r.id, legacyToken);
                  toast.success("Версия активирована");
                  load();
                }}
              >
                Активировать
              </Button>
            ) : null,
        },
      ]}
    />
  );
}
