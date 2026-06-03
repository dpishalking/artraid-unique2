import { useEffect, useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  applyAllPendingMemorySuggestions,
  applyStructuredMemorySuggestion,
  getProjectMemoryRow,
  rejectAllPendingMemorySuggestions,
  setMemoryUpdateStatus,
} from "@/lib/projectMemory/api";
import { applyMemorySuggestionAsHypothesis } from "@/lib/hypotheses/fromMemorySuggestion";
import { calculateProjectMemoryCompletionPct, levelSlugFromCompletion } from "@/lib/projectMemory/completion";
import { mergeStoredMemoryIntoSections } from "@/lib/projectMemory/mergeSections";
import { getMemoryFieldLabel, getMemorySectionTitle } from "@/lib/projectMemory/sectionsNav";
import type { MemoryCompletionLevelSlug, ProjectMemorySections } from "@/lib/projectMemory/types";

type Props = {
  suggestions: Record<string, unknown>[];
  projectId: string;
  onApplied: (data: {
    completionPercent: number;
    level: MemoryCompletionLevelSlug | string;
    snapshot: ProjectMemorySections;
    badges: string[];
  }) => void;
  onChanged?: () => void;
};

function prettyVal(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(String).join("\n");
  if (v && typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v ?? "");
}

function sourceMeta(sourceType: string): { title: string; description: string } {
  if (sourceType === "site_import") {
    return {
      title: "Предложения из сайта",
      description:
        "AI извлёк данные с вашего сайта. Проверьте формулировки и примените нужные — так память заполнится без ручного ввода.",
    };
  }
  if (sourceType === "file_import") {
    return {
      title: "Предложения из файлов",
      description: "AI разобрал загруженные документы и предложил поля для памяти проекта.",
    };
  }
  if (sourceType === "voice_import") {
    return {
      title: "Предложения из рассказа",
      description: "AI структурировал ваш голосовой или текстовый рассказ о проекте.",
    };
  }
  if (sourceType === "brief_import") {
    return {
      title: "Предложения из брифа",
      description: "Ответы из брифа можно перенести в память — проверьте и примените нужные поля.",
    };
  }
  if (sourceType === "quiz_sync") {
    return {
      title: "Предложения из брифа",
      description: "Есть поля, которые можно перенести из ответов брифа в память проекта.",
    };
  }
  if (sourceType === "website_audit") {
    return {
      title: "Выводы аудита по упаковке сайта",
      description:
        "Диагностика лендинга: что мешает конверсии. Сохраните в память как контекст упаковки или отправьте в лабораторию гипотез для проверки.",
    };
  }
  return {
    title: "Предложения для памяти проекта",
    description: "AI предложил обновить поля памяти. Проверьте и примените нужные.",
  };
}

export function MemoryUpdateSuggestions({ suggestions, projectId, onApplied, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState(suggestions);

  useEffect(() => {
    setPending(suggestions);
  }, [suggestions]);

  const primarySource = String((pending[0] as Record<string, unknown> | undefined)?.source_type ?? "website_audit");
  const meta = useMemo(() => sourceMeta(primarySource), [primarySource]);
  const showHypothesisAction = primarySource === "website_audit";

  async function pushFreshState() {
    const rowDb = await getProjectMemoryRow(projectId);
    const merged = mergeStoredMemoryIntoSections(rowDb as unknown as Record<string, unknown>);
    const pct = calculateProjectMemoryCompletionPct(merged);
    onApplied({
      completionPercent: pct,
      level: levelSlugFromCompletion(pct),
      snapshot: merged,
      badges: rowDb.badges,
    });
    onChanged?.();
  }

  if (!pending.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold tracking-tight">{meta.title}</h2>
          <p className="text-xs text-muted-foreground max-w-xl">{meta.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 text-primary text-xs font-medium px-2.5 py-0.5">
            {pending.length} {pending.length === 1 ? "поле" : pending.length < 5 ? "поля" : "полей"}
          </span>
          {pending.length > 1 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("reject-all");
                  try {
                    const ids = pending.map((row) => String((row as Record<string, unknown>).id ?? "")).filter(Boolean);
                    await rejectAllPendingMemorySuggestions(ids);
                    setPending([]);
                    onChanged?.();
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Пропустить все
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("accept-all");
                  try {
                    await applyAllPendingMemorySuggestions(pending as Record<string, unknown>[]);
                    setPending([]);
                    await pushFreshState();
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "accept-all" ? "Применяем…" : "Всё в память"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pending.slice(0, 9).map((raw) => {
          const row = raw as Record<string, unknown>;
          const id = String(row.id ?? "");
          const sec = String(row.section ?? "?");
          const fld = String(row.field ?? "?");
          const sectionTitle = getMemorySectionTitle(sec);
          const fieldLabel = getMemoryFieldLabel(sec, fld);

          return (
            <div
              key={id || `${sec}_${fld}_${String(row.created_at ?? "")}`}
              className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{sectionTitle}</div>
                <div className="text-sm font-medium text-foreground">{fieldLabel}</div>
              </div>
              <pre className="whitespace-pre-wrap text-[11px] leading-snug text-foreground/90 max-h-32 overflow-auto flex-1">
                {prettyVal(row.suggested_value)}
              </pre>
              <div className={`flex gap-2 pt-1 ${showHypothesisAction ? "flex-col" : ""}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 text-xs ${showHypothesisAction ? "w-full" : "flex-1"}`}
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy(id);
                    try {
                      await setMemoryUpdateStatus(id, "rejected");
                      setPending((rows) =>
                        rows.filter((x) => String((x as Record<string, unknown>).id ?? "") !== id),
                      );
                      onChanged?.();
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Пропустить
                </Button>
                <div className={`flex gap-2 ${showHypothesisAction ? "w-full" : "flex-1"}`}>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy(id);
                      try {
                        await applyStructuredMemorySuggestion(row);
                        setPending((rows) =>
                          rows.filter((x) => String((x as Record<string, unknown>).id ?? "") !== id),
                        );
                        await pushFreshState();
                        toast.success("Добавлено в память проекта");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {busy === id ? "…" : "В память"}
                  </Button>
                  {showHypothesisAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs gap-1"
                      disabled={busy !== null}
                      onClick={async () => {
                        setBusy(`${id}-hypo`);
                        try {
                          await applyMemorySuggestionAsHypothesis(row);
                          setPending((rows) =>
                            rows.filter((x) => String((x as Record<string, unknown>).id ?? "") !== id),
                          );
                          toast.success("Гипотеза добавлена в лабораторию");
                          onChanged?.();
                        } catch {
                          toast.error("Не удалось создать гипотезу");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      <FlaskConical className="h-3 w-3 shrink-0" />
                      {busy === `${id}-hypo` ? "…" : "В гипотезу"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pending.length > 9 && (
        <p className="text-[11px] text-muted-foreground text-center">
          + ещё {pending.length - 9} — появятся, когда разберёте текущие.
        </p>
      )}
    </section>
  );
}
