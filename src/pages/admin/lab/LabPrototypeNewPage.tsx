import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forgeApi } from "@/lib/forge/api";
import type { ForgeProduct, ForgeTemplate, ForgeKnowledgeBase } from "@/lib/forge/types";
import { directionScopeLabel } from "@/lib/forge/directions";
import { landingScenarios } from "@/config/landingScenarios";
import { LabFullBlockConstructor } from "@/components/lab/LabFullBlockConstructor";
import { LabClipBlockConstructor } from "@/components/lab/LabClipBlockConstructor";
import {
  FULL_LANDING_BLOCK_PRESETS,
  presetBlocksForScenario,
  type FullLandingBlockPresetId,
  type FullLandingMiddleBlockKey,
} from "@/lib/forge/fullLandingBlocks";
import {
  CLIP_BLOCK_PRESETS,
  CLIP_STEP_DEFAULT_BLOCKS,
  presetClipBlocksForScenario,
  validateClipStepBlocks,
  type ClipBlockPresetId,
  type ClipStepBlocksConfig,
} from "@/lib/forge/clipLandingBlocks";

export default function LabPrototypeNewPage() {
  const { id: productId } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [product, setProduct] = useState<ForgeProduct | null>(null);
  const [kb, setKb] = useState<ForgeKnowledgeBase | null>(null);
  const [templates, setTemplates] = useState<ForgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [templateId, setTemplateId] = useState<string>("full");
  const [scenarioId, setScenarioId] = useState<string>("cold_traffic");
  const [directionSlug, setDirectionSlug] = useState<string>("");
  const [format, setFormat] = useState<string>("kitchen");
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [includedBlocks, setIncludedBlocks] = useState<FullLandingMiddleBlockKey[]>(() =>
    presetBlocksForScenario("cold_traffic", "kitchen"),
  );
  const [blockPresetId, setBlockPresetId] = useState<FullLandingBlockPresetId | "custom">("standard");
  const [clipStepBlocks, setClipStepBlocks] = useState<ClipStepBlocksConfig>(() => ({
    ...CLIP_STEP_DEFAULT_BLOCKS,
  }));
  const [clipBlockPresetId, setClipBlockPresetId] = useState<ClipBlockPresetId | "custom">("standard");

  useEffect(() => {
    if (!productId) return;
    Promise.all([
      forgeApi.products.get(productId),
      forgeApi.kb.get(productId),
      forgeApi.templates.list(),
    ])
      .then(([p, k, t]) => {
        setProduct(p);
        setKb(k ? { ...k, directions: k.directions ?? [] } : k);
        setTemplates(t);
        if (t.length && !t.find((x) => x.id === "full")) setTemplateId(t[0].id);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (blockPresetId === "custom") return;
    if (blockPresetId === "standard") {
      setIncludedBlocks(presetBlocksForScenario(scenarioId, format));
      return;
    }
    const preset = FULL_LANDING_BLOCK_PRESETS.find((p) => p.id === blockPresetId);
    if (preset) setIncludedBlocks(preset.blocks);
  }, [scenarioId, format, blockPresetId]);

  useEffect(() => {
    if (clipBlockPresetId === "custom") return;
    if (clipBlockPresetId === "standard") {
      setClipStepBlocks(presetClipBlocksForScenario(scenarioId));
      return;
    }
    const preset = CLIP_BLOCK_PRESETS.find((p) => p.id === clipBlockPresetId);
    if (preset) setClipStepBlocks(preset.blocks);
  }, [scenarioId, clipBlockPresetId]);

  async function generate() {
    if (!productId) return;
    if (!templateId) return toast.error("Выберите шаблон");
    if (!name.trim()) return toast.error("Назовите прототип");
    if (templateId === "full" && includedBlocks.length < 2) {
      return toast.error("Выберите хотя бы 2 блока в конструкторе");
    }
    if (templateId === "clip-4") {
      const clipErr = validateClipStepBlocks(clipStepBlocks);
      if (clipErr) return toast.error(clipErr);
    }
    setGenerating(true);
    try {
      const r = await forgeApi.generate({
        product_id: productId,
        template_id: templateId,
        scenario_id: scenarioId,
        direction_slug: directionSlug || undefined,
        format: templateId === "full" ? format : undefined,
        included_blocks: templateId === "full" ? includedBlocks : undefined,
        clip_step_blocks: templateId === "clip-4" ? clipStepBlocks : undefined,
        name: name.trim(),
      });
      toast.success("Прототип сгенерирован");
      nav(`/admin/lab/prototypes/${r.prototype_id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stepTone = templateId === "full" ? 4 : null;
  const stepName = templateId === "full" ? 6 : templateId === "clip-4" ? 5 : 4;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to={`/admin/lab/products/${productId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {product?.name ?? "Назад"}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Новый прототип</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Шаблон определяет формат страницы. Сценарий — логику копирайтинга под трафик.
        </p>
      </div>

      <section className="space-y-3">
        <Label className="text-sm font-medium">1. Шаблон страницы</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map((t) => {
            const active = templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t.title}</span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                )}
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-2">
                  {t.format === "funnel" ? "Воронка" : "Лонг-форма"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-medium">2. Направление лендинга</Label>
        <select
          value={directionSlug}
          onChange={(e) => setDirectionSlug(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Общее (вся база продукта)</option>
          {(kb?.directions ?? []).map((d) => (
            <option key={d.id} value={d.slug}>
              {d.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {directionSlug
            ? `Прототип: общий продукт + «${directionScopeLabel(directionSlug, kb?.directions ?? [])}»`
            : "Добавьте направления на вкладке «Источники», если нужны отдельные clip-land под темы."}
        </p>
      </section>

      <section className="space-y-3">
        <Label className="text-sm font-medium">3. Сценарий трафика</Label>
        <select
          value={scenarioId}
          onChange={(e) => {
            setScenarioId(e.target.value);
            setBlockPresetId("custom");
            setClipBlockPresetId("custom");
            setIncludedBlocks(presetBlocksForScenario(e.target.value, format));
            setClipStepBlocks(presetClipBlocksForScenario(e.target.value));
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {landingScenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Контекст для AI: на какую температуру трафика заточен текст.
        </p>
      </section>

      {templateId === "full" && (
        <>
          <section className="space-y-3">
            <Label className="text-sm font-medium">{stepTone}. Тон и подача</Label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="kitchen">Разговор на кухне — живая история от первого лица</option>
              <option value="classic">Классический — ясно, по делу, цифры и доверие</option>
              <option value="agora">Agora — через врага и смену картины мира</option>
              <option value="longread">Лонгрид — максимально подробно</option>
            </select>
            <p className="text-xs text-muted-foreground">
              «Кухня» — один рассказчик, живые сцены, без штампов. Лучший тон для медицины и
              недоверчивой аудитории.
            </p>
          </section>

          <section className="space-y-3">
            <Label className="text-sm font-medium">5. Конструктор блоков</Label>
            <LabFullBlockConstructor
              scenarioId={scenarioId}
              format={format}
              selected={includedBlocks}
              onChange={setIncludedBlocks}
              presetId={blockPresetId}
              onPresetChange={setBlockPresetId}
            />
          </section>
        </>
      )}

      {templateId === "clip-4" && (
        <section className="space-y-3">
          <Label className="text-sm font-medium">4. Конструктор экранов</Label>
          <LabClipBlockConstructor
            scenarioId={scenarioId}
            config={clipStepBlocks}
            onChange={setClipStepBlocks}
            presetId={clipBlockPresetId}
            onPresetChange={setClipBlockPresetId}
          />
        </section>
      )}

      <section className="space-y-2">
        <Label className="text-sm font-medium">
          {stepName}. Название прототипа
        </Label>
        <Input
          placeholder="Например: Отёк ног — клип-4 на холодный РСЯ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => nav(-1)}>
          Отмена
        </Button>
        <Button onClick={generate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Сгенерировать
        </Button>
      </div>
    </div>
  );
}
