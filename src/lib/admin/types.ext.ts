export type AdminFinance = {
  revenue_today: number;
  revenue_7d: number;
  revenue_30d: number;
  revenue_total: number;
  payments_count: number;
  failed_payments: number;
  refunds: number;
  average_check: number;
};

export type AdminDashboardV2 = {
  generated_at: string;
  finance: AdminFinance;
  packages: { sales: Record<string, number>; catalog: unknown[]; most_popular: string };
  users: {
    total: number;
    new_7d: number;
    with_credits: number;
    without_credits: number;
    paying: number;
    blocked: number;
  };
  generations: {
    total: number;
    today: number;
    failed: number;
    credits_balance_total: number;
  };
  latest: {
    users: AdminUserRow[];
    payments: unknown[];
    generations: unknown[];
    errors: unknown[];
    zero_credit_users: AdminUserRow[];
  };
  daily: { labels: string[]; prototypes: number[]; signups: number[] };
};

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  name: string | null;
  company_name?: string | null;
  role: string;
  status: string;
  credits_balance: number;
  total_credits_purchased: number;
  total_credits_spent: number;
  total_generations: number;
  last_payment_at: string | null;
  last_generation_at: string | null;
  created_at: string;
  last_login_at?: string | null;
  source?: string | null;
};

export type AdminProvisionUserResult = {
  user_id: string;
  login: string;
  email: string;
  role: string;
  password?: string;
};

export type AdminProvisionUserInput = {
  login: string;
  password?: string;
  role?: string;
};

export type AdminPackage = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  currency: string;
  credits_amount: number;
  price_per_generation: number | null;
  savings_text: string | null;
  badge_text: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  button_text: string | null;
  features: string[];
  legal_text: string | null;
};

export type AdminPayment = {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
  provider_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  internal_note?: string | null;
};

export type AdminCreditTx = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  balance_after: number | null;
  created_at: string;
};

export type AdminGeneration = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  credits_spent: number;
  created_at: string;
  error_message?: string | null;
  model?: string | null;
  tokens_used?: number | null;
};

export type AdminPrompt = {
  id: string;
  name: string;
  type: string;
  version: number;
  is_active: boolean;
  is_test: boolean;
  uses_count: number;
  updated_at: string;
};

export type AdminAudit = {
  id: string;
  url: string;
  original_url: string | null;
  ip: string | null;
  status: string;
  error: string | null;
  created_at: string;
  prompt_version: string | null;
};

export type AdminLog = {
  id: string;
  type: string;
  message: string;
  status: string;
  severity: string;
  service?: string | null;
  created_at: string;
  user_id?: string | null;
};

export type AdminIdeaLabCardPreview = {
  idea_name?: string;
  short_description?: string;
  target_audience?: string;
  primary_offer?: string;
};

export type AdminIdeaLabSessionRow = {
  id: string;
  project_id: string;
  user_id: string;
  project_name: string;
  email: string | null;
  display_name: string | null;
  profile_source: string | null;
  startup_mode: string;
  stage: string;
  clarity_percent: number;
  user_messages: number;
  total_messages: number;
  updated_at: string;
  created_at: string;
  card_preview: AdminIdeaLabCardPreview;
  last_user_message?: string | null;
  last_assistant_message?: string | null;
};

export type AdminIdeaLabSessionDetail = AdminIdeaLabSessionRow & {
  idea_lab_state: Record<string, unknown>;
};
