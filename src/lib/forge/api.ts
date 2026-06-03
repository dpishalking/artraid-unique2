import { supabase } from "@/integrations/supabase/client";
import type { ForgeGenerationPromptConfig } from "./generationPrompts";
import type {
  ForgeKnowledgeBase,
  ForgeLead,
  ForgeProduct,
  ForgePrototype,
  ForgePrototypeVersion,
  ForgeReview,
  ForgeRsyaOffersResult,
  ForgeStudioPortal,
  ForgeTemplate,
} from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const bearer = data.session?.access_token ?? SUPABASE_ANON;
  return {
    Authorization: `Bearer ${bearer}`,
    apikey: SUPABASE_ANON,
    "Content-Type": "application/json",
  };
}

async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const headers = await authHeaders();
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Не удалось связаться с сервером (${name}). Обновите страницу и попробуйте снова.`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text) as { error?: string; detail?: string };
      detail = parsed.error ?? parsed.detail ?? text;
    } catch {
      /* keep raw */
    }
    if (res.status === 503 || /high demand|перегружена/i.test(detail)) {
      throw new Error(
        "Gemini временно перегружен. Подождите 1–2 минуты и повторите — система попробует резервную модель.",
      );
    }
    throw new Error(`${name}: ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}

export const forgeApi = {
  products: {
    async list(): Promise<ForgeProduct[]> {
      const { data, error } = await (supabase as any)
        .from("forge_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ForgeProduct[];
    },
    async get(id: string): Promise<ForgeProduct | null> {
      const { data, error } = await (supabase as any)
        .from("forge_products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgeProduct | null;
    },
    async create(input: {
      slug: string;
      name: string;
      description?: string | null;
    }): Promise<ForgeProduct> {
      const { data, error } = await (supabase as any)
        .from("forge_products")
        .insert({
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      await (supabase as any)
        .from("forge_knowledge_base")
        .insert({ product_id: (data as ForgeProduct).id });
      return data as ForgeProduct;
    },
    async update(
      id: string,
      patch: Partial<Pick<ForgeProduct, "name" | "description" | "status" | "generation_prompts">>,
    ): Promise<ForgeProduct> {
      const { data, error } = await (supabase as any)
        .from("forge_products")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as ForgeProduct;
    },
  },

  kb: {
    async get(productId: string): Promise<ForgeKnowledgeBase | null> {
      const { data, error } = await (supabase as any)
        .from("forge_knowledge_base")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgeKnowledgeBase | null;
    },
    async upsert(
      productId: string,
      patch: Partial<ForgeKnowledgeBase>,
    ): Promise<ForgeKnowledgeBase> {
      const { data, error } = await (supabase as any)
        .from("forge_knowledge_base")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("product_id", productId)
        .select("*")
        .single();
      if (error) throw error;
      return data as ForgeKnowledgeBase;
    },
  },

  reviews: {
    async list(productId: string, limit = 200): Promise<ForgeReview[]> {
      const { data, error } = await (supabase as any)
        .from("forge_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ForgeReview[];
    },
    async createMany(
      productId: string,
      rows: { text: string; author?: string; source?: string; rating?: number; tags?: string[] }[],
    ): Promise<number> {
      if (!rows.length) return 0;
      const payload = rows.map((r) => ({
        product_id: productId,
        text: r.text,
        author: r.author ?? null,
        source: r.source ?? null,
        rating: r.rating ?? null,
        tags: r.tags ?? [],
      }));
      const { data, error } = await (supabase as any)
        .from("forge_reviews")
        .insert(payload)
        .select("id");
      if (error) throw error;
      return (data as { id: string }[]).length;
    },
    async toggleStarred(id: string, value: boolean) {
      const { error } = await (supabase as any)
        .from("forge_reviews")
        .update({ is_starred: value })
        .eq("id", id);
      if (error) throw error;
    },
    async remove(id: string) {
      const { error } = await (supabase as any).from("forge_reviews").delete().eq("id", id);
      if (error) throw error;
    },
  },

  templates: {
    async list(): Promise<ForgeTemplate[]> {
      const { data, error } = await (supabase as any)
        .from("forge_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ForgeTemplate[];
    },
  },

  prototypes: {
    async listByProduct(productId: string): Promise<ForgePrototype[]> {
      const { data, error } = await (supabase as any)
        .from("forge_prototypes")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ForgePrototype[];
    },
    async get(id: string): Promise<ForgePrototype | null> {
      const { data, error } = await (supabase as any)
        .from("forge_prototypes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgePrototype | null;
    },
    async getBySlug(slug: string): Promise<ForgePrototype | null> {
      const { data, error } = await (supabase as any)
        .from("forge_prototypes")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgePrototype | null;
    },
    async getVersion(versionId: string): Promise<ForgePrototypeVersion | null> {
      const { data, error } = await (supabase as any)
        .from("forge_prototype_versions")
        .select("*")
        .eq("id", versionId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgePrototypeVersion | null;
    },
    async getActiveVersion(prototypeId: string): Promise<ForgePrototypeVersion | null> {
      const { data: proto, error: pErr } = await (supabase as any)
        .from("forge_prototypes")
        .select("active_version_id")
        .eq("id", prototypeId)
        .maybeSingle();
      if (pErr) throw pErr;
      const versionId = (proto as { active_version_id?: string } | null)?.active_version_id;
      if (!versionId) return null;
      const { data, error } = await (supabase as any)
        .from("forge_prototype_versions")
        .select("*")
        .eq("id", versionId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ForgePrototypeVersion | null;
    },
    async listVersions(prototypeId: string): Promise<ForgePrototypeVersion[]> {
      const { data, error } = await (supabase as any)
        .from("forge_prototype_versions")
        .select("*")
        .eq("prototype_id", prototypeId)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ForgePrototypeVersion[];
    },
    async setActiveVersion(prototypeId: string, versionId: string) {
      const { error } = await (supabase as any)
        .from("forge_prototypes")
        .update({ active_version_id: versionId })
        .eq("id", prototypeId);
      if (error) throw error;
    },
    async publish(prototypeId: string, slug: string) {
      const { error } = await (supabase as any)
        .from("forge_prototypes")
        .update({ slug, status: "published", published_at: new Date().toISOString() })
        .eq("id", prototypeId);
      if (error) throw error;
    },
    async unpublish(prototypeId: string) {
      const { error } = await (supabase as any)
        .from("forge_prototypes")
        .update({ status: "draft" })
        .eq("id", prototypeId);
      if (error) throw error;
    },
  },

  labSettings: {
    async getGenerationPrompts(): Promise<ForgeGenerationPromptConfig> {
      const { data, error } = await (supabase as any)
        .from("forge_lab_settings")
        .select("value")
        .eq("key", "generation_prompts")
        .maybeSingle();
      if (error) throw error;
      return ((data as { value?: ForgeGenerationPromptConfig } | null)?.value ??
        {}) as ForgeGenerationPromptConfig;
    },
    async setGenerationPrompts(value: ForgeGenerationPromptConfig): Promise<void> {
      const { error } = await (supabase as any)
        .from("forge_lab_settings")
        .upsert(
          { key: "generation_prompts", value, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
  },

  generate(params: {
    product_id: string;
    template_id: string;
    scenario_id?: string;
    direction_slug?: string;
    format?: string;
    name?: string;
    notes?: string;
    /** При перегенерации — id существующего прототипа (надёжнее, чем поиск по name). */
    prototype_id?: string;
    /** Новый угол: другие формулировки, не копировать прошлую версию. */
    regenerate_fresh?: boolean;
    /** Пожелание к этой генерации (угол, акцент). */
    variation_note?: string;
    /** Full-лендинг: средние блоки конструктора (hero/final_cta/micro_copy добавляются автоматически) */
    included_blocks?: string[];
    /** Clip-4: блоки per-step (hero/cta/lead_form добавляются автоматически) */
    clip_step_blocks?: Record<string, string[]>;
  }): Promise<{ prototype_id: string; version_id: string; version: number }> {
    return invokeFunction("forge-generate-prototype", params);
  },

  generateRsyaOffers(params: {
    product_id: string;
    direction_slug?: string;
    prototype_id?: string;
  }): Promise<ForgeRsyaOffersResult> {
    return invokeFunction("forge-generate-rsya-offers", params);
  },

  importReviews(params: {
    product_id: string;
    rows: { text: string; author?: string; source?: string; rating?: number }[];
    auto_tag?: boolean;
  }): Promise<{ inserted: number; tagged: number }> {
    return invokeFunction("forge-import-reviews", params);
  },

  structureKb(params: {
    product_id: string;
    product_name?: string;
    sources?: { filename: string; text: string }[];
    paste_text?: string;
    reference_sites?: { url: string; label?: string; note?: string }[];
    direction_slug?: string;
    direction_title?: string;
  }): Promise<{
    kb: ForgeKnowledgeBase;
    completion_percent: number;
    sources_added: number;
    references_added: number;
    reference_errors?: string[];
    reviews_inserted: number;
  }> {
    return invokeFunction("forge-structure-kb", params);
  },

  leads: {
    async listByPrototype(prototypeId: string): Promise<ForgeLead[]> {
      const { data, error } = await (supabase as any)
        .from("forge_leads")
        .select("*")
        .eq("prototype_id", prototypeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ForgeLead[];
    },
  },

  submitLead(params: {
    prototype_id: string;
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    source_step?: string;
    utm?: Record<string, string>;
  }): Promise<{ ok: true }> {
    return invokeFunction("forge-submit-lead", params);
  },

  studioPortals: {
    async list(productId: string): Promise<ForgeStudioPortal[]> {
      const { data, error } = await (supabase as any)
        .from("forge_studio_portals")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ForgeStudioPortal[];
    },
    async create(input: {
      product_id: string;
      title: string;
      subtitle?: string;
      allowed_templates?: string[];
      allowed_scenarios?: string[];
      max_generations_per_day?: number;
    }): Promise<ForgeStudioPortal> {
      const { data, error } = await (supabase as any)
        .from("forge_studio_portals")
        .insert({
          product_id: input.product_id,
          title: input.title,
          subtitle: input.subtitle ?? null,
          allowed_templates: input.allowed_templates ?? ["full", "clip-4"],
          allowed_scenarios: input.allowed_scenarios ?? ["cold_traffic", "hypothesis_test"],
          max_generations_per_day: input.max_generations_per_day ?? 15,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as ForgeStudioPortal;
    },
  },
};
