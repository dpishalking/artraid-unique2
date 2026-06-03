import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import {
  extractMemoryFromFiles,
  extractMemoryFromSite,
  extractMemoryFromVoice,
  importMemoryFromBrief,
} from "@/lib/projectMemory/importMemory";

type Props = {
  projectId: string;
  defaultUrl?: string | null;
  filesReadyCount: number;
  briefAvailable: boolean;
  onImported: () => void;
  voiceOpen?: boolean;
  onVoiceOpenChange?: (open: boolean) => void;
};

type BusyKind = "site" | "files" | "brief" | "voice" | null;

function importToast(result: { created_count: number; message?: string }) {
  if (result.created_count > 0) {
    toast.success(`Найдено ${result.created_count} полей — проверьте и примените ниже`);
  } else {
    toast.message(result.message ?? "Новых полей для заполнения не найдено");
  }
}

export function MemoryImportPanel({
  projectId,
  defaultUrl,
  filesReadyCount,
  briefAvailable,
  onImported,
  voiceOpen: voiceOpenProp,
  onVoiceOpenChange,
}: Props) {
  const [url, setUrl] = useState(defaultUrl?.replace(/^https?:\/\//, "") ?? "");
  const [busy, setBusy] = useState<BusyKind>(null);
  const [voiceOpenInternal, setVoiceOpenInternal] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const voiceOpen = voiceOpenProp ?? voiceOpenInternal;
  const setVoiceOpen = onVoiceOpenChange ?? setVoiceOpenInternal;

  const { listening, supported, toggle } = useSpeechInput((text) => setVoiceText(text));

  async function run(kind: BusyKind, action: () => Promise<{ created_count: number; message?: string }>) {
    setBusy(kind);
    try {
      const result = await action();
      importToast(result);
      onImported();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось выполнить импорт");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.06] to-card">
      <CardContent className="pt-6 space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Заполнить автоматически
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            AI извлечёт данные из сайта, файлов, брифа или вашего рассказа. Вы проверите предложения и примените
            только нужное — пустые поля не перезаписываются.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">С сайта</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.ru или https://example.ru"
                className="pl-9"
                disabled={busy !== null}
              />
            </div>
            <Button
              onClick={() =>
                void run("site", () => {
                  const normalized = url.trim();
                  if (!normalized && !defaultUrl) throw new Error("Укажите адрес сайта");
                  return extractMemoryFromSite(projectId, normalized || defaultUrl || undefined);
                })
              }
              disabled={busy !== null}
              className="shrink-0"
            >
              {busy === "site" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Анализируем…
                </>
              ) : (
                "Заполнить с сайта"
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {briefAvailable && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => void run("brief", () => importMemoryFromBrief(projectId))}
            >
              {busy === "brief" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClipboardList className="mr-2 h-3.5 w-3.5" />
              )}
              Из брифа
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy !== null || filesReadyCount === 0}
            onClick={() => void run("files", () => extractMemoryFromFiles(projectId))}
          >
            {busy === "files" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-2 h-3.5 w-3.5" />
            )}
            Из файлов{filesReadyCount > 0 ? ` (${filesReadyCount})` : ""}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => setVoiceOpen(!voiceOpen)}
          >
            <Mic className="mr-2 h-3.5 w-3.5" />
            Рассказать голосом
          </Button>

          {filesReadyCount === 0 && (
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to={`/projects/${projectId}/files`}>Загрузить файлы</Link>
            </Button>
          )}
        </div>

        {voiceOpen && (
          <div className="space-y-3 rounded-xl border border-border/70 bg-background/40 p-4">
            <p className="text-xs text-muted-foreground">
              Расскажите о продукте, аудитории, оффере и отличиях — 1–3 минуты. AI разложит по полям памяти.
            </p>
            <Textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={5}
              placeholder="Мы делаем сервис для… Наша аудитория… Главная боль клиентов…"
              disabled={busy !== null}
            />
            <div className="flex flex-wrap gap-2">
              {supported && (
                <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={toggle}>
                  {listening ? (
                    <>
                      <MicOff className="mr-2 h-3.5 w-3.5" />
                      Остановить
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-3.5 w-3.5" />
                      Записать
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={busy !== null || voiceText.trim().length < 80}
                onClick={() => void run("voice", () => extractMemoryFromVoice(projectId, voiceText))}
              >
                {busy === "voice" ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Извлекаем…
                  </>
                ) : (
                  "Извлечь из рассказа"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
