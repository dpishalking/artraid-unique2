/**
 * Forge Lab chat — контекстный ассистент (KB + прототип).
 * Actions: load | send | clear
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiFlashModel, geminiJsonResponse, stripGeminiUnsafeSchema } from "../_shared/gemini.ts";
import { buildEffectiveKbRow } from "../_shared/forgeDirections.ts";
import { buildForgeKbPromptSection, type ForgeKbRow } from "../_shared/forgeKbPrompt.ts";
import {
  buildForgeLabChatSystem,
  buildForgeLabChatUserPrompt,
  extractFocusBlock,
  summarizePrototypeContent,
} from "../_shared/forgeLabChatPrompt.ts";
import {
  FORGE_LAB_CHAT_ROLES,
  FORGE_LAB_CHAT_SCHEMA,
  type ForgeLabChatRole,
} from "../_shared/forgeLabChatSchema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DAILY_USER_LIMIT = 40;
const TOTAL_USER_LIMIT = 200;
const HISTORY_PAIRS = 10;

function ok(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRole(raw: unknown): ForgeLabChatRole {
  const r = String(raw ?? "kb_curator");
  return FORGE_LAB_CHAT_ROLES.includes(r as ForgeLabChatRole) ? (r as ForgeLabChatRole) : "kb_curator";
}

type ChatMessageRow = {
  role: "user" | "assistant";
  content: string;
  meta?: Record<string, unknown>;
  created_at?: string;
};

function formatHistory(messages: ChatMessageRow[]): string {
  return messages
    .slice(-HISTORY_PAIRS * 2)
    .map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`)
    .join("\n\n");
}

function startOfUtcDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function requireStaff(req: Request, admin: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) return { error: ok({ error: "auth required" }, 401) };

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: auth } = await userClient.auth.getUser();
  if (!auth?.user) return { error: ok({ error: "unauth" }, 401) };

  const { data: staffOk } = await admin.rpc("is_forge_staff", { uid: auth.user.id });
  if (!staffOk) return { error: ok({ error: "forbidden" }, 403) };

  return { user: auth.user };
}

async function loadThread(admin: ReturnType<typeof createClient>, prototypeId: string) {
  const { data: thread } = await admin
    .from("forge_chat_threads")
    .select("*")
    .eq("prototype_id", prototypeId)
    .maybeSingle();

  if (!thread) {
    return { thread: null, messages: [] as ChatMessageRow[] };
  }

  const { data: messages } = await admin
    .from("forge_chat_messages")
    .select("role, content, meta, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return { thread, messages: (messages ?? []) as ChatMessageRow[] };
}

async function countUserMessagesToday(
  admin: ReturnType<typeof createClient>,
  threadId: string,
): Promise<number> {
  const { count } = await admin
    .from("forge_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId)
    .eq("role", "user")
    .gte("created_at", startOfUtcDay());
  return count ?? 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const staff = await requireStaff(req, admin);
    if (staff.error) return staff.error;
    const user = staff.user!;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "send");

    if (action === "load") {
      const prototypeId = String(body.prototype_id ?? "");
      if (!prototypeId) return ok({ error: "prototype_id required" }, 400);

      const { thread, messages } = await loadThread(admin, prototypeId);
      const todayCount = thread ? await countUserMessagesToday(admin, thread.id) : 0;
      const totalUser = thread?.message_count ?? 0;

      return ok({
        thread_id: thread?.id ?? null,
        role: thread?.role ?? "kb_curator",
        messages,
        messages_remaining: thread
          ? Math.max(0, Math.min(DAILY_USER_LIMIT - todayCount, TOTAL_USER_LIMIT - totalUser))
          : DAILY_USER_LIMIT,
      });
    }

    if (action === "clear") {
      const prototypeId = String(body.prototype_id ?? "");
      if (!prototypeId) return ok({ error: "prototype_id required" }, 400);

      const { data: thread } = await admin
        .from("forge_chat_threads")
        .select("id")
        .eq("prototype_id", prototypeId)
        .maybeSingle();

      if (thread) {
        await admin.from("forge_chat_messages").delete().eq("thread_id", thread.id);
        await admin.from("forge_chat_threads").delete().eq("id", thread.id);
      }

      return ok({ ok: true, messages_remaining: DAILY_USER_LIMIT });
    }

    if (action !== "send") return ok({ error: "unknown action" }, 400);

    const productId = String(body.product_id ?? "");
    const prototypeId = String(body.prototype_id ?? "");
    const message = String(body.message ?? "").trim();
    const role = normalizeRole(body.role);
    const focusBlock = typeof body.focus_block === "string" ? body.focus_block : undefined;

    if (!productId || !prototypeId || !message) {
      return ok({ error: "product_id, prototype_id, message required" }, 400);
    }
    if (message.length > 2000) return ok({ error: "message too long" }, 400);

    const [{ data: proto }, { data: kbRow }, { data: reviews }] = await Promise.all([
      admin.from("forge_prototypes").select("*").eq("id", prototypeId).maybeSingle(),
      admin.from("forge_knowledge_base").select("*").eq("product_id", productId).maybeSingle(),
      admin
        .from("forge_reviews")
        .select("text,author,rating,tags,is_starred")
        .eq("product_id", productId)
        .order("is_starred", { ascending: false })
        .limit(20),
    ]);

    if (!proto || proto.product_id !== productId) {
      return ok({ error: "prototype not found" }, 404);
    }
    if (!kbRow) return ok({ error: "knowledge base not found" }, 404);

    let threadId: string;
    let existingMessages: ChatMessageRow[] = [];
    let userMsgCount = 0;

    const { data: existingThread } = await admin
      .from("forge_chat_threads")
      .select("*")
      .eq("prototype_id", prototypeId)
      .maybeSingle();

    if (existingThread) {
      threadId = existingThread.id;
      userMsgCount = existingThread.message_count ?? 0;
      const loaded = await loadThread(admin, prototypeId);
      existingMessages = loaded.messages;

      const todayCount = await countUserMessagesToday(admin, threadId);
      if (todayCount >= DAILY_USER_LIMIT || userMsgCount >= TOTAL_USER_LIMIT) {
        return ok({ error: "limit reached", messages_remaining: 0 }, 429);
      }

      await admin
        .from("forge_chat_threads")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    } else {
      const { data: created, error: createErr } = await admin
        .from("forge_chat_threads")
        .insert({
          product_id: productId,
          prototype_id: prototypeId,
          created_by: user.id,
          role,
        })
        .select("id")
        .single();
      if (createErr || !created) throw createErr ?? new Error("thread create failed");
      threadId = created.id;
    }

    const versionId = proto.active_version_id as string | null;
    let versionNumber: number | undefined;
    let content: Record<string, unknown> = {};
    let format: string | undefined;

    if (versionId) {
      const { data: ver } = await admin
        .from("forge_prototype_versions")
        .select("version, content, generation_input")
        .eq("id", versionId)
        .maybeSingle();
      if (ver) {
        versionNumber = ver.version as number;
        content = (ver.content ?? {}) as Record<string, unknown>;
        const gi = (ver.generation_input ?? {}) as Record<string, unknown>;
        if (typeof gi.format === "string") format = gi.format;
      }
    }

    const directionSlug = proto.direction_slug as string | null;
    const effectiveKb = buildEffectiveKbRow(kbRow as Record<string, unknown>, directionSlug);
    const kbSection = buildForgeKbPromptSection(effectiveKb as ForgeKbRow, reviews ?? []);
    const directionTitle = (effectiveKb as Record<string, unknown>)._direction_title as string | undefined;

    const { data: product } = await admin
      .from("forge_products")
      .select("name")
      .eq("id", productId)
      .maybeSingle();

    const system = buildForgeLabChatSystem(role);
    const userPrompt = buildForgeLabChatUserPrompt({
      productName: product?.name ?? "Продукт",
      prototypeName: proto.name as string,
      prototypeMeta: {
        status: proto.status,
        slug: proto.slug,
        format,
      },
      kbSection,
      contentSummary: summarizePrototypeContent(content),
      focusBlockJson: extractFocusBlock(content, focusBlock),
      historyText: formatHistory(existingMessages),
      message,
      versionNumber,
      directionTitle,
    });

    const temperature = role === "copy_editor" ? 0.6 : 0.4;

    let parsed: Record<string, unknown> | null = null;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        parsed = (await geminiJsonResponse({
          model: geminiFlashModel(),
          systemInstruction: system,
          userParts: [{ text: userPrompt }],
          responseSchema: stripGeminiUnsafeSchema(FORGE_LAB_CHAT_SCHEMA) as Record<string, unknown>,
          temperature,
          maxOutputTokens: 2048,
        })) as Record<string, unknown>;
        break;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        console.warn("forge-lab-chat attempt", attempt + 1, lastErr.message);
      }
    }
    if (!parsed) throw lastErr ?? new Error("chat response failed");

    const reply = String(parsed.reply ?? "Не удалось сформировать ответ. Уточните вопрос.").slice(0, 2000);
    const assistantMeta: Record<string, unknown> = {
      turn_mode: parsed.turn_mode ?? "answer",
      kb_gaps: parsed.kb_gaps ?? [],
      block_refs: parsed.block_refs ?? [],
      cliches_found: parsed.cliches_found ?? parsed.clichés_found ?? [],
      suggested_actions: parsed.suggested_actions ?? [],
      ab_idea: parsed.ab_idea ?? null,
      role,
    };

    await admin.from("forge_chat_messages").insert([
      { thread_id: threadId, role: "user", content: message, meta: { focus_block: focusBlock ?? null } },
      { thread_id: threadId, role: "assistant", content: reply, meta: assistantMeta },
    ]);

    const newUserCount = userMsgCount + 1;
    await admin
      .from("forge_chat_threads")
      .update({ message_count: newUserCount, role, updated_at: new Date().toISOString() })
      .eq("id", threadId);

    const todayAfter = await countUserMessagesToday(admin, threadId);
    const remaining = Math.max(
      0,
      Math.min(DAILY_USER_LIMIT - todayAfter, TOTAL_USER_LIMIT - newUserCount),
    );

    return ok({
      reply,
      role,
      meta: assistantMeta,
      thread_id: threadId,
      messages_remaining: remaining,
    });
  } catch (e) {
    console.error("forge-lab-chat", e);
    return ok({ error: e instanceof Error ? e.message : "chat error" }, 502);
  }
});
