import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipStepRenderer } from "@/components/lp/ClipStepRenderer";
import { FullLandingRenderer } from "@/components/lp/FullLandingRenderer";
import type { ForgeClipMeta, ForgeClipStepContent, ForgePrototypeContent } from "@/lib/forge/types";

type Props = {
  templateId: string;
  content: ForgePrototypeContent;
  prototypeId?: string;
  /** Сброс вкладок превью при новой версии */
  contentVersionKey?: string;
};

export function LabPrototypePreview({ templateId, content, prototypeId, contentVersionKey }: Props) {
  if (templateId === "clip-4" && Array.isArray(content.steps)) {
    return (
      <ClipPreview
        key={contentVersionKey}
        steps={content.steps}
        clipMeta={content.meta}
      />
    );
  }
  return (
    <FullPreview
      key={contentVersionKey}
      content={content}
      prototypeId={prototypeId}
    />
  );
}

function ClipPreview({ steps, clipMeta }: { steps: ForgeClipStepContent[]; clipMeta?: ForgeClipMeta }) {
  const [stepKey, setStepKey] = useState(steps[0]?.key ?? "");

  useEffect(() => {
    setStepKey(steps[0]?.key ?? "");
  }, [steps]);

  const idx = Math.max(0, steps.findIndex((s) => s.key === stepKey));
  return (
    <div className="space-y-3">
      <Tabs value={stepKey} onValueChange={setStepKey}>
        <TabsList className="flex-wrap h-auto">
          {steps.map((s, i) => (
            <TabsTrigger key={s.key} value={s.key}>
              {i + 1}. {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {steps.map((s, i) => {
          const next = steps[i + 1];
          return (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              <div className="rounded-2xl overflow-hidden border border-border">
                <ClipStepRenderer
                  prototypeId="preview"
                  slug="preview"
                  step={s}
                  stepIndex={i}
                  total={steps.length}
                  nextHref={next ? `#${next.key}` : null}
                  clipMeta={clipMeta}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Превью без отправки лидов. На публичной странице форма работает.
      </p>
    </div>
  );
}

function FullPreview({
  content,
  prototypeId,
}: {
  content: ForgePrototypeContent;
  prototypeId?: string;
}) {
  const blocks = content.blocks ?? {};
  const placeholder = typeof blocks._placeholder === "string";

  if (placeholder) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 text-sm">
        <p className="font-medium text-amber-800 dark:text-amber-200">Старая версия — заглушка</p>
        <p className="text-muted-foreground mt-1">
          Перегенерируйте прототип — full-шаблон теперь собирает все 18 блоков из базы знаний.
        </p>
      </div>
    );
  }

  if (prototypeId) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <FullLandingRenderer prototypeId={prototypeId} content={content} mode="preview" />
      </div>
    );
  }

  const hero = blocks.hero as { headline?: string; subheadline?: string; cta?: string } | undefined;
  const sequence = (content.meta as { sequence?: string[] } | undefined)?.sequence;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      {hero?.headline && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Hero</p>
          <h3 className="text-lg font-semibold">{hero.headline}</h3>
          {hero.subheadline && <p className="text-sm text-muted-foreground mt-1">{hero.subheadline}</p>}
        </div>
      )}
      {sequence?.length ? (
        <ol className="text-xs space-y-1 text-muted-foreground list-decimal list-inside">
          {sequence.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
