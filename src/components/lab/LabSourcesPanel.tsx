import { useRef, useState } from "react";
import { ExternalLink, FileUp, Globe, Loader2, Plus, Sparkles, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { forgeApi } from "@/lib/forge/api";
import { extractTextFromFile } from "@/lib/projectFiles/extractText";
import {
  emptyReferenceRow,
  referencesForApi,
  type StagedReferenceSite,
} from "@/lib/forge/referenceSites";
import { directionScopeLabel } from "@/lib/forge/directions";
import { LabDirectionsPanel } from "@/components/lab/LabDirectionsPanel";
import type { ForgeKnowledgeBase, ForgeProduct, ForgeReferenceSite } from "@/lib/forge/types";

type StagedFile = {
  id: string;
  filename: string;
  text: string;
  status: "ready" | "skipped" | "failed";
  note?: string;
};

type Props = {
  product: ForgeProduct;
  kb: ForgeKnowledgeBase;
  onKbUpdated: (kb: ForgeKnowledgeBase) => void;
  onReviewsReload: () => Promise<void>;
  onGoKb: () => void;
  onCreatePrototype: () => void;
};

const DEFAULT_REFERENCE_ROWS = 1;

export function LabSourcesPanel({
  product,
  kb,
  onKbUpdated,
  onReviewsReload,
  onGoKb,
  onCreatePrototype,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [references, setReferences] = useState<StagedReferenceSite[]>(() =>
    Array.from({ length: DEFAULT_REFERENCE_ROWS }, () => emptyReferenceRow()),
  );
  const [directionSlug, setDirectionSlug] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reading, setReading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setReading(true);
    const next: StagedFile[] = [];
    try {
      for (const file of Array.from(files)) {
        const outcome = await extractTextFromFile(file.name, file.type, file);
        if (outcome.status === "ready") {
          next.push({
            id: crypto.randomUUID(),
            filename: file.name,
            text: outcome.text,
            status: "ready",
          });
        } else if (outcome.status === "skipped") {
          toast.message(`${file.name}: ${outcome.note}`);
        } else {
          toast.error(`${file.name}: ${outcome.error}`);
        }
      }
      if (next.length) {
        setStaged((prev) => [...prev, ...next]);
        toast.success(`Готово к разбору: ${next.length} файл(ов)`);
      }
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeStaged(id: string) {
    setStaged((prev) => prev.filter((f) => f.id !== id));
  }

  function updateReference(id: string, patch: Partial<StagedReferenceSite>) {
    setReferences((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeReference(id: string) {
    setReferences((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length ? next : [emptyReferenceRow()];
    });
  }

  async function structureKb() {
    const sources = staged.filter((s) => s.status === "ready" && s.text.trim());
    const referenceSites = referencesForApi(references);
    if (!sources.length && !pasteText.trim() && !referenceSites.length) {
      toast.error("Добавьте файлы, текст или ссылки на референсы");
      return;
    }
    setProcessing(true);
    try {
      const dir = kb.directions?.find((d) => d.slug === directionSlug);
      const result = await forgeApi.structureKb({
        product_id: product.id,
        product_name: product.name,
        sources: sources.map((s) => ({ filename: s.filename, text: s.text })),
        paste_text: pasteText.trim() || undefined,
        reference_sites: referenceSites.length ? referenceSites : undefined,
        direction_slug: directionSlug ?? undefined,
        direction_title: dir?.title,
      });
      onKbUpdated(result.kb);
      setStaged([]);
      setPasteText("");
      setReferences(Array.from({ length: DEFAULT_REFERENCE_ROWS }, () => emptyReferenceRow()));
      if (result.reviews_inserted > 0) await onReviewsReload();

      const refErrors = (result as { reference_errors?: string[] }).reference_errors ?? [];
      if (refErrors.length) {
        toast.message(`Часть референсов не загрузилась: ${refErrors.slice(0, 2).join("; ")}`);
      }

      toast.success(
        `База обновлена: ${result.completion_percent}%` +
          (result.references_added ? ` · референсов +${result.references_added}` : "") +
          (result.reviews_inserted ? ` · отзывов +${result.reviews_inserted}` : ""),
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось разобрать материалы");
    } finally {
      setProcessing(false);
    }
  }

  const savedDocs = kb.source_documents ?? [];
  const savedRefs = kb.reference_sites ?? [];
  const readyCount = staged.filter((s) => s.status === "ready").length;
  const refCount = referencesForApi(references).length;
  const canStructure = readyCount > 0 || pasteText.trim().length > 0 || refCount > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <LabDirectionsPanel
        productId={product.id}
        kb={kb}
        onSaved={onKbUpdated}
        selectedSlug={directionSlug}
        onSelectSlug={setDirectionSlug}
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Материалы и референсы — разберём базу сами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Файлы и тексты — про ваш продукт. Ссылки — референсы по смыслу. Сейчас загрузка в:{" "}
            <strong className="text-foreground">{directionScopeLabel(directionSlug, kb.directions ?? [])}</strong>
          </p>
          <p className="text-xs">
            Для шаблона <strong className="text-foreground">clip-4</strong> добавьте PDF воронки или ссылки на
            clip-ленды — при генерации их смысловая структура попадёт в промпт (экран за экраном).
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">KB: {kb.completion_percent}%</Badge>
            <Badge variant="outline">Файлов: {savedDocs.length}</Badge>
            <Badge variant="outline">Референсов: {savedRefs.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Референсы по смыслу
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            До 6 сайтов — конкуренты, удачные clip-land, landing в нише. Укажите, что именно смотреть
            (hook, доказательства, форма).
          </p>
          {references.map((ref, index) => (
            <div key={ref.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">Сайт {index + 1}</Label>
                {references.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeReference(ref.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <Input
                value={ref.url}
                onChange={(e) => updateReference(ref.id, { url: e.target.value })}
                placeholder="https://example.com/landing"
                className="h-10"
              />
              <div className="grid sm:grid-cols-2 gap-2">
                <Input
                  value={ref.label}
                  onChange={(e) => updateReference(ref.id, { label: e.target.value })}
                  placeholder="Метка: сильный hook"
                />
                <Input
                  value={ref.note}
                  onChange={(e) => updateReference(ref.id, { note: e.target.value })}
                  placeholder="Что взять: структура боли"
                />
              </div>
            </div>
          ))}
          {references.length < 6 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setReferences((p) => [...p, emptyReferenceRow()])}>
              <Plus className="h-4 w-4 mr-1" /> Ещё ссылку
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.markdown,.csv,.html,.htm,.json,.xml,.rtf,text/*"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={reading}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 px-6 py-10 text-center transition-colors"
          >
            {reading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <FileUp className="h-8 w-8 mx-auto text-primary mb-2" />
            )}
            <p className="font-medium text-foreground">
              {reading ? "Читаем файлы…" : "Файлы продукта — PDF, TXT, MD…"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">До 8 МБ на файл · несколько сразу</p>
          </button>

          {staged.length > 0 ? (
            <ul className="space-y-2">
              {staged.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{f.filename}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.round(f.text.length / 1000)}k симв.
                    </span>
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStaged(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Или вставьте текст</p>
            <Textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Бриф, переписка, выгрузка отзывов, заметки с созвона…"
              className="resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              className="bg-gradient-money text-primary-foreground"
              disabled={!canStructure || processing}
              onClick={() => void structureKb()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Разобрать в базу знаний
            </Button>
            {kb.completion_percent >= 30 ? (
              <>
                <Button variant="outline" onClick={onGoKb}>
                  Проверить базу
                </Button>
                <Button variant="secondary" onClick={onCreatePrototype}>
                  Создать прототип
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {(savedDocs.length > 0 || savedRefs.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Уже в базе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedRefs.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {[...savedRefs].reverse().slice(0, 8).map((ref: ForgeReferenceSite) => (
                  <li key={ref.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate inline-flex items-center gap-1 max-w-full"
                      >
                        {ref.label || ref.url}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      {ref.note ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{ref.note}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(ref.added_at).toLocaleDateString("ru-RU")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {savedDocs.length > 0 ? (
              <ul className="space-y-2 text-sm border-t border-border pt-3">
                {[...savedDocs].reverse().slice(0, 8).map((doc) => (
                  <li key={doc.id} className="flex justify-between gap-2 text-muted-foreground">
                    <span className="truncate">{doc.filename}</span>
                    <span className="shrink-0 text-xs">
                      {new Date(doc.uploaded_at).toLocaleDateString("ru-RU")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
