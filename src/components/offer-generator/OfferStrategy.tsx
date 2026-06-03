import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Lightbulb, Quote, Sword, Target, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OfferResult, OfferStrategy } from "@/lib/offer-generator/types";

type Props = { result: OfferResult };

const LEAD_TYPE_LABELS: Record<string, string> = {
  direct: "Direct — сразу оффер",
  "how-to": "How-to — через механизм",
  how_to: "How-to — через механизм",
  proclamation: "Proclamation — смелое утверждение",
  story: "Story — через историю",
  news: "News — открытие/новость",
  indirect: "Indirect — только про боль",
};

function leadTypeLabel(raw?: string): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return LEAD_TYPE_LABELS[key] ?? raw.trim();
}

function awarenessShort(raw?: string): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  return v;
}

function hasAnyStrategy(s?: OfferStrategy): s is OfferStrategy {
  if (!s) return false;
  return Boolean(
    s.awarenessStage ||
      typeof s.sophisticationLevel === "number" ||
      s.bigIdea ||
      s.enemy ||
      s.mechanism ||
      s.leadType ||
      (s.voicePhrases && s.voicePhrases.length > 0),
  );
}

function StrategyTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "border-primary/30 bg-primary/5"
          : "border-border/80 bg-background/40",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-sm md:text-base leading-relaxed text-foreground/90">{value}</p>
    </div>
  );
}

export function OfferStrategy({ result }: Props) {
  const [open, setOpen] = useState(true);
  const strategy = result.strategy;
  if (!hasAnyStrategy(strategy)) return null;

  const awareness = awarenessShort(strategy.awarenessStage);
  const soph =
    typeof strategy.sophisticationLevel === "number" &&
    strategy.sophisticationLevel >= 1 &&
    strategy.sophisticationLevel <= 5
      ? strategy.sophisticationLevel
      : null;
  const lead = leadTypeLabel(strategy.leadType);

  const voiceLines = (strategy.voicePhrases ?? [])
    .map((v) => (v ?? "").trim())
    .filter(Boolean);

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl md:text-2xl font-bold">Стратегия оффера</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="gap-1.5"
          aria-expanded={open}
        >
          {open ? (
            <>
              Свернуть
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Развернуть
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p className="text-xs md:text-sm text-muted-foreground mb-5">
        Как AI думал перед тем, как написать заголовок: стадия осознанности по Schwartz / Hunt, зрелость
        рынка, Big Idea, враг, уникальный механизм и голос клиента.
      </p>

      {open && (
        <div className="space-y-5">
          {(awareness || soph !== null || lead) && (
            <div className="flex flex-wrap items-center gap-2">
              {awareness && (
                <Badge variant="secondary" className="gap-1.5">
                  <Target className="h-3 w-3" />
                  Осознанность: {awareness}
                </Badge>
              )}
              {soph !== null && (
                <Badge variant="secondary" className="gap-1.5">
                  <Zap className="h-3 w-3" />
                  Зрелость рынка: {soph}/5
                </Badge>
              )}
              {lead && (
                <Badge variant="outline" className="gap-1.5">
                  Тип лида: {lead}
                </Badge>
              )}
            </div>
          )}

          {(strategy.bigIdea || strategy.enemy || strategy.mechanism) && (
            <div className="grid gap-3 md:grid-cols-3">
              {strategy.bigIdea?.trim() && (
                <StrategyTile
                  icon={Lightbulb}
                  label="Big Idea (Agora / Todd Brown)"
                  value={strategy.bigIdea.trim()}
                  accent
                />
              )}
              {strategy.enemy?.trim() && (
                <StrategyTile
                  icon={Sword}
                  label="Враг (Agora Enemy)"
                  value={strategy.enemy.trim()}
                />
              )}
              {strategy.mechanism?.trim() && (
                <StrategyTile
                  icon={Wrench}
                  label="Уникальный механизм (Schwartz · Brunson)"
                  value={strategy.mechanism.trim()}
                />
              )}
            </div>
          )}

          {voiceLines.length > 0 && (
            <div className="rounded-xl border border-border/80 bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Quote className="h-4 w-4 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Голос клиента (VOC)
                </p>
              </div>
              <ul className="space-y-2">
                {voiceLines.map((line, i) => (
                  <li
                    key={i}
                    className="text-sm md:text-base text-foreground/90 leading-relaxed pl-4 border-l-2 border-primary/40 italic"
                  >
                    «{line.replace(/^["«»']+|["«»']+$/g, "")}»
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Фразы из брифа и реальных формулировок ЦА (Joanna Wiebe · CXL Peep Laja). Используй их
                дословно в постах, email и таргете.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
