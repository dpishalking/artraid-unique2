import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { studioApi } from "@/lib/forge/studioApi";
import type { StudioPortalConfig } from "@/lib/forge/studioTypes";
import { studioResultPath } from "@/lib/forge/studioPaths";
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

export default function StudioPortalPage() {
  const { token = "" } = useParams<{ token: string }>();
  const nav = useNavigate();

  const [config, setConfig] = useState<StudioPortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [templateId, setTemplateId] = useState("clip-4");
  const [scenarioId, setScenarioId] = useState("cold_traffic");
  const [directionSlug, setDirectionSlug] = useState("");
  const [format, setFormat] = useState("kitchen");
  const [name, setName] = useState("");
  const [includedBlocks, setIncludedBlocks] = useState<FullLandingMiddleBlockKey[]>(() =>
    presetBlocksForScenario("cold_traffic", "kitchen"),
  );
  const [blockPresetId, setBlockPresetId] = useState<FullLandingBlockPresetId | "custom">("standard");
  const [clipStepBlocks, setClipStepBlocks] = useState<ClipStepBlocksConfig>(() => ({
    ...CLIP_STEP_DEFAULT_BLOCKS,
  }));
  const [clipBlockPresetId, setClipBlockPresetId] = useState<ClipBlockPresetId | "custom">("standard");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    studioApi
      .getConfig(token)
      .then((c) => {
        setConfig(c);
        const firstTemplate = c.templates[0]?.id ?? "clip-4";
        const firstScenario = c.scenarios[0]?.id ?? "cold_traffic";
        setTemplateId(firstTemplate);
        setScenarioId(firstScenario);
        setFormat(c.formats[0]?.id ?? "kitchen");
      })
      .catch((e) => toast.error(e?.message ?? "Ссылка недействительна"))
      .finally(() => setLoading(false));
  }, [token]);

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
    if (!token || !config) return;
    if (!name.trim()) return toast.error("Назовите вариант лендинга");
    if (config.limits.generations_remaining <= 0) {
      return toast.error("Достигнут дневной лимит генераций");
    }
    if (templateId === "full" && includedBlocks.length < 2) {
      return toast.error("Выберите хотя бы 2 блока");
    }
    if (templateId === "clip-4") {
      const err = validateClipStepBlocks(clipStepBlocks);
      if (err) return toast.error(err);
    }

    setGenerating(true);
    try {
      const result = await studioApi.generate({
        token,
        template_id: templateId,
        scenario_id: scenarioId,
        direction_slug: directionSlug || undefined,
        format: templateId === "full" ? format : undefined,
        name: name.trim(),
        included_blocks: templateId === "full" ? includedBlocks : undefined,
        clip_step_blocks: templateId === "clip-4" ? clipStepBlocks : undefined,
      });
      toast.success("Лендинг сгенерирован");
      if (result.slug) {
        nav(studioResultPath(token, result.slug));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
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

  if (!config) {
    return (
      <p className="text-center text-muted-foreground py-16">
        Ссылка недействительна или срок её действия истёк.
      </p>
    );
  }

  const stepName = templateId === "full" ? 6 : templateId === "clip-4" ? 5 : 4;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{config.portal.title}</h1>
        {config.portal.subtitle && (
          <p className="text-sm text-white/60 mt-1">{config.portal.subtitle}</p>
        )}
        <p className="text-xs text-white/40 mt-2">
          {config.portal.product_name} · осталось генераций сегодня:{" "}
          {config.limits.generations_remaining}
        </p>
      </div>

      <section className="space-y-3">
        <Label className="text-sm font-medium">1. Формат страницы</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          {config.templates.map((t) => {
            const active = templateId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "text-left rounded-2xl border p-4 transition-colors",
                  active
                    ? "border-amber-400/60 bg-amber-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white/90">{t.title}</span>
                  {active && <Check className="h-4 w-4 text-amber-300" />}
                </div>
                {t.description && (
                  <p className="text-xs text-white/50 mt-1">{t.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {config.directions.length > 0 && (
        <section className="space-y-3">
          <Label className="text-sm font-medium">2. Направление</Label>
          <select
            value={directionSlug}
            onChange={(e) => setDirectionSlug(e.target.value)}
            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="">Общее (весь продукт)</option>
            {config.directions.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.title}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="space-y-3">
        <Label className="text-sm font-medium">
          {config.directions.length > 0 ? 3 : 2}. Сценарий трафика
        </Label>
        <select
          value={scenarioId}
          onChange={(e) => {
            setScenarioId(e.target.value);
            setBlockPresetId("custom");
            setClipBlockPresetId("custom");
            setIncludedBlocks(presetBlocksForScenario(e.target.value, format));
            setClipStepBlocks(presetClipBlocksForScenario(e.target.value));
          }}
          className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          {config.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </section>

      {templateId === "full" && (
        <>
          <section className="space-y-3">
            <Label className="text-sm font-medium">4. Тон и подача</Label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              {config.formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
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
          <Label className="text-sm font-medium">
            {config.directions.length > 0 ? 4 : 3}. Конструктор экранов
          </Label>
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
        <Label className="text-sm font-medium">{stepName}. Название варианта</Label>
        <Input
          placeholder="Например: Отёки — clip на холодный трафик"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/5 border-white/10"
        />
      </section>

      <div className="flex justify-end pt-2">
        <Button
          onClick={generate}
          disabled={generating || config.limits.generations_remaining <= 0}
          className="bg-amber-400 text-black hover:bg-amber-300"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          Сгенерировать
        </Button>
      </div>
    </div>
  );
}
