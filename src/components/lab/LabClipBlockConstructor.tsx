import { useMemo, useState } from "react";
import { Info, Layers, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CLIP_BLOCK_PRESETS,
  CLIP_STEP_KEYS,
  CLIP_STEP_LABELS,
  buildClipStepSequence,
  clipBlockLabel,
  clipSequenceLabel,
  blocksForStep,
  presetClipBlocksForScenario,
  suggestSkippedClipBlocks,
  type ClipBlockPresetId,
  type ClipStepBlocksConfig,
  type ClipStepContentBlockKey,
  type ClipStepKey,
} from "@/lib/forge/clipLandingBlocks";

type Props = {
  scenarioId: string;
  config: ClipStepBlocksConfig;
  onChange: (config: ClipStepBlocksConfig) => void;
  presetId: ClipBlockPresetId | "custom";
  onPresetChange: (id: ClipBlockPresetId | "custom") => void;
};

export function LabClipBlockConstructor({
  scenarioId,
  config,
  onChange,
  presetId,
  onPresetChange,
}: Props) {
  const [activeStep, setActiveStep] = useState<ClipStepKey>("hook");

  const skipSuggestions = useMemo(
    () => suggestSkippedClipBlocks(config, scenarioId),
    [config, scenarioId],
  );

  const activeSequence = useMemo(
    () => buildClipStepSequence(activeStep, config[activeStep]),
    [activeStep, config],
  );

  function applyPreset(id: ClipBlockPresetId) {
    onPresetChange(id);
    onChange(CLIP_BLOCK_PRESETS.find((p) => p.id === id)!.blocks);
  }

  function toggleBlock(step: ClipStepKey, key: ClipStepContentBlockKey, checked: boolean) {
    onPresetChange("custom");
    const current = config[step];
    if (checked) {
      const order = blocksForStep(step).map((b) => b.key);
      const next = [...current, key].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      onChange({ ...config, [step]: next });
    } else {
      onChange({ ...config, [step]: current.filter((k) => k !== key) });
    }
  }

  function applySuggestedTrim() {
    const next = { ...config };
    for (const s of skipSuggestions) {
      next[s.step] = next[s.step].filter((k) => k !== s.key);
    }
    onChange(next);
    onPresetChange("custom");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card/50 p-4">
      <div className="flex items-start gap-2">
        <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <Label className="text-sm font-medium">Конструктор экранов clip-4</Label>
          <p className="text-xs text-muted-foreground mt-1">
            На каждом из 4 шагов выберите контент-блоки. Hero и CTA (или форма на последнем экране)
            включены всегда — AI соберёт только выбранную структуру.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CLIP_BLOCK_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors text-left",
              presetId === p.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border hover:border-foreground/30",
            )}
          >
            <span className="font-medium">{p.label}</span>
            <span className="block text-[10px] text-muted-foreground mt-0.5">{p.description}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            onPresetChange("custom");
            onChange(presetClipBlocksForScenario(scenarioId));
          }}
          className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs hover:border-primary/50"
        >
          <span className="font-medium inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Под сценарий
          </span>
          <span className="block text-[10px] text-muted-foreground mt-0.5">
            Автоподбор под «{scenarioId}»
          </span>
        </button>
      </div>

      {skipSuggestions.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-200/90">
            <Info className="h-3.5 w-3.5" />
            Можно убрать для этой задачи
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {skipSuggestions.slice(0, 5).map((s) => (
              <li key={`${s.step}-${s.key}`}>
                <span className="text-foreground/90">
                  {CLIP_STEP_LABELS[s.step].split(" · ")[0]} · {clipBlockLabel(s.key)}
                </span>{" "}
                — {s.reason}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={applySuggestedTrim}
            className="text-xs text-primary hover:underline"
          >
            Убрать рекомендованные блоки
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
        {CLIP_STEP_KEYS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(step)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeStep === step
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {CLIP_STEP_LABELS[step].split(" · ")[0]}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {blocksForStep(activeStep).map((block) => {
          const checked = config[activeStep].includes(block.key);
          return (
            <label
              key={block.key}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors",
                checked ? "border-primary/40 bg-primary/5" : "border-border/60 hover:border-border",
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => toggleBlock(activeStep, block.key, v === true)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="text-sm font-medium">{block.label}</span>
                <span className="block text-[11px] text-muted-foreground leading-snug">
                  {block.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-3 space-y-1">
        <div>
          <span className="text-foreground/80">{CLIP_STEP_LABELS[activeStep]}:</span>{" "}
          {activeSequence.map((k) => clipSequenceLabel(k)).join(" → ")}
        </div>
        <div className="text-muted-foreground">
          Все экраны:{" "}
          {CLIP_STEP_KEYS.map((step) => {
            const seq = buildClipStepSequence(step, config[step]);
            return `${step}: ${seq.length} блоков`;
          }).join(" · ")}
        </div>
      </div>
    </section>
  );
}
