import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ExternalLink, Globe, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { forgeApi } from "@/lib/forge/api";
import { slugify, isValidSlug } from "@/lib/forge/slug";
import type {
  ForgePrototype,
  ForgePrototypeContent,
  ForgePrototypeVersion,
} from "@/lib/forge/types";
import { SITE_ORIGIN } from "@/constants/site";
import { LabLovableExportButton } from "@/components/lab/LabLovableExportButton";
import { LabPrototypePreview } from "@/components/lab/LabPrototypePreview";
import { ForgeLabChatMobileEntry, ForgeLabChatPanel } from "@/components/lab/ForgeLabChatPanel";
import { useForgeLabChat } from "@/hooks/useForgeLabChat";
import type { ClipStepBlocksConfig } from "@/lib/forge/clipLandingBlocks";
import type { ForgeProduct } from "@/lib/forge/types";

export default function LabPrototypePage() {
  const { id } = useParams<{ id: string }>();
  const [proto, setProto] = useState<ForgePrototype | null>(null);
  const [version, setVersion] = useState<ForgePrototypeVersion | null>(null);
  const [versions, setVersions] = useState<ForgePrototypeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [product, setProduct] = useState<ForgeProduct | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenFresh, setRegenFresh] = useState(true);
  const [regenNote, setRegenNote] = useState("");

  async function load() {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await forgeApi.prototypes.get(id);
      setProto(p);
      setSlugInput(p?.slug ?? slugify(p?.name ?? ""));
      if (p?.product_id) {
        forgeApi.products.get(p.product_id).then(setProduct).catch(() => setProduct(null));
      }
      const v = await forgeApi.prototypes.getActiveVersion(id);
      setVersion(v);
      const all = await forgeApi.prototypes.listVersions(id);
      setVersions(all);
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const content = useMemo(
    () => (version?.content ?? null) as ForgePrototypeContent | null,
    [version],
  );

  const chat = useForgeLabChat({
    productId: proto?.product_id ?? "",
    prototypeId: proto?.id ?? id ?? "",
    enabled: Boolean(proto?.id && proto?.product_id),
  });

  async function regenerate(opts?: { fresh?: boolean; note?: string }) {
    if (!proto) return;
    setWorking(true);
    setRegenOpen(false);
    try {
      const prevInput = (version?.generation_input ?? {}) as Record<string, unknown>;
      const prevFormat = typeof prevInput.format === "string" ? prevInput.format : "kitchen";
      const prevBlocks = Array.isArray(prevInput.included_blocks)
        ? (prevInput.included_blocks as string[])
        : undefined;
      const prevClipBlocks =
        prevInput.clip_step_blocks &&
        typeof prevInput.clip_step_blocks === "object" &&
        !Array.isArray(prevInput.clip_step_blocks)
          ? (prevInput.clip_step_blocks as ClipStepBlocksConfig)
          : undefined;
      const fresh = opts?.fresh ?? regenFresh;
      const note = (opts?.note ?? regenNote).trim() || undefined;

      const result = await forgeApi.generate({
        product_id: proto.product_id,
        template_id: proto.template_id,
        scenario_id: proto.scenario_id ?? undefined,
        direction_slug: proto.direction_slug ?? undefined,
        format: proto.template_id === "full" ? prevFormat : undefined,
        included_blocks: proto.template_id === "full" ? prevBlocks : undefined,
        clip_step_blocks: proto.template_id === "clip-4" ? prevClipBlocks : undefined,
        name: proto.name,
        prototype_id: proto.id,
        regenerate_fresh: fresh,
        variation_note: note,
        notes: fresh ? "regenerate_fresh" : "regenerate",
      });

      const [nextVersion, updatedProto, allVersions] = await Promise.all([
        forgeApi.prototypes.getVersion(result.version_id),
        forgeApi.prototypes.get(proto.id),
        forgeApi.prototypes.listVersions(proto.id),
      ]);

      if (updatedProto) setProto(updatedProto);
      if (nextVersion) setVersion(nextVersion);
      setVersions(allVersions);

      toast.success(`Версия #${result.version} готова${fresh ? " (новая идея)" : ""}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось перегенерировать");
    } finally {
      setWorking(false);
    }
  }

  async function publish() {
    if (!proto) return;
    const s = slugInput.trim().toLowerCase();
    if (!isValidSlug(s)) return toast.error("Slug: a-z, 0-9, дефис");
    setWorking(true);
    try {
      await forgeApi.prototypes.publish(proto.id, s);
      toast.success("Опубликовано");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка публикации");
    } finally {
      setWorking(false);
    }
  }

  async function unpublish() {
    if (!proto) return;
    setWorking(true);
    try {
      await forgeApi.prototypes.unpublish(proto.id);
      toast.success("Снят с публикации");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка");
    } finally {
      setWorking(false);
    }
  }

  async function activateVersion(vid: string) {
    if (!proto) return;
    await forgeApi.prototypes.setActiveVersion(proto.id, vid);
    toast.success("Версия активирована");
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!proto) {
    return <p className="text-sm text-muted-foreground">Прототип не найден.</p>;
  }

  const publicUrl = proto.slug ? `${SITE_ORIGIN}/lp/${proto.slug}` : null;
  const generationInput = (version?.generation_input ?? {}) as Record<string, unknown>;
  const exportFormat =
    typeof generationInput.format === "string" ? generationInput.format : undefined;

  const chatPanelProps = {
    chat,
    productName: product?.name ?? proto.name,
    prototypeName: proto.name,
    directionLabel: proto.direction_slug,
    versionNumber: version?.version,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/admin/lab/products/${proto.product_id}?tab=prototypes`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> К прототипам продукта
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{proto.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline">{proto.template_id}</Badge>
              {proto.scenario_id && <Badge variant="outline">{proto.scenario_id}</Badge>}
              <Badge variant={proto.status === "published" ? "default" : "secondary"}>
                {proto.status}
              </Badge>
              {version && <span>версия #{version.version}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <LabLovableExportButton
              templateId={proto.template_id}
              content={content}
              disabled={working}
              exportOptions={{
                productName: proto.name,
                tone:
                  exportFormat === "kitchen"
                    ? "разговор на кухне"
                    : exportFormat ?? content?.meta?.tone_of_voice,
                niche: proto.direction_slug ?? undefined,
                directionLabel: proto.direction_slug ?? undefined,
                domain: publicUrl ?? `${SITE_ORIGIN}/lp/${slugInput || "slug"}`,
              }}
            />
            <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={working}>
                  {working ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Перегенерировать
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Перегенерировать прототип</AlertDialogTitle>
                  <AlertDialogDescription>
                    Будет создана новая версия и сразу станет активной. Превью обновится после генерации
                    (обычно 30–90 сек).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={regenFresh}
                      onCheckedChange={(v) => setRegenFresh(v === true)}
                    />
                    <span className="text-sm leading-snug">
                      <strong>Новая идея</strong> — другой угол, другие формулировки, не копировать прошлую
                      версию (рекомендуется).
                    </span>
                  </label>
                  <div className="space-y-1.5">
                    <Label htmlFor="regen-note" className="text-xs text-muted-foreground">
                      Акцент этой генерации (необязательно)
                    </Label>
                    <Textarea
                      id="regen-note"
                      rows={2}
                      placeholder="Например: угол «утро с отёками», без NASA, акцент на микросферы…"
                      value={regenNote}
                      onChange={(e) => setRegenNote(e.target.value)}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={working}
                    onClick={(e) => {
                      e.preventDefault();
                      void regenerate();
                    }}
                  >
                    {working ? "Генерация…" : "Запустить"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground max-w-2xl">
          «Скопировать для Lovable» — полный промпт на дизайн + все тексты прототипа. Вставьте в{" "}
          <strong>новый проект Lovable</strong>, опубликуйте на домен для Директа.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Публикация</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 flex-1 min-w-[260px]">
            <Label className="text-xs">Slug</Label>
            <Input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="otek-dev"
            />
            <p className="text-xs text-muted-foreground">
              URL: <code>{SITE_ORIGIN}/lp/{slugInput || "…"}</code>
            </p>
          </div>
          {proto.status === "published" ? (
            <>
              {publicUrl && (
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1" /> Открыть
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={unpublish} disabled={working}>
                Снять с публикации
              </Button>
            </>
          ) : (
            <Button onClick={publish} disabled={working || !version}>
              Опубликовать
            </Button>
          )}
        </div>
      </div>

      {!content ? (
        <p className="text-sm text-muted-foreground mb-4">Контент ещё не сгенерирован — чат всё равно знает базу знаний продукта.</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] xl:items-start">
        <div className="min-w-0">
          {content ? (
            <LabPrototypePreview
              templateId={proto.template_id}
              content={content}
              prototypeId={proto.id}
              contentVersionKey={version?.id ?? String(version?.version ?? 0)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Нажмите «Перегенерировать», чтобы создать контент.
            </div>
          )}
        </div>
        <div className="hidden xl:block xl:sticky xl:top-[4.5rem]">
          <ForgeLabChatPanel {...chatPanelProps} className="xl:max-h-[calc(100vh-5.5rem)]" />
        </div>
      </div>

      <ForgeLabChatMobileEntry {...chatPanelProps} />

      {versions.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-3">
          <h3 className="font-semibold">История версий</h3>
          <ul className="space-y-1.5">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between text-sm">
                <span>
                  #{v.version} · {new Date(v.created_at).toLocaleString("ru-RU")}
                  {proto.active_version_id === v.id && <Badge className="ml-2" variant="secondary">active</Badge>}
                </span>
                {proto.active_version_id !== v.id && (
                  <Button size="sm" variant="ghost" onClick={() => activateVersion(v.id)}>
                    Сделать активной
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
