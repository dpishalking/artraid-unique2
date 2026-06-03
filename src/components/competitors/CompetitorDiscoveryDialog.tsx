import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Search, Globe, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDiscoveredCompetitors, discoverCompetitors } from "@/lib/competitors/api";
import type { CompetitorCandidate, CompetitorSource } from "@/lib/competitors/types";

type Mode = "context" | "lookalike" | "queries";

const SOURCE_BADGE: Record<CompetitorSource, { label: string; tone: string }> = {
  manual: { label: "Вручную", tone: "" },
  auto_context: { label: "По контексту", tone: "bg-primary/10 text-primary" },
  auto_lookalike: { label: "Похожие", tone: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  auto_serp: { label: "Из поиска", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  auto_extracted: { label: "Из аудита", tone: "" },
};

type Props = {
  open: boolean;
  projectId: string;
  existingHosts: string[];
  remainingSlots: number;
  unlimited?: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
};

export function CompetitorDiscoveryDialog({
  open,
  projectId,
  existingHosts,
  remainingSlots,
  unlimited = false,
  onOpenChange,
  onAdded,
}: Props) {
  const [modes, setModes] = useState<Record<Mode, boolean>>({
    context: true,
    lookalike: false,
    queries: false,
  });
  const [queries, setQueries] = useState<string[]>([""]);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CompetitorCandidate[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) {
      setCandidates([]);
      setSelectedHosts(new Set());
      setQueries([""]);
      setModes({ context: true, lookalike: false, queries: false });
    }
  }, [open]);

  const existingSet = useMemo(() => new Set(existingHosts), [existingHosts]);

  const canSearch =
    !searching &&
    (modes.context ||
      modes.lookalike ||
      (modes.queries && queries.some((q) => q.trim().length > 1)));

  const handleSearch = async () => {
    setSearching(true);
    setCandidates([]);
    setSelectedHosts(new Set());
    try {
      const trimmedQueries = modes.queries
        ? queries.map((q) => q.trim()).filter((q) => q.length > 1)
        : [];
      const found = await discoverCompetitors(projectId, {
        context: modes.context,
        lookalike: modes.lookalike,
        queries: trimmedQueries,
      });
      // Скрываем уже добавленных
      const fresh = found.filter((c) => !existingSet.has(c.host));
      setCandidates(fresh);
      // По умолчанию помечаем топ-N по confidence в пределах remainingSlots
      const top = [...fresh]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, unlimited ? fresh.length : Math.max(0, remainingSlots));
      setSelectedHosts(new Set(top.map((c) => c.host)));
      if (fresh.length === 0) {
        toast.info("AI не нашёл новых кандидатов. Попробуйте другие запросы.");
      } else {
        toast.success(`Найдено ${fresh.length} кандидатов`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Поиск не удался");
    } finally {
      setSearching(false);
    }
  };

  const handleAddSelected = async () => {
    const picked = candidates.filter((c) => selectedHosts.has(c.host));
    if (!picked.length) {
      toast.info("Отметьте хотя бы одного кандидата");
      return;
    }
    if (!unlimited && picked.length > remainingSlots) {
      toast.error(`Свободно ${remainingSlots} слотов на free-тарифе. Снимите лишние галочки.`);
      return;
    }
    setAdding(true);
    try {
      const { inserted, skipped } = await addDiscoveredCompetitors(projectId, picked);
      if (inserted.length) {
        toast.success(
          `Добавлено ${inserted.length}${skipped ? `, пропущено ${skipped} дублей` : ""}`,
        );
      } else {
        toast.info("Кандидаты уже добавлены ранее");
      }
      onAdded();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось добавить");
    } finally {
      setAdding(false);
    }
  };

  const toggleHost = (host: string) => {
    setSelectedHosts((prev) => {
      const next = new Set(prev);
      if (next.has(host)) next.delete(host);
      else next.add(host);
      return next;
    });
  };

  const addQueryRow = () => setQueries((prev) => [...prev, ""]);
  const updateQuery = (i: number, value: string) =>
    setQueries((prev) => prev.map((q, idx) => (idx === i ? value : q)));
  const removeQuery = (i: number) =>
    setQueries((prev) => (prev.length === 1 ? [""] : prev.filter((_, idx) => idx !== i)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Найти конкурентов автоматически
          </DialogTitle>
          <DialogDescription>
            AI ищет реальных конкурентов через Google. Сначала выберите режимы и нажмите «Искать» — затем
            отметите подходящих кандидатов галочками.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Выбор режимов */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="mode-context"
                checked={modes.context}
                onCheckedChange={(v) => setModes((m) => ({ ...m, context: v === true }))}
              />
              <div className="grid gap-0.5">
                <Label htmlFor="mode-context" className="font-medium cursor-pointer">
                  По описанию проекта
                </Label>
                <span className="text-xs text-muted-foreground">
                  AI читает контекст проекта и ищет компании с похожим продуктом и ICP.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="mode-lookalike"
                checked={modes.lookalike}
                onCheckedChange={(v) => setModes((m) => ({ ...m, lookalike: v === true }))}
              />
              <div className="grid gap-0.5">
                <Label htmlFor="mode-lookalike" className="font-medium cursor-pointer">
                  Похожие на ваш сайт
                </Label>
                <span className="text-xs text-muted-foreground">
                  Lookalike по позиционированию. Нужен URL сайта в проекте (
                  <span className="text-foreground">Контекст → URL сайта</span>
                  ).
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="mode-queries"
                checked={modes.queries}
                onCheckedChange={(v) => setModes((m) => ({ ...m, queries: v === true }))}
              />
              <div className="grid gap-0.5 flex-1">
                <Label htmlFor="mode-queries" className="font-medium cursor-pointer">
                  По поисковым запросам клиентов
                </Label>
                <span className="text-xs text-muted-foreground mb-2">
                  До 3 запросов, как их вводят ваши клиенты в Google.
                </span>
                {modes.queries && (
                  <div className="space-y-2">
                    {queries.map((q, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={q}
                          placeholder='например: "аудит сайта"'
                          onChange={(e) => updateQuery(i, e.target.value)}
                          className="text-sm h-8"
                        />
                        {queries.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeQuery(i)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {queries.length < 3 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={addQueryRow}
                        className="text-xs"
                      >
                        + ещё запрос
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка поиска */}
          <Button
            onClick={handleSearch}
            disabled={!canSearch}
            className="w-full"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI ищет конкурентов…
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" /> Искать
              </>
            )}
          </Button>

          {/* Результаты */}
          {candidates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Найдено: <span className="font-medium text-foreground">{candidates.length}</span>.
                  {unlimited ? (
                    <> Слотов: <span className="font-medium text-foreground">без ограничений</span>.</>
                  ) : (
                    <>
                      {" "}
                      Свободных слотов на free:{" "}
                      <span className="font-medium text-foreground">{remainingSlots}</span>.
                    </>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  Выбрано: {selectedHosts.size}
                </span>
              </div>
              <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                {candidates
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((c) => {
                    const isSelected = selectedHosts.has(c.host);
                    const badge = SOURCE_BADGE[c.source];
                    return (
                      <button
                        key={c.host}
                        type="button"
                        onClick={() => toggleHost(c.host)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/40 ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isSelected} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium truncate">
                                {c.name ?? c.host}
                              </span>
                              <Badge className={`text-xs font-normal ${badge.tone}`} variant="outline">
                                {badge.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-mono">
                                {Math.round(c.confidence * 100)}%
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              {c.host}
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {c.ai_reason}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
            Отмена
          </Button>
          {candidates.length > 0 && (
            <Button
              onClick={handleAddSelected}
              disabled={
                adding ||
                selectedHosts.size === 0 ||
                (!unlimited && selectedHosts.size > remainingSlots)
              }
            >
              {adding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Добавить выбранных ({selectedHosts.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
