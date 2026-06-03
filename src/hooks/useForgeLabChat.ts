import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { forgeChatApi } from "@/lib/forge/chatApi";
import type { ForgeLabChatMessage, ForgeLabChatRole } from "@/lib/forge/chatTypes";

type Options = {
  productId: string;
  prototypeId: string;
  enabled?: boolean;
};

export function useForgeLabChat({ productId, prototypeId, enabled = true }: Options) {
  const [messages, setMessages] = useState<ForgeLabChatMessage[]>([]);
  const [role, setRole] = useState<ForgeLabChatRole>("kb_curator");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [messagesRemaining, setMessagesRemaining] = useState(40);

  const load = useCallback(async () => {
    if (!prototypeId || !enabled) return;
    setInitialLoading(true);
    try {
      const data = await forgeChatApi.load(prototypeId);
      setMessages(data.messages ?? []);
      setRole(data.role ?? "kb_curator");
      setMessagesRemaining(data.messages_remaining ?? 40);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить чат");
    } finally {
      setInitialLoading(false);
    }
  }, [prototypeId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(
    async (text: string, focusBlock?: string) => {
      const message = text.trim();
      if (!message || loading) return;
      if (messagesRemaining <= 0) {
        toast.message("Лимит сообщений на сегодня — очистите диалог или вернитесь завтра");
        return;
      }

      setLoading(true);
      const optimistic: ForgeLabChatMessage = {
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await forgeChatApi.send({
          product_id: productId,
          prototype_id: prototypeId,
          message,
          role,
          focus_block: focusBlock,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.reply,
            meta: res.meta,
            created_at: new Date().toISOString(),
          },
        ]);
        setMessagesRemaining(res.messages_remaining ?? 0);
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m !== optimistic));
        toast.error(e instanceof Error ? e.message : "Ошибка чата");
      } finally {
        setLoading(false);
      }
    },
    [productId, prototypeId, role, loading, messagesRemaining],
  );

  const clear = useCallback(async () => {
    try {
      const res = await forgeChatApi.clear(prototypeId);
      setMessages([]);
      setMessagesRemaining(res.messages_remaining ?? 40);
      toast.success("Диалог очищен");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось очистить");
    }
  }, [prototypeId]);

  return {
    messages,
    role,
    setRole,
    loading,
    initialLoading,
    messagesRemaining,
    send,
    clear,
    reload: load,
  };
};
