import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { useForgeLabChat } from "@/hooks/useForgeLabChat";
import {
  FORGE_LAB_CHAT_ROLE_LABELS,
  FORGE_LAB_QUICK_PROMPTS,
  type ForgeLabChatAssistantMeta,
  type ForgeLabChatMessage,
  type ForgeLabChatRole,
} from "@/lib/forge/chatTypes";

const TURN_MODE_LABEL: Record<string, string> = {
  answer: "Ответ",
  clarify: "Уточнение",
  checklist: "Чеклист",
  suggestion: "Предложение",
};

type ChatState = ReturnType<typeof useForgeLabChat>;

type Props = {
  chat: ChatState;
  productName: string;
  prototypeName: string;
  directionLabel?: string | null;
  versionNumber?: number;
  className?: string;
};

function AssistantExtras({ meta }: { meta?: ForgeLabChatAssistantMeta }) {
  if (!meta) return null;
  const gaps = meta.kb_gaps?.filter(Boolean) ?? [];
  const cliches = meta.cliches_found?.filter(Boolean) ?? [];
  const actions = meta.suggested_actions ?? [];
  const ab = meta.ab_idea;

  return (
    <div className="mt-3 space-y-2">
      {gaps.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
          <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Пробелы в KB</p>
          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
            {gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
      {cliches.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
          <p className="font-semibold mb-1">Клише / проблемы</p>
          <ul className="list-disc list-inside space-y-0.5">
            {cliches.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {ab?.hypothesis && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs space-y-1">
          <p className="font-semibold text-primary">Идея A/B</p>
          <p>{ab.hypothesis}</p>
          {ab.change && <p className="text-muted-foreground">Меняем: {ab.change}</p>}
          {ab.metric && <p className="text-muted-foreground">Метрика: {ab.metric}</p>}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a, i) => (
            <Badge key={i} variant="outline" className="text-[10px] font-normal">
              {a.label}
            </Badge>
          ))}
        </div>
      )}
      {meta.block_refs?.length ? (
        <p className="text-[10px] text-muted-foreground">
          Блоки: {meta.block_refs.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function MessageBubble({ message }: { message: ForgeLabChatMessage }) {
  const meta = message.meta as ForgeLabChatAssistantMeta | undefined;
  return (
    <div
      className={cn(
        "max-w-[96%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        message.role === "user"
          ? "ml-auto bg-primary text-primary-foreground"
          : "mr-auto bg-muted/60 border border-border/60",
      )}
    >
      {message.role === "assistant" && meta?.turn_mode && (
        <Badge variant="outline" className="mb-2 text-[10px] font-normal">
          {TURN_MODE_LABEL[meta.turn_mode] ?? meta.turn_mode}
        </Badge>
      )}
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.role === "assistant" && <AssistantExtras meta={meta} />}
    </div>
  );
}

export function ForgeLabChatPanel({
  chat,
  productName,
  prototypeName,
  directionLabel,
  versionNumber,
  className,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    role,
    setRole,
    loading,
    initialLoading,
    messagesRemaining,
    send,
    clear,
  } = chat;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = (text?: string, focusBlock?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput("");
    void send(t, focusBlock);
  };

  const contextLine = [
    productName,
    directionLabel ?? null,
    versionNumber ? `v${versionNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="border-b border-border px-4 py-3 bg-muted/30 space-y-2">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Ассистент Лаборатории</p>
            <p className="text-xs text-muted-foreground truncate">
              {prototypeName}
              {contextLine ? ` · ${contextLine}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => void clear()}
            title="Очистить диалог"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={(v) => setRole(v as ForgeLabChatRole)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FORGE_LAB_CHAT_ROLE_LABELS) as ForgeLabChatRole[]).map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {FORGE_LAB_CHAT_ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {messagesRemaining} msg
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[min(60vh,520px)] lg:max-h-none lg:min-h-[360px]">
        {initialLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Спросите про этот прототип или базу знаний. Факты — только из KB, без выдумок.
          </p>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} />)
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Думаю…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 bg-background/80 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {FORGE_LAB_QUICK_PROMPTS.map((q) => (
            <Button
              key={q.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] px-2"
              disabled={loading || messagesRemaining <= 0}
              onClick={() => submit(q.message, q.focus_block)}
            >
              {q.label}
            </Button>
          ))}
        </div>
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
            placeholder="Вопрос про текст, KB или тест…"
            rows={2}
            className="resize-none min-h-[52px] text-sm"
            disabled={loading || messagesRemaining <= 0}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0 h-[52px] w-12"
            onClick={() => submit()}
            disabled={loading || messagesRemaining <= 0 || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** FAB + sheet wrapper for mobile */
export function ForgeLabChatMobileEntry(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        className="lg:hidden fixed bottom-6 right-6 z-40 h-12 rounded-full shadow-lg gap-2 px-4"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-4 w-4" />
        Спросить
      </Button>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-medium text-sm">Ассистент</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          </div>
          <div className="flex-1 p-3 min-h-0">
            <ForgeLabChatPanel {...props} className="h-full max-h-none" />
          </div>
        </div>
      )}
    </>
  );
}
