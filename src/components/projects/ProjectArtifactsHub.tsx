import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Circle, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ARTIFACT_CATEGORIES,
  DEFAULT_ARTIFACT_SELECTION,
  PROJECT_ARTIFACTS,
  type ArtifactCategoryId,
  type ProjectArtifact,
} from "@/lib/projects/artifactCatalog";

type Props = {
  projectId: string;
  projectName?: string;
  memoryPercent?: number;
  preview?: boolean;
};

export function ProjectArtifactsHub({
  projectId,
  projectName,
  memoryPercent,
  preview = true,
}: Props) {
  const nav = useNavigate();
  const [category, setCategory] = useState<ArtifactCategoryId>("core");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_ARTIFACT_SELECTION),
  );

  const visible = useMemo(
    () => PROJECT_ARTIFACTS.filter((a) => a.category === category),
    [category],
  );

  const selectedList = useMemo(
    () => PROJECT_ARTIFACTS.filter((a) => selected.has(a.id)),
    [selected],
  );

  const toggle = (artifact: ProjectArtifact) => {
    if (artifact.required) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(artifact.id)) next.delete(artifact.id);
      else next.add(artifact.id);
      return next;
    });
  };

  const handleNext = () => {
    if (selectedList.length === 0) {
      toast.error("Выберите хотя бы один артефакт");
      return;
    }
    if (preview) {
      toast.success(`Превью: выбрано ${selectedList.length} — дальше откроется первый инструмент`);
    }
    const first = selectedList[0];
    if (first) nav(first.href(projectId));
  };

  return (
    <div className="space-y-6">
      {preview && (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-primary">Превью концепции</span> — так может выглядеть
          экран «что собрать из проекта». Пока только макет, без сохранения выбора.
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.07] shadow-[0_24px_80px_-40px_hsl(var(--primary)/0.45)]"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-money/10 blur-3xl" />

        <div className="relative border-b border-border/60 px-5 py-4 md:px-8 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-2"
              onClick={() => nav(`/projects/${projectId}`)}
            >
              <X className="h-4 w-4 mr-1.5" />
              Закрыть
            </Button>
            <div className="flex-1 min-w-0 text-center px-2">
              <h1 className="font-display text-lg md:text-xl font-bold text-foreground">
                Выберите артефакты проекта
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 max-w-lg mx-auto">
                {projectName
                  ? `«${projectName}» — соберите только то, что нужно сейчас`
                  : "Соберите только то, что нужно для текущего запуска"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-gradient-money text-primary-foreground font-semibold shadow-glow shrink-0"
              onClick={handleNext}
            >
              Следующий
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>

        <div className="relative px-5 py-4 md:px-8 border-b border-border/40">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {ARTIFACT_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              const count = PROJECT_ARTIFACTS.filter((a) => a.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all",
                    active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/80 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center",
                      active ? "border-primary" : "border-muted-foreground/50",
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  {cat.label}
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative p-5 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((artifact) => {
                const isSelected = selected.has(artifact.id);
                const Icon = artifact.icon;
                const memoryLow =
                  artifact.id === "memory" &&
                  typeof memoryPercent === "number" &&
                  memoryPercent < 40;

                return (
                  <button
                    key={artifact.id}
                    type="button"
                    onClick={() => toggle(artifact)}
                    disabled={artifact.required}
                    className={cn(
                      "group relative text-left rounded-2xl border p-5 transition-all duration-200",
                      "bg-background/50 hover:bg-background/80",
                      isSelected
                        ? "border-primary/50 ring-1 ring-primary/25 shadow-[0_8px_32px_-16px_hsl(var(--primary)/0.35)]"
                        : "border-border/70 hover:border-primary/25",
                      artifact.required && "cursor-default",
                    )}
                  >
                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                      )}
                    </div>

                    {artifact.required && (
                      <Badge className="mb-3 bg-primary/20 text-primary border-primary/30 text-[10px]">
                        Необходимый
                      </Badge>
                    )}

                    <div
                      className={cn(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-xl",
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="font-display font-bold text-base pr-8">{artifact.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {artifact.description}
                    </p>

                    {memoryLow && artifact.readyHint && (
                      <p className="text-[10px] text-warning mt-2 leading-snug">{artifact.readyHint}</p>
                    )}

                    {isSelected && !artifact.required && (
                      <Link
                        to={artifact.href(projectId)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-primary mt-3 hover:underline"
                      >
                        Открыть сейчас
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative border-t border-border/40 px-5 py-4 md:px-8 flex flex-wrap items-center justify-between gap-3 bg-background/30">
          <p className="text-xs text-muted-foreground">
            Выбрано:{" "}
            <span className="text-foreground font-medium">{selectedList.length}</span>
            {selectedList.length > 0 && (
              <span className="hidden sm:inline">
                {" "}
                — {selectedList.map((a) => a.title).join(", ")}
              </span>
            )}
          </p>
          <Button
            type="button"
            className="bg-gradient-money text-primary-foreground font-semibold shadow-glow"
            onClick={handleNext}
          >
            Собрать выбранное
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
