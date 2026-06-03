import type {
  ForgeLabChatLoadResponse,
  ForgeLabChatRole,
  ForgeLabChatSendResponse,
} from "./chatTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function authHeaders() {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const bearer = data.session?.access_token ?? SUPABASE_ANON;
  return {
    Authorization: `Bearer ${bearer}`,
    apikey: SUPABASE_ANON,
    "Content-Type": "application/json",
  };
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/forge-lab-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data.error === "string" ? data.error : `chat ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const forgeChatApi = {
  load(prototypeId: string): Promise<ForgeLabChatLoadResponse> {
    return invoke({ action: "load", prototype_id: prototypeId });
  },

  send(params: {
    product_id: string;
    prototype_id: string;
    message: string;
    role: ForgeLabChatRole;
    focus_block?: string;
  }): Promise<ForgeLabChatSendResponse> {
    return invoke({ action: "send", ...params });
  },

  clear(prototypeId: string): Promise<{ ok: boolean; messages_remaining: number }> {
    return invoke({ action: "clear", prototype_id: prototypeId });
  },
};
