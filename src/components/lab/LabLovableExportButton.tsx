import { useState } from "react";
import { Copy, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildLovableDesignPrompt,
  canExportLovableDesign,
  copyLovableDesignPrompt,
  downloadLovableDesignPrompt,
  type LovableExportOptions,
} from "@/lib/lovableDesignExport";
import type { ForgePrototypeContent } from "@/lib/forge/types";

type Props = {
  templateId: string;
  content: ForgePrototypeContent | null;
  exportOptions?: LovableExportOptions;
  disabled?: boolean;
};

export function LabLovableExportButton({
  templateId,
  content,
  exportOptions = {},
  disabled,
}: Props) {
  const [working, setWorking] = useState(false);
  const canExport = canExportLovableDesign(templateId, content);

  async function runExport(mode: "copy" | "download" | "both") {
    if (!content || !canExport) {
      toast.error(
        templateId !== "full"
          ? "Экспорт для Lovable доступен только для шаблона full (18 блоков)."
          : "Сначала перегенерируйте прототип — контент пустой или устаревший.",
      );
      return;
    }

    const prompt = await buildLovableDesignPrompt(content, exportOptions);
    if (!prompt) {
      toast.error("Не удалось собрать промпт");
      return;
    }

    setWorking(true);
    try {
      const baseName = exportOptions.productName ?? content.meta?.project_name ?? "landing";

      if (mode === "download" || mode === "both") {
        downloadLovableDesignPrompt(prompt, baseName);
      }

      if (mode === "copy" || mode === "both") {
        const copied = await copyLovableDesignPrompt(prompt);
        if (copied) {
          toast.success(
            mode === "both"
              ? "Промпт скопирован и сохранён в .txt — вставьте в новый проект Lovable"
              : "Промпт для Lovable скопирован — вставьте в новый проект",
          );
        } else if (mode === "copy") {
          toast.error("Буфер обмена недоступен — скачайте .txt");
        } else {
          toast.success("Файл .txt скачан (буфер недоступен)");
        }
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={disabled || working || !canExport}
        onClick={() => runExport("copy")}
        title={
          canExport
            ? "Мастер-промпт + тексты прототипа для вставки в Lovable"
            : "Нужен full-шаблон с актуальным контентом"
        }
      >
        {working ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1" />
        )}
        Скопировать для Lovable
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={disabled || working || !canExport}
        onClick={() => runExport("download")}
        title="Скачать .txt"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        disabled={disabled || working || !canExport}
        onClick={() => runExport("both")}
      >
        <Copy className="h-3.5 w-3.5 mr-1" />
        Копия + файл
      </Button>
    </div>
  );
}
