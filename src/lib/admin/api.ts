import { supabase } from "@/integrations/supabase/client";
import type { AdminDashboardData } from "./types";

async function adminAuthHeaders(legacyToken?: string): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${bearer}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  if (legacyToken) {
    headers["x-admin-token"] = legacyToken;
  }

  return headers;
}

export async function fetchAdminDashboard(legacyToken?: string): Promise<AdminDashboardData> {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-dashboard`, {
    method: "POST",
    headers: await adminAuthHeaders(legacyToken),
    body: JSON.stringify(legacyToken ? { token: legacyToken } : {}),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Не удалось загрузить дашборд");
  }
  return data as AdminDashboardData;
}

export async function fetchAnalysisLogs(legacyToken?: string) {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-analysis-logs`, {
    method: "POST",
    headers: await adminAuthHeaders(legacyToken),
    body: JSON.stringify(legacyToken ? { token: legacyToken } : {}),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(typeof data?.error === "string" ? data.error : "Ошибка загрузки");
  return data;
}

export async function fetchPrototypeLogs(legacyToken?: string) {
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-prototype-logs`, {
    method: "POST",
    headers: await adminAuthHeaders(legacyToken),
    body: JSON.stringify(legacyToken ? { token: legacyToken } : {}),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(typeof data?.error === "string" ? data.error : "Ошибка загрузки");
  return data;
}
