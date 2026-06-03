import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LabGenerationPromptsPanel } from "@/components/lab/LabGenerationPromptsPanel";

export default function LabPromptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/lab"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Все продукты
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Промпты генерации</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Глобальные дополнения к промптам full-лендинга и clip-4. Для продукта — свои правки
          на вкладке «Промпты» в карточке продукта.
        </p>
      </div>

      <LabGenerationPromptsPanel mode="global" />
    </div>
  );
}
