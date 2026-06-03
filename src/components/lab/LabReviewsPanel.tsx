import { useRef, useState } from "react";
import { Upload, Star, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { forgeApi } from "@/lib/forge/api";
import type { ForgeReview } from "@/lib/forge/types";

type Props = {
  productId: string;
  reviews: ForgeReview[];
  onChange: (rows: ForgeReview[]) => void;
};

/** Простой CSV-парсер для столбцов: text,author?,source?,rating? */
function parseCsv(raw: string): { text: string; author?: string; source?: string; rating?: number }[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headerLine = lines[0].toLowerCase();
  const hasHeader = /text/.test(headerLine) || /отзыв/.test(headerLine);
  const headers = hasHeader ? splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase()) : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const idx = {
    text: hasHeader ? headers.findIndex((h) => h === "text" || h === "отзыв") : 0,
    author: hasHeader ? headers.findIndex((h) => h === "author" || h === "автор") : 1,
    source: hasHeader ? headers.findIndex((h) => h === "source" || h === "источник") : 2,
    rating: hasHeader ? headers.findIndex((h) => h === "rating" || h === "оценка") : 3,
  };

  const rows: { text: string; author?: string; source?: string; rating?: number }[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const text = (cells[idx.text >= 0 ? idx.text : 0] ?? "").trim();
    if (!text) continue;
    const author = idx.author >= 0 ? cells[idx.author]?.trim() : undefined;
    const source = idx.source >= 0 ? cells[idx.source]?.trim() : undefined;
    const ratingRaw = idx.rating >= 0 ? cells[idx.rating]?.trim() : undefined;
    const rating = ratingRaw ? Number(ratingRaw.replace(",", ".")) : undefined;
    rows.push({ text, author, source, rating: Number.isFinite(rating) ? rating : undefined });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function LabReviewsPanel({ productId, reviews, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkText, setBulkText] = useState("");
  const [manualText, setManualText] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [importing, setImporting] = useState(false);
  const [autoTag, setAutoTag] = useState(false);

  async function reload() {
    const fresh = await forgeApi.reviews.list(productId);
    onChange(fresh);
  }

  async function importRows(rows: { text: string; author?: string; source?: string; rating?: number }[]) {
    if (!rows.length) return toast.error("Пусто");
    setImporting(true);
    try {
      if (autoTag) {
        const r = await forgeApi.importReviews({ product_id: productId, rows, auto_tag: true });
        toast.success(`Импортировано ${r.inserted}, размечено ${r.tagged}`);
      } else {
        const inserted = await forgeApi.reviews.createMany(productId, rows);
        toast.success(`Импортировано ${inserted}`);
      }
      setBulkText("");
      setManualText("");
      setManualAuthor("");
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка импорта");
    } finally {
      setImporting(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      const rows = parseCsv(txt);
      importRows(rows);
    };
    reader.readAsText(file, "utf-8");
  }

  async function toggleStar(id: string, value: boolean) {
    await forgeApi.reviews.toggleStarred(id, value);
    onChange(reviews.map((r) => (r.id === id ? { ...r, is_starred: value } : r)));
  }

  async function remove(id: string) {
    if (!confirm("Удалить отзыв?")) return;
    await forgeApi.reviews.remove(id);
    onChange(reviews.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold">Импорт отзывов</h3>
          <label className="text-xs flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" checked={autoTag} onChange={(e) => setAutoTag(e.target.checked)} />
            Авто-теги через AI (медленнее)
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">CSV-файл</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={handleFile}
            />
            <p className="text-xs text-muted-foreground">
              Колонки: <code>text,author,source,rating</code> (заголовок опционален)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Вставить текстом</Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Один отзыв на строку. Можно CSV."
              rows={4}
              disabled={importing}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => importRows(parseCsv(bulkText))}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Импортировать
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Label className="text-xs">Добавить вручную</Label>
          <Input
            placeholder="Автор (опционально)"
            value={manualAuthor}
            onChange={(e) => setManualAuthor(e.target.value)}
            disabled={importing}
          />
          <Textarea
            placeholder="Текст отзыва"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={3}
            disabled={importing}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={() => {
              if (!manualText.trim()) return;
              importRows([{ text: manualText.trim(), author: manualAuthor.trim() || undefined }]);
            }}
          >
            Добавить
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Отзывы ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока ничего не импортировано.</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    {r.author && <span>{r.author}</span>}
                    {r.source && <Badge variant="outline">{r.source}</Badge>}
                    {typeof r.rating === "number" && <span>★ {r.rating}</span>}
                    <span>{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleStar(r.id, !r.is_starred)}
                      className={r.is_starred ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}
                      title={r.is_starred ? "Убрать из ключевых" : "Отметить как ключевой"}
                    >
                      <Star className="h-4 w-4" fill={r.is_starred ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{r.text}</p>
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
