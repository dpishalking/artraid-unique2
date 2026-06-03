import { useEffect, useState } from "react";
import { Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgeApi } from "@/lib/forge/api";
import {
  CLIP_STEP_KEYS,
  CLIP_STEP_LABELS,
  PROMPT_DEFAULT_HINTS,
  emptyPromptConfig,
  type ClipStepKey,
  type ClipStepPromptConfig,
  type ForgeGenerationPromptConfig,
} from "@/lib/forge/generationPrompts";

type Props = {
  mode: "global" | "product";
  productId?: string;
  initialConfig?: ForgeGenerationPromptConfig;
  onSaved?: (config: ForgeGenerationPromptConfig) => void;
  compact?: boolean;
};

function HintBlock({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-dashed bg-muted/30 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      {open && <p className="px-3 pb-3 text-muted-foreground whitespace-pre-wrap">{text}</p>}
    </div>
  );
}

export function LabGenerationPromptsPanel({
  mode,
  productId,
  initialConfig,
  onSaved,
  compact,
}: Props) {
  const [draft, setDraft] = useState<ForgeGenerationPromptConfig>(
    initialConfig ?? emptyPromptConfig(),
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "global");

  useEffect(() => {
    if (initialConfig) setDraft(initialConfig);
  }, [initialConfig]);

  useEffect(() => {
    if (mode !== "global") return;
    setLoading(true);
    forgeApi.labSettings
      .getGenerationPrompts()
      .then(setDraft)
      .catch((e) => toast.error(e?.message ?? "Не удалось загрузить промпты"))
      .finally(() => setLoading(false));
  }, [mode]);

  function updateFull(field: "system_append" | "user_task_append", value: string) {
    setDraft((d) => ({
      ...d,
      full: { ...d.full, [field]: value || undefined },
    }));
  }

  function updateClip(field: "system_append" | "user_task_append", value: string) {
    setDraft((d) => ({
      ...d,
      clip: { ...d.clip, [field]: value || undefined },
    }));
  }

  function updateClipStep(key: ClipStepKey, instruction: string) {
    updateClipStepField(key, "instruction", instruction);
  }

  function updateClipStepField(
    key: ClipStepKey,
    field: keyof ClipStepPromptConfig,
    value: string,
  ) {
    setDraft((d) => ({
      ...d,
      clip: {
        ...d.clip,
        steps: {
          ...d.clip?.steps,
          [key]: {
            ...d.clip?.steps?.[key],
            [field]: value.trim() || undefined,
          },
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      if (mode === "global") {
        await forgeApi.labSettings.setGenerationPrompts(draft);
      } else if (productId) {
        await forgeApi.products.update(productId, { generation_prompts: draft });
      }
      toast.success(mode === "global" ? "Глобальные промпты сохранены" : "Промпты продукта сохранены");
      toast.message("Перегенерируйте прототип — новые промпты применятся только к новой версии.");
      onSaved?.(draft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === "global"
      ? "Промпты генерации (глобальные)"
      : "Промпты генерации продукта";
  const description =
    mode === "global"
      ? "Базовые дополнения ко всем продуктам. На карточке продукта можно добавить свои правки поверх."
      : "Дополнения к глобальным промптам только для этого продукта. Пустые поля — используются дефолты из кода.";

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const inner = (
    <>
      <Tabs defaultValue="full">
        <TabsList>
          <TabsTrigger value="full">Full-лендинг</TabsTrigger>
          <TabsTrigger value="clip">Clip-лендинг (4 шага)</TabsTrigger>
        </TabsList>

        <TabsContent value="full" className="space-y-4 mt-4">
          <HintBlock title="Дефолтный system prompt" text={PROMPT_DEFAULT_HINTS.fullSystem} />
          <div className="space-y-2">
            <Label htmlFor="full-system">Дополнение к system prompt</Label>
            <Textarea
              id="full-system"
              rows={compact ? 4 : 6}
              placeholder="Например: усилить акцент на гарантию, не использовать слово «уникальный»…"
              value={draft.full?.system_append ?? ""}
              onChange={(e) => updateFull("system_append", e.target.value)}
            />
          </div>
          <HintBlock title="Дефолтная задача в user prompt" text={PROMPT_DEFAULT_HINTS.fullUserTask} />
          <div className="space-y-2">
            <Label htmlFor="full-user">Дополнение к блоку «ЗАДАЧА»</Label>
            <Textarea
              id="full-user"
              rows={compact ? 4 : 6}
              placeholder="Дополнительные требования к full-лендингу для этого продукта…"
              value={draft.full?.user_task_append ?? ""}
              onChange={(e) => updateFull("user_task_append", e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="clip" className="space-y-4 mt-4">
          <HintBlock title="Дефолтный system prompt clip-4" text={PROMPT_DEFAULT_HINTS.clipSystem} />
          <div className="space-y-2">
            <Label htmlFor="clip-system">Дополнение к system prompt clip-4</Label>
            <Textarea
              id="clip-system"
              rows={compact ? 3 : 5}
              placeholder="Общие правки для всех 4 экранов клипа…"
              value={draft.clip?.system_append ?? ""}
              onChange={(e) => updateClip("system_append", e.target.value)}
            />
          </div>
          <HintBlock title="Дефолтная задача clip-4" text={PROMPT_DEFAULT_HINTS.clipUserTask} />
          <div className="space-y-2">
            <Label htmlFor="clip-user">Дополнение к общей задаче clip-4</Label>
            <Textarea
              id="clip-user"
              rows={compact ? 3 : 5}
              placeholder="Общие требования ко всему клип-лендингу…"
              value={draft.clip?.user_task_append ?? ""}
              onChange={(e) => updateClip("user_task_append", e.target.value)}
            />
          </div>

          <div className="pt-2 border-t space-y-4">
            <p className="text-sm font-medium">Инструкции по отдельным экранам</p>
            <p className="text-xs text-muted-foreground">
              Поля «дословно» подставляются в JSON после генерации — заголовок и кнопка не «уплывут».
              Остальной текст экрана AI всё ещё пишет по инструкции ниже.
            </p>
            {CLIP_STEP_KEYS.map((key) => (
              <div key={key} className="space-y-3 rounded-lg border border-border/60 p-4">
                <Label className="text-sm font-medium">{CLIP_STEP_LABELS[key]}</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`clip-headline-${key}`} className="text-xs text-muted-foreground">
                      Заголовок (дословно)
                    </Label>
                    <Input
                      id={`clip-headline-${key}`}
                      placeholder="Например: Просыпаетесь с отёками и тяжестью в ногах?"
                      value={draft.clip?.steps?.[key]?.headline_fixed ?? ""}
                      onChange={(e) => updateClipStepField(key, "headline_fixed", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`clip-cta-${key}`} className="text-xs text-muted-foreground">
                      {key === "apply" ? "Кнопка формы (дословно)" : "Кнопка CTA (дословно)"}
                    </Label>
                    <Input
                      id={`clip-cta-${key}`}
                      placeholder={key === "apply" ? "Заказать сейчас" : "В чём секрет?"}
                      value={draft.clip?.steps?.[key]?.cta_label_fixed ?? ""}
                      onChange={(e) => updateClipStepField(key, "cta_label_fixed", e.target.value)}
                    />
                  </div>
                </div>
                <HintBlock
                  title="Дефолт структуры шага"
                  text={PROMPT_DEFAULT_HINTS.clipSteps[key]}
                />
                <div className="space-y-1.5">
                  <Label htmlFor={`clip-step-${key}`} className="text-xs text-muted-foreground">
                    Инструкция для AI (мягкая)
                  </Label>
                  <Textarea
                    id={`clip-step-${key}`}
                    rows={3}
                    placeholder={`Доп. требования к экрану «${CLIP_STEP_LABELS[key]}»…`}
                    value={draft.clip?.steps?.[key]?.instruction ?? ""}
                    onChange={(e) => updateClipStep(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Сохранить
        </Button>
      </div>
    </>
  );

  if (compact) {
    return <div className="space-y-4">{inner}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
}
