import type { AdminDashboardData } from "./types";
import type { AdminDashboardV2, AdminUserRow } from "./types.ext";

export function mapLegacyDashboard(legacy: AdminDashboardData): AdminDashboardV2 {
  const o = legacy.overview;
  return {
    generated_at: legacy.generated_at,
    finance: {
      revenue_today: 0,
      revenue_7d: 0,
      revenue_30d: 0,
      revenue_total: 0,
      payments_count: 0,
      failed_payments: 0,
      refunds: 0,
      average_check: 0,
    },
    packages: { sales: {}, catalog: [], most_popular: "growth" },
    users: {
      total: o.users_total,
      new_7d: o.users_7d,
      with_credits: legacy.users.filter((u) => u.balance > 0).length,
      without_credits: legacy.users.filter((u) => u.balance === 0).length,
      paying: legacy.users.filter((u) => u.total_purchased > 0).length,
      blocked: 0,
    },
    generations: {
      total: o.prototypes_total,
      today: o.prototypes_today,
      failed: legacy.prototype_status?.error ?? 0,
      credits_balance_total: o.credits_balance_sum,
    },
    latest: {
      users: legacy.users.slice(0, 8).map(mapLegacyUser),
      payments: [],
      generations: legacy.recent_prototypes.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        type: "full_landing_prototype",
        status: p.status === "ready" ? "success" : p.status === "error" ? "failed" : "processing",
        credits_spent: 1,
        created_at: p.created_at,
        error_message: p.error,
      })),
      errors: [],
      zero_credit_users: legacy.users.filter((u) => u.balance === 0).slice(0, 8).map(mapLegacyUser),
    },
    daily: {
      labels: legacy.daily.labels.slice(-14),
      prototypes: legacy.daily.prototypes.slice(-14),
      signups: legacy.daily.signups.slice(-14),
    },
  };
}

function mapLegacyUser(u: AdminDashboardData["users"][0]): AdminUserRow {
  return {
    user_id: u.user_id,
    email: u.email,
    name: u.display_name,
    role: "user",
    status: "active",
    credits_balance: u.balance,
    total_credits_purchased: u.total_purchased,
    total_credits_spent: u.total_used,
    total_generations: u.prototypes_total,
    last_payment_at: null,
    last_generation_at: null,
    created_at: u.created_at,
  };
}

export function mapLegacyUsers(legacy: AdminDashboardData): AdminUserRow[] {
  return legacy.users.map(mapLegacyUser);
}
