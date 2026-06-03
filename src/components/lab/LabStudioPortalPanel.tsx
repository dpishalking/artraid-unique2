import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { forgeApi } from "@/lib/forge/api";
import { FORGE_STUDIO_HOST, FORGE_STUDIO_ORIGIN } from "@/constants/site";
import type { ForgeStudioPortal } from "@/lib/forge/types";

type Props = {
  productId: string;
  productName: string;
};

export function LabStudioPortalPanel({ productId, productName }: Props) {
  const [portals, setPortals] = useState<ForgeStudioPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(`${productName} Studio`);

  async function load() {
    setLoading(true);
    try {
      const list = await forgeApi.studioPortals.list(productId);
      setPortals(list);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки порталов");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function createPortal() {
    if (!title.trim()) return toast.error("Укажите название портала");
    setCreating(true);
    try {
      await forgeApi.studioPortals.create({
        product_id: productId,
        title: title.trim(),
        subtitle: "Соберите лендинг и экспортируйте в дизайн — без доступа к базе знаний",
      });
      toast.success("Ссылка создана");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать");
    } finally {
      setCreating(false);
    }
  }

  function portalUrl(token: string) {
    return `${FORGE_STUDIO_ORIGIN}/${token}`;
  }

  async function copyUrl(token: string) {
    try {
      await navigator.clipboard.writeText(portalUrl(token));
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Forge Studio — публичная ссылка
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Клиент или маркетолог открывает ссылку на{" "}
          <code className="text-xs bg-muted px-1 rounded">{FORGE_STUDIO_HOST}</code>,
          выбирает формат и блоки, генерирует лендинг и копирует промпт для Lovable. KB и промпты
          остаются на сервере.
        </p>
        <p className="text-xs text-amber-600/90 mt-2">
          DNS: настройте CNAME <code className="bg-muted px-1 rounded">{FORGE_STUDIO_HOST}</code> на тот же
          хостинг, что и основной сайт.
        </p>
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-3 max-w-xl">
        <Label htmlFor="portal-title">Название портала</Label>
        <Input
          id="portal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Artrade — генератор лендингов"
        />
        <Button onClick={createPortal} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Создать ссылку
        </Button>
      </div>

      {portals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Порталов пока нет — создайте первую ссылку для клиента.</p>
      ) : (
        <ul className="space-y-3">
          {portals.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-border p-4 flex flex-wrap items-start justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="font-medium">{p.title}</div>
                <code className="text-xs text-muted-foreground break-all">{portalUrl(p.token)}</code>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant={p.is_active ? "secondary" : "outline"}>
                    {p.is_active ? "активен" : "выключен"}
                  </Badge>
                  <Badge variant="outline">{p.max_generations_per_day}/день</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyUrl(p.token)}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Копировать
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
