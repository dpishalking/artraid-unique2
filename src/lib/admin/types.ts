export type AdminOverview = {
  users_total: number;
  users_7d: number;
  users_30d: number;
  audits_total: number;
  audits_today: number;
  audits_7d: number;
  audits_30d: number;
  prototypes_total: number;
  prototypes_today: number;
  prototypes_7d: number;
  prototypes_30d: number;
  feedback_total: number;
  feedback_avg_nps: number | null;
  feedback_thumbs_up: number;
  feedback_thumbs_down: number;
  credits_balance_sum: number;
  credits_used_sum: number;
};

export type AdminDaily = {
  labels: string[];
  audits: number[];
  prototypes: number[];
  signups: number[];
};

export type AdminUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  balance: number;
  total_used: number;
  total_purchased: number;
  prototypes_total: number;
  prototypes_ready: number;
};

export type AdminAudit = {
  id: string;
  url: string;
  original_url: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export type AdminPrototype = {
  id: string;
  user_id: string;
  status: string;
  error: string | null;
  created_at: string;
  niche: string | null;
};

export type AdminTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
};

export type AdminDashboardData = {
  generated_at: string;
  overview: AdminOverview;
  daily: AdminDaily;
  audit_status: Record<string, number>;
  prototype_status: Record<string, number>;
  top_domains: { domain: string; count: number }[];
  users: AdminUser[];
  recent_audits: AdminAudit[];
  recent_prototypes: AdminPrototype[];
  recent_transactions: AdminTransaction[];
};
