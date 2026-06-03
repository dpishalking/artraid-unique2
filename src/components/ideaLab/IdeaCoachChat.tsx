import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  FlaskConical,
  ChevronRight,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CoachProposal, IdeaLabCoachRole, IdeaLabMessage, IdeaLabServiceHandoff } from "@/lib/ideaLab/types";
import { formatProposalPick } from "@/lib/ideaLab/state";
import { buildIdeaLabServiceUrl, resolveDisplayHandoff } from "@/lib/ideaLab/handoff";
import { roleBadgeLabel } from "@/components/ideaLab/IdeaLabRolePicker";
import type { IdeaLabCard, IdeaLabStageId } from "@/lib/ideaLab/types";

const TURN_MODE_LABEL: Record<string, string> = {
  explore: "Вопрос",
  clarify: "Уточнение",
  summarize: "Итог этапа",
  handoff: "Ясность собрана",
};

type Props = {
  messages: IdeaLabMessage[];
  loading: boolean;
  stageTitle?: string;
  onSend: (text: string) => void;
  disabled?: boolean;
  projectId?: string;
  isDemo?: boolean;
  coachRole?: IdeaLabCoachRole;
  stage?: IdeaLabStageId;
  clarityPercent?: number;
  card?: IdeaLabCard;
};

function ServiceHandoffCard({
  handoff,
  projectId,
  isDemo,
}: {
  handoff: IdeaLabServiceHandoff;
  projectId?: string;
  isDemo?: boolean;
}) {
  const href = buildIdeaLabServiceUrl(handoff, projectId);

  return (
    <div className="rounded-xl border-2 border-primary/35 bg-gradient-to-br from-primary/15 to-primary/5 p-3 space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Следующий шаг в сервисе</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{handoff.reason}</p>
      <Button asChild size="sm" className="w-full bg-gradient-money text-primary-foreground shadow-glow h-10">
        <a href={href}>
          <Megaphone className="h-4 w-4 mr-2" />
          {handoff.label}
          <ArrowRight className="h-3.5 w-3.5 ml-auto" />
        </a>
      </Button>
      {isDemo && !projectId && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          В демо бриф вводится вручную. Сохраните диалог в проект — контекст подставится сам.
        </p>
      )}
    </div>
  );
}

function ProposalCard({
  index,
  proposal,
  onPick,
  disabled,
}: {
  index: number;
  proposal: CoachProposal;
  onPick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-xl border border-border/80 bg-background/60 p-3 transition-all",
        "hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50 disabled:pointer-events-none",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-foreground">
          {index}. {proposal.title}
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        <span className="text-foreground/80">Кому:</span> {proposal.for_who}
      </p>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
        <span className="text-foreground/80">Обещание:</span> {proposal.promise}
      </p>
      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
        <span className="text-foreground/80">Формат:</span> {proposal.format}
      </p>
      <p className="text-[10px] text-primary mt-2 font-medium">Выбрать этот вариант →</p>
    </button>
  );
}

function CoachExtras({
  message,
  onPickProposal,
  disabled,
  projectId,
  isDemo,
  stage,
  clarityPercent,
  card,
  prevUserText,
}: {
  message: IdeaLabMessage;
  onPickProposal: (text: string) => void;
  disabled?: boolean;
  projectId?: string;
  isDemo?: boolean;
  stage?: IdeaLabStageId;
  clarityPercent?: number;
  card?: IdeaLabCard;
  prevUserText?: string;
}) {
  const coach = message.coach;
  const handoff = resolveDisplayHandoff(
    coach,
    message.content,
    prevUserText ?? "",
    stage ?? "idea",
    clarityPercent ?? 0,
    card ?? {},
  );

  if (!coach && !handoff) return null;

  return (
    <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
      {handoff && (
        <ServiceHandoffCard handoff={handoff} projectId={projectId} isDemo={isDemo} />
      )}

      {coach?.insight && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Инсайт
          </p>
          <p className="text-xs leading-relaxed text-foreground/90">{coach.insight}</p>
        </div>
      )}

      {coach?.interim_summary && (
        <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-2">
          {coach.interim_summary}
        </p>
      )}

      {coach?.assumptions && coach.assumptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coach.assumptions.map((a) => (
            <Badge
              key={a}
              variant="outline"
              className="text-[10px] font-normal border-dashed text-muted-foreground"
            >
              Гипотеза: {a}
            </Badge>
          ))}
        </div>
      )}

      {coach?.proposals && coach.proposals.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Варианты на выбор
          </p>
          {coach.proposals.map((p, idx) => (
            <ProposalCard
              key={`${p.title}-${idx}`}
              index={idx + 1}
              proposal={p}
              onPick={() => onPickProposal(formatProposalPick(p))}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function IdeaCoachChat({
  messages,
  loading,
  stageTitle,
  onSend,
  disabled,
  projectId,
  isDemo,
  coachRole = "coach",
  stage,
  clarityPercent,
  card,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    const t = input.trim();
    if (!t || loading || disabled) return;
    setInput("");
    onSend(t);
  };

  const pickProposal = (text: string) => {
    if (loading || disabled) return;
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full min-h-[420px] rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-muted/30">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Наставник · {roleBadgeLabel(coachRole)}</p>
          {stageTitle && <p className="text-xs text-muted-foreground">{stageTitle}</p>}
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:inline-flex gap-1">
          <FlaskConical className="h-3 w-3" />
          {roleBadgeLabel(coachRole)}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Напишите, что хотите создать — даже если пока неясно. Наставник задаст короткие
            уточняющие вопросы и поможет собрать структуру.
          </p>
        )}
        {messages.map((m, i) => {
          const prevUser =
            m.role === "assistant"
              ? [...messages.slice(0, i)].reverse().find((x) => x.role === "user")?.content
              : undefined;
          return (
            <div
              key={i}
              className={cn(
                "max-w-[96%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted/60 border border-border/60",
              )}
            >
              {m.role === "assistant" && m.coach?.turn_mode && (
                <Badge variant="outline" className="mb-2 text-[10px] font-normal">
                  {TURN_MODE_LABEL[m.coach.turn_mode] ?? m.coach.turn_mode}
                </Badge>
              )}
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && (
                <CoachExtras
                  message={m}
                  onPickProposal={pickProposal}
                  disabled={disabled || loading}
                  projectId={projectId}
                  isDemo={isDemo}
                  stage={stage}
                  clarityPercent={clarityPercent}
                  card={card}
                  prevUserText={prevUser}
                />
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Думаю над следующим вопросом…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 bg-background/80">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ваш ответ или уточнение к варианту…"
            rows={2}
            className="resize-none min-h-[52px] text-sm"
            disabled={loading || disabled}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0 h-[52px] w-12 bg-gradient-money text-primary-foreground"
            onClick={submit}
            disabled={loading || disabled || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
