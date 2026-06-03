import { supabase } from "@/integrations/supabase/client";
import type {
  CreateProjectInput,
  Project,
  ProjectContext,
  ProjectEvent,
  ProjectWithContext,
} from "./types";
import { normalizeContext, normalizeProject, parseCompetitors } from "./normalize";

function contextFromProjectInput(
  projectId: string,
  input: CreateProjectInput,
): Record<string, unknown> {
  return {
    project_id: projectId,
    product_name: input.product_name?.trim() || null,
    product_description: input.product_description.trim(),
    target_audience: input.target_audience.trim(),
    current_offer: input.current_offer?.trim() || null,
    current_website_url: input.current_website_url?.trim() || null,
    competitors: input.competitors ?? [],
    important_notes: input.additional_context?.trim() || null,
  };
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "active")
    .order("last_activity_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeProject(row as Record<string, unknown>));
}

export async function getProjectById(projectId: string): Promise<ProjectWithContext | null> {
  const { data: projectRow, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (pErr) throw pErr;
  if (!projectRow) return null;

  const { data: ctxRow, error: cErr } = await supabase
    .from("project_contexts")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (cErr) throw cErr;

  return {
    project: normalizeProject(projectRow as Record<string, unknown>),
    context: ctxRow ? normalizeContext(ctxRow as Record<string, unknown>) : null,
  };
}

export async function createProject(input: CreateProjectInput): Promise<ProjectWithContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Войдите в аккаунт, чтобы создать проект");

  const competitors = input.competitors ?? [];

  const { data: projectRow, error: pErr } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      product_name: input.product_name?.trim() || null,
      product_description: input.product_description.trim(),
      current_website_url: input.current_website_url?.trim() || null,
      target_audience: input.target_audience.trim(),
      main_goal: input.main_goal,
      current_offer: input.current_offer?.trim() || null,
      competitors,
      additional_context: input.additional_context?.trim() || null,
      startup_mode: input.startup_mode ?? "has_business",
    })
    .select("*")
    .single();

  if (pErr) throw pErr;

  const project = normalizeProject(projectRow as Record<string, unknown>);

  const { data: ctxRow, error: cErr } = await supabase
    .from("project_contexts")
    .insert(contextFromProjectInput(project.id, input))
    .select("*")
    .single();

  if (cErr) throw cErr;

  const { error: memErr } = await supabase.from("project_memories").insert({ project_id: project.id });
  if (memErr) console.warn("project_memories insert:", memErr.message);

  await supabase.from("project_events").insert({
    project_id: project.id,
    user_id: user.id,
    event_type: "project_created",
    title: "Проект создан",
    description: project.name,
  });

  return {
    project,
    context: normalizeContext(ctxRow as Record<string, unknown>),
  };
}

export async function buildProjectContextWithAi(projectId: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) throw new Error("Supabase не настроен");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const bearer = session?.access_token ?? anonKey;

  const resp = await fetch(`${baseUrl}/functions/v1/project-context-builder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ project_id: projectId }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Не удалось построить контекст");
  }
}

export type ProjectActivitySummary = {
  hasAudit: boolean;
  hasPrototype: boolean;
  lastAuditShareId: string | null;
  prototypeCount: number;
};

export async function getProjectActivitySummary(
  projectId: string,
): Promise<ProjectActivitySummary> {
  const [eventsRes, protoRes] = await Promise.all([
    supabase
      .from("project_events")
      .select("event_type, entity_id")
      .eq("project_id", projectId)
      .in("event_type", ["audit_completed", "prototype_created"]),
    supabase
      .from("prototypes")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
  ]);

  const events = (eventsRes.data ?? []) as { event_type: string; entity_id: string | null }[];
  const auditEvent = events.find((e) => e.event_type === "audit_completed");
  const hasPrototype =
    events.some((e) => e.event_type === "prototype_created") || (protoRes.count ?? 0) > 0;

  return {
    hasAudit: Boolean(auditEvent),
    hasPrototype,
    lastAuditShareId: auditEvent?.entity_id ? String(auditEvent.entity_id) : null,
    prototypeCount: protoRes.count ?? 0,
  };
}

export async function getProjectEvents(projectId: string, limit = 20): Promise<ProjectEvent[]> {
  const { data, error } = await supabase
    .from("project_events")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      project_id: String(r.project_id),
      user_id: r.user_id ? String(r.user_id) : null,
      event_type: String(r.event_type),
      title: String(r.title),
      description: r.description ? String(r.description) : null,
      entity_type: r.entity_type ? String(r.entity_type) : null,
      entity_id: r.entity_id ? String(r.entity_id) : null,
      metadata: (r.metadata as Record<string, unknown>) ?? null,
      created_at: String(r.created_at),
    };
  });
}

export async function touchProjectActivity(projectId: string): Promise<void> {
  await supabase
    .from("projects")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", projectId);
}

/** Мягкое удаление: проект скрывается из списка, связанные данные остаются в БД. */
export async function deleteProject(projectId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Войдите в аккаунт, чтобы удалить проект");

  const { data, error } = await supabase
    .from("projects")
    .update({ status: "deleted" })
    .eq("id", projectId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Проект не найден или уже удалён");
}

export function mergeCompetitorUrls(
  url1?: string,
  url2?: string,
  url3?: string,
): import("./types").CompetitorEntry[] {
  return [url1, url2, url3]
    .map((u) => (u ?? "").trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

export { parseCompetitors };
