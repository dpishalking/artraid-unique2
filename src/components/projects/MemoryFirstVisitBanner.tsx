import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_PREFIX = "mm_memory_prompt_dismissed_";

type Props = {
  projectId: string;
  completion: number;
  hasWebsite: boolean;
  briefAvailable: boolean;
  filesReadyCount: number;
  hasPendingSuggestions: boolean;
  onImportSite: () => void;
  onImportBrief: () => void;
  onImportFiles: () => void;
  onOpenVoice: () => void;
};

export function MemoryFirstVisitBanner({
  projectId,
  completion,
  hasWebsite,
  briefAvailable,
  filesReadyCount,
  hasPendingSuggestions,
  onImportSite,
  onImportBrief,
  onImportFiles,
  onOpenVoice,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (completion > 45 || hasPendingSuggestions) {
      setVisible(false);
      return;
    }
    const dismissed = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`) === "1";
    const hasAnySource = hasWebsite || briefAvailable || filesReadyCount > 0;
    setVisible(!dismissed && hasAnySource);
  }, [projectId, completion, hasWebsite, briefAvailable, filesReadyCount, hasPendingSuggestions]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, "1");
    setVisible(false);
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.08] p-4 md:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Память почти пустая — давайте заполним за вас
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Не нужно вводить всё вручную. Выберите источник — AI предложит поля, вы только подтвердите.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {hasWebsite && (
          <Button type="button" size="sm" onClick={onImportSite}>
            С сайта
          </Button>
        )}
        {briefAvailable && (
          <Button type="button" size="sm" variant="secondary" onClick={onImportBrief}>
            Из брифа
          </Button>
        )}
        {filesReadyCount > 0 && (
          <Button type="button" size="sm" variant="secondary" onClick={onImportFiles}>
            Из файлов ({filesReadyCount})
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={onOpenVoice}>
          Голосом
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
          Позже
        </Button>
      </div>
    </div>
  );
}
