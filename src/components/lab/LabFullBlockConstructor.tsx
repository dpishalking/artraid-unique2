import { useMemo } from "react";
import { Info, Layers, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  FULL_LANDING_BLOCK_CATALOG,
  FULL_LANDING_BLOCK_PRESETS,
  buildFullBlockSequence,
  blockLabel,
  presetBlocksForScenario,
  suggestSkippedBlocks,
  type FullLandingMiddleBlockKey,
  type FullLandingBlockPresetId,
} from "@/lib/forge/fullLandingBlocks";

type Props = {
  scenarioId: string;
  format: string;
  selected: FullLandingMiddleBlockKey[];
  onChange: (blocks: FullLandingMiddleBlockKey[]) => void;
  presetId: FullLandingBlockPresetId | "custom";
  onPresetChange: (id: FullLandingBlockPresetId | "custom") => void;
};

export function LabFullBlockConstructor({
  scenarioId,
  format,
  selected,
  onChange,
  presetId,
  onPresetChange,
}: Props) {
  const sequence = useMemo(() => buildFullBlockSequence(selected), [selected]);
  const skipSuggestions = useMemo(
    () => suggestSkippedBlocks(selected, scenarioId, format),
    [selected, scenarioId, format],
  );

  function applyPreset(id: FullLandingBlockPresetId) {
    onPresetChange(id);
    onChange(FULL_LANDING_BLOCK_PRESETS.find((p) => p.id === id)!.blocks);
  }

  function toggleBlock(key: FullLandingMiddleBlockKey, checked: boolean) {
    onPresetChange("custom");
    if (checked) {
      const order = FULL_LANDING_BLOCK_CATALOG.map((b) => b.key);
      const next = [...selected, key].sort(
        (a, b) => order.indexOf(a) - order.indexOf(b),
      );
      onChange(next);
    } else {
      onChange(selected.filter((k) => k !== key));
    }
  }

  function applySuggestedTrim() {
    const toRemove = new Set(skipSuggestions.map((s) => s.key));
    onChange(selected.filter((k) => !toRemove.has(k)));
    onPresetChange("custom");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card/50 p-4">
      <div className="flex items-start gap-2">
        <Layers className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <Label className="text-sm font-medium">Конструктор блоков</Label>
          <p className="text-xs text-muted-foreground mt-1">
            hero и финальный CTA всегда включены. Выберите, какие секции войдут в лендинг — AI
            соберёт именно эту структуру, а не шаблон на все 18 блоков.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FULL_LANDING_BLOCK_PRESETS.map((p) => (
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
            onChange(presetBlocksForScenario(scenarioId, format));
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
            {skipSuggestions.slice(0, 6).map((s) => (
              <li key={s.key}>
                <span className="text-foreground/90">{blockLabel(s.key)}</span> — {s.reason}
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

      <div className="grid sm:grid-cols-2 gap-2">
        {FULL_LANDING_BLOCK_CATALOG.map((block) => {
          const checked = selected.includes(block.key);
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
                onCheckedChange={(v) => toggleBlock(block.key, v === true)}
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

      <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-3">
        <span className="text-foreground/80">Порядок на странице:</span>{" "}
        {sequence.map((k) => (k === "hero" || k === "final_cta" ? k : blockLabel(k))).join(" → ")}
        <span className="ml-2 text-muted-foreground">({selected.length + 2} секций)</span>
      </div>
    </section>
  );
}
