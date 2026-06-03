import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgeApi } from "@/lib/forge/api";
import {
  FORGE_DIRECTION_PRESETS,
  slugifyDirection,
  upsertDirection,
} from "@/lib/forge/directions";
import type { ForgeDirection, ForgeKnowledgeBase } from "@/lib/forge/types";

type Props = {
  productId: string;
  kb: ForgeKnowledgeBase;
  onSaved: (kb: ForgeKnowledgeBase) => void;
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
};

export function LabDirectionsPanel({
  productId,
  kb,
  onSaved,
  selectedSlug,
  onSelectSlug,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const directions = kb.directions ?? [];

  const customSlugPreview = useMemo(
    () => slugifyDirection(customTitle) || "…",
    [customTitle],
  );

  async function saveDirections(next: ForgeDirection[]) {
    setSaving(true);
    try {
      const updated = await forgeApi.kb.upsert(productId, { directions: next });
      onSaved(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  async function addDirection(slug: string, title: string, description?: string) {
    const normalized = slugifyDirection(slug || title);
    if (!normalized) {
      toast.error("Укажите название направления");
      return;
    }
    if (directions.some((d) => d.slug === normalized)) {
      onSelectSlug(normalized);
      toast.message(`«${title}» уже есть — выбрано для загрузки`);
      return;
    }
    const next = upsertDirection(directions, { slug: normalized, title: title.trim(), description });
    await saveDirections(next);
    onSelectSlug(normalized);
    toast.success(`Направление «${title.trim()}» добавлено`);
  }

  async function removeDirection(slug: string) {
    const next = directions.filter((d) => d.slug !== slug);
    await saveDirections(next);
    if (selectedSlug === slug) onSelectSlug(null);
    toast.success("Направление удалено (материалы с меткой останутся в базе)");
  }

  const unusedPresets = FORGE_DIRECTION_PRESETS.filter((p) => !directions.some((d) => d.slug === p.slug));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Направления лендинга</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          У каждого продукта свои темы — не обязательно «отёки» и «варикоз». Создайте свои
          направления (аудитория, оффер, сегмент) и загружайте материалы в нужный слой.
        </p>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            size="sm"
            variant={selectedSlug === null ? "default" : "outline"}
            onClick={() => onSelectSlug(null)}
          >
            Общее
          </Button>
          {directions.map((d) => (
            <div key={d.id} className="inline-flex items-center gap-0.5">
              <Button
                type="button"
                size="sm"
                variant={selectedSlug === d.slug ? "default" : "outline"}
                onClick={() => onSelectSlug(d.slug)}
              >
                {d.title}
                {(d.kb?.pains?.length ?? 0) > 0 ? (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">
                    {d.kb.pains.length}
                  </Badge>
                ) : null}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                disabled={saving}
                onClick={() => void removeDirection(d.slug)}
                title="Удалить направление"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
          <p className="text-xs font-medium">Своё направление</p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Название</Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Педагогика, B2B, премиум, регион Москва…"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Кратко — о чём этот лендинг</Label>
            <Input
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Необязательно"
              disabled={saving}
            />
          </div>
          {customTitle.trim() ? (
            <p className="text-[11px] text-muted-foreground">
              id: <code>{customSlugPreview}</code>
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={saving || !customTitle.trim()}
            onClick={() => {
              void addDirection(customSlugPreview, customTitle, customDescription.trim() || undefined);
              setCustomTitle("");
              setCustomDescription("");
            }}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Добавить направление
          </Button>
        </div>

        {unusedPresets.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Быстрые шаблоны (health / сосуды — только если подходит продукту)
            </p>
            <div className="flex flex-wrap gap-2">
              {unusedPresets.map((p) => (
                <Button
                  key={p.slug}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="border border-border"
                  disabled={saving}
                  onClick={() => void addDirection(p.slug, p.title, p.description)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {p.title}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
