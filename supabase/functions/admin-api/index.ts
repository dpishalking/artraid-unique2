import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { adminCorsHeaders, serviceHeaders, supabaseRestUrl, verifyAdminAccess } from "../_shared/adminAuth.ts";
import { canMutateAsAdmin, getAdminUserId } from "../_shared/adminRbac.ts";

type Row = Record<string, unknown>;

const cors = adminCorsHeaders();

async function restGet(path: string, headers: Record<string, string>) {
  const resp = await fetch(`${supabaseRestUrl()}${path}`, { headers });
  if (!resp.ok) throw new Error(`DB ${path}: ${resp.status}`);
  return await resp.json() as Row[];
}

async function restPatch(table: string, filter: string, body: Row, headers: Record<string, string>) {
  const resp = await fetch(`${supabaseRestUrl()}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`PATCH ${table}: ${await resp.text()}`);
  return await resp.json() as Row[];
}

async function restPost(table: string, body: Row | Row[], headers: Record<string, string>) {
  const resp = await fetch(`${supabaseRestUrl()}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`POST ${table}: ${await resp.text()}`);
  return await resp.json() as Row[];
}

async function rpc(name: string, args: Row, headers: Record<string, string>) {
  const resp = await fetch(`${supabaseRestUrl()}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!resp.ok) throw new Error(`RPC ${name}: ${await resp.text()}`);
  return await resp.json();
}

function dayKey(iso: string) { return iso.slice(0, 10); }

function lastNDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

async function handleDashboard(headers: Record<string, string>) {
  const [profiles, credits, prototypes, audits, payments, packages, generations, logs, quizProjects] = await Promise.all([
    restGet("/rest/v1/profiles?select=user_id,email,display_name,role,status,created_at,last_login_at&order=created_at.desc&limit=1000", headers),
    restGet("/rest/v1/user_credits?select=user_id,balance,total_used,total_purchased&limit=2000", headers).catch(() => []),
    restGet("/rest/v1/prototypes?select=id,user_id,status,error,created_at,brief&order=created_at.desc&limit=2000", headers),
    restGet("/rest/v1/analysis_logs?select=id,status,created_at&order=created_at.desc&limit=2000", headers),
    restGet("/rest/v1/payments?select=id,user_id,package_id,amount,status,created_at,paid_at&order=created_at.desc&limit=500", headers).catch(() => []),
    restGet("/rest/v1/packages?select=id,name,price,credits_amount,is_popular&order=sort_order", headers).catch(() => []),
    restGet("/rest/v1/generations?select=id,user_id,type,status,credits_spent,created_at,error_message&order=created_at.desc&limit=500", headers).catch(() => []),
    restGet("/rest/v1/admin_logs?select=id,type,severity,status,created_at&order=created_at.desc&limit=100", headers).catch(() => []),
    restGet(
      "/rest/v1/projects?select=id,user_id,name,created_at,quiz_completed,quiz_synced_at,quiz_memory_mapped_fields,quiz_answers_snapshot&order=created_at.desc&limit=35",
      headers,
    ).catch(() => []),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const d7 = new Date(todayStart);
  d7.setUTCDate(d7.getUTCDate() - 7);
  const d30 = new Date(todayStart);
  d30.setUTCDate(d30.getUTCDate() - 30);

  const countSince = (rows: Row[], field = "created_at") =>
    rows.filter((r) => new Date(String(r[field])).getTime() >= d7.getTime()).length;

  const paidPayments = payments.filter((p) => p.status === "paid");
  const revenueTotal = paidPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const revenue7 = paidPayments
    .filter((p) => new Date(String(p.paid_at ?? p.created_at)).getTime() >= d7.getTime())
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const revenueToday = paidPayments
    .filter((p) => dayKey(String(p.paid_at ?? p.created_at)) === dayKey(now.toISOString()))
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);

  const creditsMap = new Map(credits.map((c) => [String(c.user_id), c]));
  const usersWithCredits = credits.filter((c) => Number(c.balance) > 0).length;
  const usersZeroCredits = credits.filter((c) => Number(c.balance) === 0).length;
  const balanceSum = credits.reduce((s, c) => s + Number(c.balance ?? 0), 0);

  const packageSales: Record<string, number> = {};
  for (const p of paidPayments) {
    const id = String(p.package_id ?? "unknown");
    packageSales[id] = (packageSales[id] ?? 0) + 1;
  }

  const protoFailed = prototypes.filter((p) => p.status === "error").length;
  const genFailed = generations.filter((g) => g.status === "failed").length;

  const quizRows = quizProjects as Row[];

  const usersEnriched = profiles.slice(0, 50).map((pr) => {
    const uid = String(pr.user_id);
    const cr = creditsMap.get(uid);
    const userProtos = prototypes.filter((p) => p.user_id === uid);
    return {
      user_id: uid,
      email: pr.email ? String(pr.email) : null,
      display_name: pr.display_name ? String(pr.display_name) : null,
      role: String(pr.role ?? "user"),
      status: String(pr.status ?? "active"),
      created_at: String(pr.created_at),
      balance: Number(cr?.balance ?? 0),
      total_used: Number(cr?.total_used ?? 0),
      total_purchased: Number(cr?.total_purchased ?? 0),
      prototypes_total: userProtos.length,
    };
  });

  return {
    generated_at: now.toISOString(),
    finance: {
      revenue_today: revenueToday,
      revenue_7d: revenue7,
      revenue_30d: revenueTotal,
      revenue_total: revenueTotal,
      payments_count: paidPayments.length,
      failed_payments: payments.filter((p) => p.status === "failed").length,
      refunds: payments.filter((p) => p.status === "refunded").length,
      average_check: paidPayments.length ? Math.round(revenueTotal / paidPayments.length) : 0,
    },
    packages: {
      sales: packageSales,
      catalog: packages,
      most_popular: Object.entries(packageSales).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "growth",
    },
    users: {
      total: profiles.length,
      new_7d: countSince(profiles),
      with_credits: usersWithCredits,
      without_credits: usersZeroCredits,
      paying: new Set(paidPayments.map((p) => p.user_id)).size,
      blocked: profiles.filter((p) => p.status === "blocked").length,
    },
    generations: {
      total: prototypes.length,
      today: prototypes.filter((p) => dayKey(String(p.created_at)) === dayKey(now.toISOString())).length,
      failed: protoFailed + genFailed,
      credits_balance_total: balanceSum,
    },
    latest: {
      users: usersEnriched.slice(0, 8),
      payments: payments.slice(0, 8),
      generations: [...generations, ...prototypes.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        type: "full_landing_prototype",
        status: p.status === "ready" ? "success" : p.status === "error" ? "failed" : "processing",
        credits_spent: p.status === "ready" ? 1 : 0,
        created_at: p.created_at,
        error_message: p.error,
      }))].slice(0, 10),
      errors: logs.filter((l) => l.severity === "error" || l.severity === "critical").slice(0, 8),
      zero_credit_users: usersEnriched.filter((u) => u.balance === 0).slice(0, 8),
      quiz_onboarding_projects: quizRows
        .filter((r) => r.quiz_completed)
        .slice(0, 15)
        .map((p) => ({
          project_id: String(p.id ?? ""),
          user_id: String(p.user_id ?? ""),
          project_name: p.name ? String(p.name) : null,
          created_at: p.created_at ? String(p.created_at) : null,
          quiz_synced_at: p.quiz_synced_at ? String(p.quiz_synced_at) : null,
          fields_mapped_to_memory: Array.isArray(p.quiz_memory_mapped_fields)
            ? p.quiz_memory_mapped_fields.map(String)
            : [],
          quiz_answers: p.quiz_answers_snapshot ?? null,
        })),
    },
    daily: {
      labels: lastNDays(14),
      prototypes: lastNDays(14).map((d) =>
        prototypes.filter((p) => dayKey(String(p.created_at)) === d).length
      ),
      signups: lastNDays(14).map((d) =>
        profiles.filter((p) => dayKey(String(p.created_at)) === d).length
      ),
    },
  };
}

async function handleUsersList(headers: Record<string, string>, body: Row) {
  const q = body.q ? String(body.q).toLowerCase() : "";
  const [profiles, credits, prototypes, payments] = await Promise.all([
    restGet("/rest/v1/profiles?select=*&order=created_at.desc&limit=1000", headers),
    restGet("/rest/v1/user_credits?select=*&limit=2000", headers).catch(() => []),
    restGet("/rest/v1/prototypes?select=user_id,status,created_at&limit=5000", headers),
    restGet("/rest/v1/payments?select=user_id,status,paid_at,created_at&status=eq.paid&limit=2000", headers).catch(() => []),
  ]);

  const creditsMap = new Map(credits.map((c) => [String(c.user_id), c]));
  const lastPayment = new Map<string, string>();
  for (const p of payments) {
    const uid = String(p.user_id);
    const dt = String(p.paid_at ?? p.created_at);
    if (!lastPayment.has(uid) || dt > lastPayment.get(uid)!) lastPayment.set(uid, dt);
  }

  let rows = profiles.map((pr) => {
    const uid = String(pr.user_id);
    const cr = creditsMap.get(uid);
    const userProtos = prototypes.filter((p) => p.user_id === uid);
    const lastGen = userProtos.map((p) => String(p.created_at)).sort().reverse()[0] ?? null;
    return {
      user_id: uid,
      email: pr.email ? String(pr.email) : null,
      name: pr.display_name ? String(pr.display_name) : null,
      company_name: pr.company_name ? String(pr.company_name) : null,
      role: String(pr.role ?? "user"),
      status: String(pr.status ?? "active"),
      credits_balance: Number(cr?.balance ?? 0),
      total_credits_purchased: Number(cr?.total_purchased ?? 0),
      total_credits_spent: Number(cr?.total_used ?? 0),
      total_generations: userProtos.length,
      last_payment_at: lastPayment.get(uid) ?? null,
      last_generation_at: lastGen,
      created_at: String(pr.created_at),
      last_login_at: pr.last_login_at ? String(pr.last_login_at) : null,
      source: pr.source ? String(pr.source) : null,
    };
  });

  if (q) {
    rows = rows.filter((r) =>
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.name ?? "").toLowerCase().includes(q)
    );
  }
  if (body.role) rows = rows.filter((r) => r.role === body.role);
  if (body.status) rows = rows.filter((r) => r.status === body.status);
  if (body.with_credits === true) rows = rows.filter((r) => r.credits_balance > 0);
  if (body.without_credits === true) rows = rows.filter((r) => r.credits_balance === 0);
  if (body.paying === true) rows = rows.filter((r) => r.total_credits_purchased > 0);

  return { users: rows };
}

const IDEA_LAB_MODES = new Set(["has_idea", "find_idea", "unclear"]);

const CARD_FIELD_WEIGHTS: { key: string; weight: number }[] = [
  { key: "idea_name", weight: 8 },
  { key: "short_description", weight: 10 },
  { key: "target_audience", weight: 12 },
  { key: "main_problem", weight: 14 },
  { key: "desired_outcome", weight: 12 },
  { key: "product_format", weight: 10 },
  { key: "primary_offer", weight: 14 },
  { key: "mvp", weight: 10 },
  { key: "demand_hypotheses", weight: 10 },
  { key: "next_step", weight: 10 },
];

function cardFieldFilled(v: unknown): boolean {
  return typeof v === "string" && v.trim().length >= 3;
}

function clarityFromCard(card: Row): number {
  let score = 0;
  for (const { key, weight } of CARD_FIELD_WEIGHTS) {
    if (cardFieldFilled(card[key])) score += weight;
  }
  return Math.min(100, Math.round(score));
}

function summarizeIdeaLabState(state: unknown): {
  stage: string;
  clarity_percent: number;
  user_messages: number;
  total_messages: number;
  card_preview: Row;
  last_user_message: string | null;
  last_assistant_message: string | null;
} {
  if (!state || typeof state !== "object") {
    return {
      stage: "idea",
      clarity_percent: 0,
      user_messages: 0,
      total_messages: 0,
      card_preview: {},
      last_user_message: null,
      last_assistant_message: null,
    };
  }
  const o = state as Row;
  const messages = Array.isArray(o.messages) ? o.messages : [];
  const card = o.card && typeof o.card === "object" ? (o.card as Row) : {};
  const userMsgs = messages.filter((m) => m && typeof m === "object" && (m as Row).role === "user");
  const assistantMsgs = messages.filter((m) => m && typeof m === "object" && (m as Row).role === "assistant");
  const lastUser = userMsgs[userMsgs.length - 1] as Row | undefined;
  const lastAssistant = assistantMsgs[assistantMsgs.length - 1] as Row | undefined;
  const clarity =
    typeof o.clarityPercent === "number" ? Number(o.clarityPercent) : clarityFromCard(card);

  return {
    stage: typeof o.stage === "string" ? o.stage : "idea",
    clarity_percent: clarity,
    user_messages: userMsgs.length,
    total_messages: messages.length,
    card_preview: {
      idea_name: cardFieldFilled(card.idea_name) ? String(card.idea_name).trim() : undefined,
      short_description: cardFieldFilled(card.short_description)
        ? String(card.short_description).trim()
        : undefined,
      target_audience: cardFieldFilled(card.target_audience)
        ? String(card.target_audience).trim()
        : undefined,
      primary_offer: cardFieldFilled(card.primary_offer) ? String(card.primary_offer).trim() : undefined,
    },
    last_user_message: lastUser ? String(lastUser.content ?? "").trim() || null : null,
    last_assistant_message: lastAssistant ? String(lastAssistant.content ?? "").trim() || null : null,
  };
}

function isIdeaLabProject(project: Row): boolean {
  const mode = String(project.startup_mode ?? "");
  if (IDEA_LAB_MODES.has(mode)) return true;
  const summary = summarizeIdeaLabState(project.idea_lab_state);
  return summary.total_messages > 0;
}

function mapIdeaLabSession(project: Row, profile?: Row) {
  const summary = summarizeIdeaLabState(project.idea_lab_state);
  const projectId = String(project.id);
  return {
    id: projectId,
    project_id: projectId,
    user_id: String(project.user_id),
    project_name: String(project.name ?? "Идея"),
    email: profile?.email ? String(profile.email) : null,
    display_name: profile?.display_name ? String(profile.display_name) : null,
    profile_source: profile?.source ? String(profile.source) : null,
    startup_mode: String(project.startup_mode ?? "unclear"),
    stage: summary.stage,
    clarity_percent: summary.clarity_percent,
    user_messages: summary.user_messages,
    total_messages: summary.total_messages,
    updated_at: String(project.updated_at ?? project.created_at),
    created_at: String(project.created_at),
    card_preview: summary.card_preview,
    last_user_message: summary.last_user_message,
    last_assistant_message: summary.last_assistant_message,
  };
}

async function handleIdeaLabList(headers: Record<string, string>, body: Row) {
  const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 500);
  const projects = await restGet(
    "/rest/v1/projects?select=id,user_id,name,startup_mode,idea_lab_state,created_at,updated_at&status=eq.active&order=updated_at.desc&limit=1000",
    headers,
  ).catch(() => []);

  const ideaLabProjects = projects.filter(isIdeaLabProject);
  const userIds = [...new Set(ideaLabProjects.map((p) => String(p.user_id)))];
  let profiles: Row[] = [];
  if (userIds.length > 0) {
    profiles = await restGet(
      `/rest/v1/profiles?select=user_id,email,display_name,source&user_id=in.(${userIds.join(",")})`,
      headers,
    ).catch(() => []);
  }
  const profileMap = new Map(profiles.map((p) => [String(p.user_id), p]));

  let rows = ideaLabProjects.map((p) => mapIdeaLabSession(p, profileMap.get(String(p.user_id))));

  const q = String(body.q ?? "").trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.display_name ?? "").toLowerCase().includes(q) ||
      r.project_name.toLowerCase().includes(q) ||
      Object.values(r.card_preview).some((v) => String(v ?? "").toLowerCase().includes(q)) ||
      (r.last_user_message ?? "").toLowerCase().includes(q)
    );
  }

  const modeFilter = String(body.startup_mode ?? "").trim();
  if (modeFilter) {
    rows = rows.filter((r) => {
      if (modeFilter === "find_idea") return r.startup_mode === "find_idea" || r.startup_mode === "unclear";
      return r.startup_mode === modeFilter;
    });
  }

  const minClarity = Number(body.min_clarity);
  if (Number.isFinite(minClarity) && minClarity > 0) {
    rows = rows.filter((r) => r.clarity_percent >= minClarity);
  }

  rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  return { sessions: rows.slice(0, limit) };
}

async function handleIdeaLabGet(headers: Record<string, string>, projectId: string) {
  const rows = await restGet(
    `/rest/v1/projects?id=eq.${projectId}&select=id,user_id,name,startup_mode,idea_lab_state,created_at,updated_at&limit=1`,
    headers,
  ).catch(() => []);
  const project = rows[0];
  if (!project || !isIdeaLabProject(project)) return { error: "not_found" };

  const profileRows = await restGet(
    `/rest/v1/profiles?user_id=eq.${project.user_id}&select=user_id,email,display_name,source&limit=1`,
    headers,
  ).catch(() => []);
  const session = mapIdeaLabSession(project, profileRows[0]);
  const state =
    project.idea_lab_state && typeof project.idea_lab_state === "object"
      ? (project.idea_lab_state as Record<string, unknown>)
      : {};

  return {
    session: {
      ...session,
      idea_lab_state: state,
    },
  };
}

async function handleUserGet(headers: Record<string, string>, userId: string) {
  const [profileRows, creditsRows, txRows, paymentsRows, protoRows, genRows, noteRows, projectRows] =
    await Promise.all([
    restGet(`/rest/v1/profiles?user_id=eq.${userId}&limit=1`, headers),
    restGet(`/rest/v1/user_credits?user_id=eq.${userId}&limit=1`, headers).catch(() => []),
    restGet(`/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=100`, headers).catch(() => []),
    restGet(`/rest/v1/payments?user_id=eq.${userId}&order=created_at.desc&limit=50`, headers).catch(() => []),
    restGet(`/rest/v1/prototypes?user_id=eq.${userId}&order=created_at.desc&limit=50`, headers),
    restGet(`/rest/v1/generations?user_id=eq.${userId}&order=created_at.desc&limit=50`, headers).catch(() => []),
    restGet(`/rest/v1/user_notes?user_id=eq.${userId}&order=created_at.desc&limit=50`, headers).catch(() => []),
    restGet(
      `/rest/v1/projects?user_id=eq.${userId}&status=eq.active&select=id,name,main_goal,created_at,packaging_score&order=created_at.desc`,
      headers,
    ).catch(() => []),
  ]);

  const pr = profileRows[0];
  if (!pr) return { error: "not_found" };

  return {
    profile: pr,
    credits: creditsRows[0] ?? null,
    transactions: txRows,
    payments: paymentsRows,
    prototypes: protoRows,
    generations: genRows,
    notes: noteRows,
    projects: projectRows,
  };
}

const PROVISION_ROLES = new Set([
  "user",
  "support",
  "analyst",
  "prompt_manager",
  "admin",
  "super_admin",
]);

function randomProvisionPassword(): string {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function resolveProvisionLogin(rawLogin: string): { login: string; email: string } {
  const login = rawLogin.trim();
  if (!login) throw new Error("Укажите логин");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    return { login, email: login.toLowerCase() };
  }

  const safe = login
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe) throw new Error("Недопустимый логин");

  return { login, email: `${safe}@login.local` };
}

async function handleUsersProvision(body: Row, headers: Record<string, string>, adminId: string | null) {
  let loginInfo: { login: string; email: string };
  try {
    loginInfo = resolveProvisionLogin(String(body.login ?? body.email ?? ""));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Укажите логин" };
  }

  const roleRaw = String(body.role ?? "user").trim();
  const role = PROVISION_ROLES.has(roleRaw) ? roleRaw : "user";
  const passwordInput = String(body.password ?? "").trim();
  if (passwordInput && passwordInput.length < 8) {
    return { error: "Пароль минимум 8 символов, или оставьте пустым для автогенерации" };
  }
  const password = passwordInput || randomProvisionPassword();
  const { login, email } = loginInfo;

  const url = supabaseRestUrl();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return { error: "Service role not configured" };

  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: login, login },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message ?? "Не удалось создать пользователя";
    if (/already registered|already exists|duplicate/i.test(msg)) {
      return { error: "Пользователь с таким логином уже существует" };
    }
    return { error: msg };
  }

  const userId = created.user.id;

  await restPatch(
    "profiles",
    `user_id=eq.${userId}`,
    {
      email,
      source: "admin_provision",
      display_name: login,
      role,
    },
    headers,
  ).catch(() => null);

  await restPost(
    "admin_actions",
    {
      admin_id: adminId,
      action_type: "user_provisioned",
      target_type: "user",
      target_id: userId,
      metadata: { login, email, role },
    },
    headers,
  ).catch(() => null);

  return {
    user_id: userId,
    login,
    email,
    role,
    password: passwordInput ? undefined : password,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const headers = serviceHeaders();
    const adminId = await getAdminUserId(req);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) as Row : {};
    const action = String(body.action ?? "dashboard");

    let result: unknown;

    switch (action) {
      case "dashboard":
        result = await handleDashboard(headers);
        break;

      case "users.list":
        result = await handleUsersList(headers, body);
        break;

      case "users.get":
        result = await handleUserGet(headers, String(body.user_id));
        break;

      case "users.update": {
        const uid = String(body.user_id);
        const patch: Row = {};
        if (body.role) patch.role = body.role;
        if (body.status) patch.status = body.status;
        if (body.display_name !== undefined) patch.display_name = body.display_name;
        if (body.company_name !== undefined) patch.company_name = body.company_name;
        result = await restPatch("profiles", `user_id=eq.${uid}`, patch, headers);
        await restPost("admin_actions", {
          admin_id: adminId,
          action_type: "user_update",
          target_type: "user",
          target_id: uid,
          metadata: patch,
        }, headers).catch(() => null);
        break;
      }

      case "users.provision": {
        if (!(await canMutateAsAdmin(req))) {
          return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
            status: 403,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        result = await handleUsersProvision(body, headers, adminId);
        break;
      }

      case "credits.list":
        result = {
          transactions: await restGet(
            "/rest/v1/credit_transactions?select=*&order=created_at.desc&limit=500",
            headers,
          ).catch(() => []),
        };
        break;

      case "credits.adjust":
        result = await rpc("admin_adjust_credits", {
          p_user_id: body.user_id,
          p_amount: body.amount,
          p_description: body.description ?? "Ручная корректировка",
          p_admin_id: adminId,
        }, headers);
        break;

      case "packages.list":
        result = { packages: await restGet("/rest/v1/packages?select=*&order=sort_order", headers).catch(() => []) };
        break;

      case "packages.update":
        result = await restPatch("packages", `id=eq.${body.id}`, body.data as Row, headers);
        break;

      case "payments.list":
        result = {
          payments: await restGet(
            "/rest/v1/payments?select=*,profiles(email)&order=created_at.desc&limit=500",
            headers,
          ).catch(() => []),
        };
        break;

      case "payments.get": {
        const rows = await restGet(`/rest/v1/payments?id=eq.${body.id}&limit=1`, headers).catch(() => []);
        result = { payment: rows[0] ?? null };
        break;
      }

      case "payments.mark_paid":
        result = await rpc("handle_successful_payment", {
          p_payment_id: body.payment_id,
          p_admin_id: adminId,
        }, headers);
        break;

      case "payments.mark_failed":
        result = await restPatch("payments", `id=eq.${body.payment_id}`, { status: "failed" }, headers);
        break;

      case "payments.mark_refunded":
        result = await restPatch("payments", `id=eq.${body.payment_id}`, { status: "refunded" }, headers);
        break;

      case "payments.create": {
        const row = await restPost("payments", {
          user_id: body.user_id,
          package_id: body.package_id,
          amount: body.amount,
          currency: body.currency ?? "RUB",
          status: "pending",
          payment_provider: body.payment_provider ?? "manual",
          metadata: body.metadata ?? {},
        }, headers);
        result = { payment: Array.isArray(row) ? row[0] : row };
        break;
      }

      case "generations.list": {
        const gens = await restGet("/rest/v1/generations?select=*&order=created_at.desc&limit=500", headers).catch(() => []);
        const loggedProtoIds = new Set(
          gens.map((g) => (g.prototype_id ? String(g.prototype_id) : "")).filter(Boolean),
        );
        const protos = await restGet(
          "/rest/v1/prototypes?select=id,user_id,status,created_at,error,brief&order=created_at.desc&limit=300",
          headers,
        );
        const legacyProtos = protos
          .filter((p) => !loggedProtoIds.has(String(p.id)))
          .map((p) => ({
            id: p.id,
            user_id: p.user_id,
            prototype_id: p.id,
            type: "full_landing_prototype",
            status: p.status === "ready" ? "success" : p.status === "error" ? "failed" : "processing",
            credits_spent: 1,
            created_at: p.created_at,
            error_message: p.error,
            input_data: p.brief,
          }));
        const merged = [...gens, ...legacyProtos].sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at))
        );
        result = { generations: merged.slice(0, 500) };
        break;
      }

      case "audits.list": {
        const limit = Math.min(Math.max(Number(body.limit) || 200, 1), 500);
        const q = String(body.q ?? "").trim().toLowerCase();
        const statusFilter = body.status ? String(body.status) : "";
        let path =
          `/rest/v1/analysis_logs?select=id,url,original_url,ip,status,error,created_at,prompt_version&order=created_at.desc&limit=${limit}`;
        if (statusFilter) path += `&status=eq.${encodeURIComponent(statusFilter)}`;
        let rows = await restGet(path, headers).catch(() => []);
        if (q) {
          rows = rows.filter((r) =>
            String(r.url ?? "").toLowerCase().includes(q) ||
            String(r.original_url ?? "").toLowerCase().includes(q) ||
            String(r.ip ?? "").includes(q) ||
            String(r.id ?? "").toLowerCase().includes(q)
          );
        }
        result = { audits: rows };
        break;
      }

      case "idea_lab.list":
        result = await handleIdeaLabList(headers, body);
        break;

      case "idea_lab.get":
        result = await handleIdeaLabGet(headers, String(body.project_id));
        break;

      case "generations.get": {
        let row = (await restGet(`/rest/v1/generations?id=eq.${body.id}&limit=1`, headers).catch(() => []))[0];
        if (!row) {
          const p = (await restGet(`/rest/v1/prototypes?id=eq.${body.id}&limit=1`, headers))[0];
          if (p) {
            row = {
              id: p.id,
              user_id: p.user_id,
              prototype_id: p.id,
              type: "full_landing_prototype",
              status: p.status === "ready" ? "success" : p.status === "error" ? "failed" : "processing",
              input_data: p.brief,
              output_data: p.content,
              error_message: p.error,
              created_at: p.created_at,
            };
          }
        }
        result = { generation: row ?? null };
        break;
      }

      case "generations.refund_credit":
        result = await rpc("admin_adjust_credits", {
          p_user_id: body.user_id,
          p_amount: 1,
          p_description: body.description ?? "Возврат генерации из админки",
          p_admin_id: adminId,
        }, headers);
        break;

      case "prompts.list":
        result = { prompts: await restGet("/rest/v1/prompts?select=*&order=type,version.desc", headers).catch(() => []) };
        break;

      case "prompts.create_version": {
        const parent = (await restGet(`/rest/v1/prompts?id=eq.${body.prompt_id}&limit=1`, headers).catch(() => []))[0];
        if (!parent) { result = { error: "not_found" }; break; }
        const sameType = await restGet(
          `/rest/v1/prompts?type=eq.${parent.type}&select=version&order=version.desc&limit=1`,
          headers,
        );
        const nextVersion = Number(sameType[0]?.version ?? 0) + 1;
        const created = await restPost("prompts", {
          name: body.name ?? `${parent.name} v${nextVersion}`,
          description: body.description ?? parent.description,
          type: parent.type,
          version: nextVersion,
          system_prompt: body.system_prompt ?? parent.system_prompt,
          user_prompt_template: body.user_prompt_template ?? parent.user_prompt_template,
          variables: body.variables ?? parent.variables,
          output_format: body.output_format ?? parent.output_format,
          is_active: false,
          is_test: Boolean(body.is_test),
        }, headers);
        result = { prompt: Array.isArray(created) ? created[0] : created };
        break;
      }

      case "prompts.set_active": {
        const target = (await restGet(`/rest/v1/prompts?id=eq.${body.prompt_id}&limit=1`, headers).catch(() => []))[0];
        if (!target) { result = { error: "not_found" }; break; }
        await restPatch("prompts", `type=eq.${target.type}`, { is_active: false }, headers);
        result = await restPatch("prompts", `id=eq.${body.prompt_id}`, { is_active: true }, headers);
        break;
      }

      case "logs.list":
        result = { logs: await restGet("/rest/v1/admin_logs?select=*&order=created_at.desc&limit=500", headers).catch(() => []) };
        break;

      case "logs.update":
        result = await restPatch("admin_logs", `id=eq.${body.id}`, {
          status: body.status,
          severity: body.severity,
        }, headers);
        break;

      case "notes.create":
        result = await restPost("user_notes", {
          user_id: body.user_id,
          admin_id: adminId,
          note: body.note,
        }, headers);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-api:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
