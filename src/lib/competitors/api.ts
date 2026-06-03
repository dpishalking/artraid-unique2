/**
 * Клиентский API для конкурентной разведки.
 *
 * Чтение идёт напрямую из Supabase под RLS пользователя; запись профилей —
 * через RLS-таблицу `competitor_profiles`; запуск анализа и сборка snapshot —
 * через edge functions (которые добавим в коммите 2).
 */

import { supabase } from "@/integrations/supabase/client";
import {
  extractHost,
  normalizeCompetitorAudit,
  normalizeCompetitorProfile,
  normalizeNicheSnapshot,
} from "./normalize";
import { edgeFunctionErrorMessage } from "./edgeFunctionError";
import type {
  CompetitorAudit,
  CompetitorCandidate,
  CompetitorProfile,
  NicheSnapshot,
} from "./types";

export async function listCompetitors(projectId: string): Promise<CompetitorProfile[]> {
  const { data, error } = await supabase
    .from("competitor_profiles")
    .select("*")
    .eq("project_id", projectId)
    .order("discovered_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeCompetitorProfile(row as Record<string, unknown>));
}

export async function getCompetitor(competitorId: string): Promise<CompetitorProfile | null> {
  const { data, error } = await supabase
    .from("competitor_profiles")
    .select("*")
    .eq("id", competitorId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeCompetitorProfile(data as Record<string, unknown>) : null;
}

/**
 * Добавляет конкурента вручную. Дублирует RLS-проверку проверкой `host` в `(project_id, host)`.
 * Возвращает существующий профиль, если совпал host.
 */
export async function addManualCompetitor(
  projectId: string,
  url: string,
  options: { name?: string; notes?: string } = {},
): Promise<{ profile: CompetitorProfile; created: boolean }> {
  const host = extractHost(url);
  if (!host) throw new Error("Невалидный URL. Проверьте адрес конкурента.");

  const trimmedUrl = url.trim();
  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

  const { data: existingRow, error: existingErr } = await supabase
    .from("competitor_profiles")
    .select("*")
    .eq("project_id", projectId)
    .eq("host", host)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existingRow) {
    return {
      profile: normalizeCompetitorProfile(existingRow as Record<string, unknown>),
      created: false,
    };
  }

  const { data, error } = await supabase
    .from("competitor_profiles")
    .insert({
      project_id: projectId,
      url: normalizedUrl,
      host,
      name: options.name?.trim() || null,
      source: "manual",
      status: "queued",
      notes: options.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return {
    profile: normalizeCompetitorProfile(data as Record<string, unknown>),
    created: true,
  };
}

/** Добавляет несколько кандидатов из discovery одной транзакцией, пропуская совпадения по host. */
export async function addDiscoveredCompetitors(
  projectId: string,
  candidates: CompetitorCandidate[],
): Promise<{ inserted: CompetitorProfile[]; skipped: number }> {
  if (candidates.length === 0) return { inserted: [], skipped: 0 };

  const { data: existing, error: existingErr } = await supabase
    .from("competitor_profiles")
    .select("host")
    .eq("project_id", projectId);

  if (existingErr) throw existingErr;
  const existingHosts = new Set(
    (existing ?? []).map((row) => String((row as { host: string }).host)),
  );

  const toInsert = candidates
    .filter((c) => c.host && !existingHosts.has(c.host))
    .map((c) => ({
      project_id: projectId,
      url: c.url,
      host: c.host,
      name: c.name,
      source: c.source,
      status: "queued",
      confidence: c.confidence,
      ai_reason: c.ai_reason,
      tags: c.preview_tags ?? [],
    }));

  if (toInsert.length === 0) {
    return { inserted: [], skipped: candidates.length };
  }

  const { data, error } = await supabase
    .from("competitor_profiles")
    .insert(toInsert)
    .select("*");

  if (error) throw error;

  return {
    inserted: (data ?? []).map((row) =>
      normalizeCompetitorProfile(row as Record<string, unknown>),
    ),
    skipped: candidates.length - toInsert.length,
  };
}

export async function archiveCompetitor(competitorId: string): Promise<void> {
  const { error } = await supabase
    .from("competitor_profiles")
    .update({ status: "archived" })
    .eq("id", competitorId);
  if (error) throw error;
}

export async function removeCompetitor(competitorId: string): Promise<void> {
  const { error } = await supabase
    .from("competitor_profiles")
    .delete()
    .eq("id", competitorId);
  if (error) throw error;
}

export async function getCompetitorAudits(
  competitorId: string,
  limit = 5,
): Promise<CompetitorAudit[]> {
  const { data, error } = await supabase
    .from("competitor_audits")
    .select("*")
    .eq("competitor_id", competitorId)
    .order("run_no", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeCompetitorAudit(row as Record<string, unknown>));
}

export async function getLatestNicheSnapshot(projectId: string): Promise<NicheSnapshot | null> {
  const { data, error } = await supabase
    .from("niche_snapshots")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeNicheSnapshot(data as Record<string, unknown>) : null;
}

/**
 * Запускает discovery конкурентов через edge fn (добавится в коммите 2).
 * Возвращает кандидатов, которых пользователь сможет отметить галочками и сохранить
 * через `addDiscoveredCompetitors`.
 */
export async function discoverCompetitors(
  projectId: string,
  modes: { context?: boolean; lookalike?: boolean; queries?: string[] },
): Promise<CompetitorCandidate[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Войдите в аккаунт");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) throw new Error("Supabase не настроен");

  const res = await fetch(`${baseUrl}/functions/v1/discover-competitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ project_id: projectId, modes }),
  });

  let json: { candidates?: CompetitorCandidate[]; error?: string } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
      json.error ||
      (await edgeFunctionErrorMessage(null, json, `Поиск не удался (HTTP ${res.status})`));
    throw new Error(msg);
  }

  if (json.error) throw new Error(json.error);
  return json.candidates ?? [];
}

/** Запуск анализа выбранных конкурентов (edge fn `analyze-competitor`, коммит 2). */
export async function analyzeCompetitor(competitorId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("analyze-competitor", {
    body: { competitor_id: competitorId },
  });
  if (error) throw error;
}

/** Построение niche snapshot для проекта (edge fn `build-niche-snapshot`). */
export async function buildNicheSnapshot(
  projectId: string,
): Promise<{ snapshot_id: string; share_id: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Войдите в аккаунт");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) throw new Error("Supabase не настроен");

  const res = await fetch(`${baseUrl}/functions/v1/build-niche-snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ project_id: projectId }),
  });

  let json: { snapshot_id?: string; share_id?: string; error?: string } = {};
  try {
    json = (await res.json()) as typeof json;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
      json.error ||
      (await edgeFunctionErrorMessage(null, json, `Сборка карты не удалась (HTTP ${res.status})`));
    throw new Error(msg);
  }

  if (json.error) throw new Error(json.error);
  if (!json.snapshot_id || !json.share_id) {
    throw new Error("Не удалось запустить сборку snapshot");
  }
  return { snapshot_id: json.snapshot_id, share_id: json.share_id };
}

export type CompetitorChangeAlert = {
  id: string;
  project_id: string;
  competitor_id: string;
  alert_type: "page_changed" | "rescan_failed";
  message: string;
  acknowledged_at: string | null;
  created_at: string;
};

export async function listCompetitorAlerts(projectId: string): Promise<CompetitorChangeAlert[]> {
  const { data, error } = await supabase
    .from("competitor_change_alerts")
    .select("*")
    .eq("project_id", projectId)
    .is("acknowledged_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as CompetitorChangeAlert[];
}

export async function acknowledgeCompetitorAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from("competitor_change_alerts")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", alertId);
  if (error) throw error;
}
