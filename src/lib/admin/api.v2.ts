import { supabase } from "@/integrations/supabase/client";
import { fetchAdminDashboard } from "./api";
import { mapLegacyDashboard, mapLegacyUsers } from "./legacyMap";
import type { AdminDashboardV2, AdminPackage } from "./types.ext";

async function adminHeaders(legacyToken?: string): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${bearer}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (legacyToken) headers["x-admin-token"] = legacyToken;
  return headers;
}

/** V2 admin actions live only on admin-api; get-admin-dashboard is legacy (no action routing). */
async function adminCall<T>(
  action: string,
  payload: Record<string, unknown> = {},
  legacyToken?: string,
): Promise<T> {
  const body = JSON.stringify({ action, ...payload });
  const headers = await adminHeaders(legacyToken);

  try {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
      method: "POST",
      headers,
      body,
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok && !data?.error) return data as T;
    const msg = typeof data?.error === "string" ? data.error : `HTTP ${resp.status}`;
    throw new Error(msg);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Failed to fetch");
  }
}

function isDashboardV2(data: unknown): data is AdminDashboardV2 {
  return !!data && typeof data === "object" && "finance" in data;
}

export const adminApi = {
  dashboard: async (legacyToken?: string): Promise<AdminDashboardV2> => {
    try {
      const data = await adminCall<AdminDashboardV2>("dashboard", {}, legacyToken);
      if (isDashboardV2(data)) return data;
    } catch {
      /* fall through to legacy */
    }
    const legacy = await fetchAdminDashboard(legacyToken);
    return mapLegacyDashboard(legacy);
  },

  users: {
    list: async (filters: Record<string, unknown> = {}, legacyToken?: string) => {
      try {
        return await adminCall<{ users: import("./types.ext").AdminUserRow[] }>("users.list", filters, legacyToken);
      } catch {
        const legacy = await fetchAdminDashboard(legacyToken);
        let users = mapLegacyUsers(legacy);
        const q = String(filters.q ?? "").toLowerCase();
        if (q) {
          users = users.filter(
            (u) => (u.email ?? "").toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q),
          );
        }
        return { users };
      }
    },
    get: (userId: string, legacyToken?: string) =>
      adminCall<Record<string, unknown>>("users.get", { user_id: userId }, legacyToken),
    update: (userId: string, data: Record<string, unknown>, legacyToken?: string) =>
      adminCall("users.update", { user_id: userId, ...data }, legacyToken),
    provision: (payload: import("./types.ext").AdminProvisionUserInput, legacyToken?: string) =>
      adminCall<import("./types.ext").AdminProvisionUserResult>("users.provision", payload, legacyToken),
  },

  credits: {
    list: (legacyToken?: string) =>
      adminCall<{ transactions: import("./types.ext").AdminCreditTx[] }>("credits.list", {}, legacyToken),
    adjust: (userId: string, amount: number, description: string, legacyToken?: string) =>
      adminCall("credits.adjust", { user_id: userId, amount, description }, legacyToken),
  },

  packages: {
    list: async (legacyToken?: string) => {
      try {
        return await adminCall<{ packages: AdminPackage[] }>("packages.list", {}, legacyToken);
      } catch {
        const { data, error } = await supabase.from("packages").select("*").order("sort_order");
        if (error) throw error;
        return {
          packages: (data ?? []).map((p) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          })) as AdminPackage[],
        };
      }
    },
    update: (id: string, data: Partial<AdminPackage>, legacyToken?: string) =>
      adminCall("packages.update", { id, data }, legacyToken),
  },

  payments: {
    list: (legacyToken?: string) =>
      adminCall<{ payments: import("./types.ext").AdminPayment[] }>("payments.list", {}, legacyToken),
    get: (id: string, legacyToken?: string) =>
      adminCall<{ payment: import("./types.ext").AdminPayment }>("payments.get", { id }, legacyToken),
    create: (payload: Record<string, unknown>, legacyToken?: string) =>
      adminCall("payments.create", payload, legacyToken),
    markPaid: (paymentId: string, legacyToken?: string) =>
      adminCall("payments.mark_paid", { payment_id: paymentId }, legacyToken),
    markRefunded: (paymentId: string, legacyToken?: string) =>
      adminCall("payments.mark_refunded", { payment_id: paymentId }, legacyToken),
    markFailed: (paymentId: string, legacyToken?: string) =>
      adminCall("payments.mark_failed", { payment_id: paymentId }, legacyToken),
  },

  generations: {
    list: async (legacyToken?: string) => {
      try {
        return await adminCall<{ generations: import("./types.ext").AdminGeneration[] }>(
          "generations.list",
          {},
          legacyToken,
        );
      } catch {
        const legacy = await fetchAdminDashboard(legacyToken);
        return {
          generations: legacy.recent_prototypes.map((p) => ({
            id: p.id,
            user_id: p.user_id,
            type: "full_landing_prototype",
            status: p.status === "ready" ? "success" : p.status === "error" ? "failed" : "processing",
            credits_spent: 1,
            created_at: p.created_at,
            error_message: p.error,
          })),
        };
      }
    },
    get: (id: string, legacyToken?: string) =>
      adminCall<{ generation: Record<string, unknown> }>("generations.get", { id }, legacyToken),
    refundCredit: (userId: string, description: string, legacyToken?: string) =>
      adminCall("generations.refund_credit", { user_id: userId, description }, legacyToken),
  },

  prompts: {
    list: (legacyToken?: string) =>
      adminCall<{ prompts: import("./types.ext").AdminPrompt[] }>("prompts.list", {}, legacyToken),
    createVersion: (promptId: string, data: Record<string, unknown>, legacyToken?: string) =>
      adminCall("prompts.create_version", { prompt_id: promptId, ...data }, legacyToken),
    setActive: (promptId: string, legacyToken?: string) =>
      adminCall("prompts.set_active", { prompt_id: promptId }, legacyToken),
  },

  audits: {
    list: (filters: { q?: string; status?: string; limit?: number } = {}, legacyToken?: string) =>
      adminCall<{ audits: import("./types.ext").AdminAudit[] }>("audits.list", filters, legacyToken),
  },

  ideaLab: {
    list: (
      filters: { q?: string; startup_mode?: string; min_clarity?: number; limit?: number } = {},
      legacyToken?: string,
    ) =>
      adminCall<{ sessions: import("./types.ext").AdminIdeaLabSessionRow[] }>(
        "idea_lab.list",
        filters,
        legacyToken,
      ),
    get: (projectId: string, legacyToken?: string) =>
      adminCall<{ session: import("./types.ext").AdminIdeaLabSessionDetail }>(
        "idea_lab.get",
        { project_id: projectId },
        legacyToken,
      ),
  },

  logs: {
    list: (legacyToken?: string) =>
      adminCall<{ logs: import("./types.ext").AdminLog[] }>("logs.list", {}, legacyToken),
    update: (id: string, data: { status?: string; severity?: string }, legacyToken?: string) =>
      adminCall("logs.update", { id, ...data }, legacyToken),
  },

  notes: {
    create: (userId: string, note: string, legacyToken?: string) =>
      adminCall("notes.create", { user_id: userId, note }, legacyToken),
  },
};
