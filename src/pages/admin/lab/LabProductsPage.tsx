import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { forgeApi } from "@/lib/forge/api";
import type { ForgeProduct } from "@/lib/forge/types";

export default function LabProductsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<ForgeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    forgeApi.products
      .list()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Закрытый раздел
          </div>
          <h1 className="text-2xl font-semibold mt-1">Лаборатория</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Конвейер прототипов под трафик: база знаний продукта → выбор шаблона →
            генерация → публикация на pishalking.ru/lp/….
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" asChild>
            <Link to="/admin/lab/prompts">
              <Sparkles className="h-4 w-4 mr-1" />
              Промпты генерации
            </Link>
          </Button>
          <Button onClick={() => nav("/admin/lab/new")}>
            <Plus className="h-4 w-4 mr-1" /> Новый продукт
          </Button>
        </div>
      </div>

      <AdminTableShell
        loading={loading}
        rows={rows}
        empty="Пока нет продуктов. Создайте первый, чтобы заполнить базу знаний и начать генерить прототипы."
        columns={[
          {
            key: "name",
            header: "Название",
            render: (r) => (
              <Link
                to={`/admin/lab/products/${r.id}`}
                className="font-medium hover:underline"
              >
                {r.name}
              </Link>
            ),
          },
          { key: "slug", header: "Slug", render: (r) => <code className="text-xs">{r.slug}</code> },
          {
            key: "status",
            header: "Статус",
            render: (r) =>
              r.status === "active" ? (
                <Badge variant="secondary">active</Badge>
              ) : (
                <Badge variant="outline">archived</Badge>
              ),
          },
          {
            key: "created",
            header: "Создан",
            render: (r) => new Date(r.created_at).toLocaleDateString("ru-RU"),
          },
          {
            key: "prompts",
            header: "Промпты",
            render: (r) => (
              <Link
                to={`/admin/lab/products/${r.id}?tab=prompts`}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                Настроить
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
