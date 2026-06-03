import { Link } from "react-router-dom";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ForgePrototype } from "@/lib/forge/types";

type Props = {
  productId: string;
  prototypes: ForgePrototype[];
  onCreate: () => void;
};

const TEMPLATE_LABEL: Record<string, string> = {
  full: "Полный лендинг",
  "clip-4": "Клип-4 экрана",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "draft",
  published: "published",
  archived: "archived",
};

export function LabPrototypesPanel({ prototypes, onCreate }: Props) {
  if (!prototypes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <h3 className="font-semibold">Прототипов ещё нет</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите шаблон (full / clip-4) и сгенерируйте первый прототип на базе KB.
        </p>
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-1" /> Создать прототип
        </Button>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {prototypes.map((p) => (
        <li key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
          <div>
            <Link to={`/admin/lab/prototypes/${p.id}`} className="font-medium hover:underline">
              {p.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
              <Badge variant="outline">{TEMPLATE_LABEL[p.template_id] ?? p.template_id}</Badge>
              <Badge variant={p.status === "published" ? "default" : "secondary"}>
                {STATUS_LABEL[p.status]}
              </Badge>
              {p.slug && p.status === "published" && (
                <a
                  href={`/lp/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-foreground"
                >
                  /lp/{p.slug} <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
