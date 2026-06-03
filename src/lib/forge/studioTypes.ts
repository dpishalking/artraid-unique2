import type { ClipStepBlocksConfig } from "./clipLandingBlocks";

export type ForgeStudioPortal = {
  id: string;
  token: string;
  product_id: string;
  title: string;
  subtitle: string | null;
  allowed_templates: string[];
  allowed_scenarios: string[];
  allowed_direction_slugs: string[] | null;
  allowed_formats: string[];
  max_generations_per_day: number;
  generations_today: number;
  generations_day: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type StudioPortalConfig = {
  portal: {
    title: string;
    subtitle: string | null;
    product_name: string;
  };
  templates: { id: string; title: string; description: string | null; format: string }[];
  scenarios: { id: string; title: string; description: string }[];
  directions: { slug: string; title: string }[];
  formats: { id: string; label: string }[];
  limits: { generations_remaining: number };
};

export type StudioGenerateParams = {
  token: string;
  template_id: string;
  scenario_id?: string;
  direction_slug?: string;
  format?: string;
  name: string;
  included_blocks?: string[];
  clip_step_blocks?: ClipStepBlocksConfig;
};

export type StudioGenerateResult = {
  prototype_id: string;
  version_id: string;
  version: number;
  slug?: string;
};
