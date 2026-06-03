import type {
  ForgeDirection,
  ForgeKbAudience,
  ForgeKbObjection,
  ForgeKbPain,
  ForgeKbProof,
  ForgeKbUsp,
  ForgeKnowledgeBase,
  ForgeReferenceSite,
  ForgeSourceDocument,
} from "./types";

export type ForgeDirectionKbOverlay = ForgeDirection["kb"];

/** Необязательные быстрые шаблоны — только для health-продуктов; любой продукт может создать свои направления в UI. */
export const FORGE_DIRECTION_PRESETS: { slug: string; title: string; description: string }[] = [
  { slug: "edema", title: "Отёки", description: "Тяжесть ног, отёки, застой жидкости" },
  { slug: "varicose", title: "Варикоз", description: "Вены, звёздочки, тяжесть, профилактика" },
  { slug: "sleep", title: "Сон", description: "Качество сна, восстановление, беспокойные ноги ночью" },
  { slug: "joints", title: "Суставы", description: "Подвижность, дискомфорт, активность" },
  { slug: "circulation", title: "Кровообращение", description: "Общий тонус сосудов, лёгкость в ногах" },
];

export function slugifyDirection(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function mergeDirectionOverlay(
  base: ForgeDirectionKbOverlay,
  patch: ForgeDirectionKbOverlay,
): ForgeDirectionKbOverlay {
  return {
    audience: { ...(base.audience ?? {}), ...(patch.audience ?? {}) },
    usp: { ...(base.usp ?? {}), ...(patch.usp ?? {}) },
    pains: patch.pains?.length ? patch.pains : base.pains,
    voc: patch.voc?.length ? [...new Set([...(base.voc ?? []), ...patch.voc])] : base.voc,
    objections: patch.objections?.length ? patch.objections : base.objections,
    proofs: patch.proofs?.length ? patch.proofs : base.proofs,
  };
}

export function upsertDirection(
  directions: ForgeDirection[],
  input: { slug: string; title: string; description?: string; kbPatch?: ForgeDirectionKbOverlay },
): ForgeDirection[] {
  const slug = slugifyDirection(input.slug);
  if (!slug) return directions;
  const now = new Date().toISOString();
  const idx = directions.findIndex((d) => d.slug === slug);
  if (idx >= 0) {
    const prev = directions[idx];
    const next = [...directions];
    next[idx] = {
      ...prev,
      title: input.title.trim() || prev.title,
      description: input.description?.trim() || prev.description,
      kb: input.kbPatch ? mergeDirectionOverlay(prev.kb ?? {}, input.kbPatch) : prev.kb,
      updated_at: now,
    };
    return next;
  }
  return [
    ...directions,
    {
      id: crypto.randomUUID(),
      slug,
      title: input.title.trim() || slug,
      description: input.description?.trim(),
      kb: input.kbPatch ?? {},
      updated_at: now,
    },
  ];
}

export function filterSourcesForDirection(
  docs: ForgeSourceDocument[],
  directionSlug: string | null | undefined,
): ForgeSourceDocument[] {
  return docs.filter((d) => {
    const tag = (d as ForgeSourceDocument & { direction_slug?: string }).direction_slug ?? null;
    if (!directionSlug) return !tag;
    return !tag || tag === directionSlug;
  });
}

export function filterReferencesForDirection(
  refs: ForgeReferenceSite[],
  directionSlug: string | null | undefined,
): ForgeReferenceSite[] {
  return refs.filter((r) => {
    const tag = (r as ForgeReferenceSite & { direction_slug?: string }).direction_slug ?? null;
    if (!directionSlug) return !tag;
    return !tag || tag === directionSlug;
  });
}

/** Общая база + overlay направления для промпта генерации. */
export function buildEffectiveKb(
  kb: ForgeKnowledgeBase,
  directionSlug?: string | null,
): ForgeKnowledgeBase & { _direction_title?: string } {
  if (!directionSlug) return kb;
  const dir = (kb.directions ?? []).find((d) => d.slug === directionSlug);
  if (!dir) return kb;

  const overlay = dir.kb ?? {};
  return {
    ...kb,
    _direction_title: dir.title,
    audience: { ...kb.audience, ...(overlay.audience ?? {}) },
    usp: { ...kb.usp, ...(overlay.usp ?? {}) },
    pains: overlay.pains?.length ? overlay.pains : kb.pains,
    voc: overlay.voc?.length ? [...new Set([...(kb.voc ?? []), ...overlay.voc])] : kb.voc,
    objections: overlay.objections?.length ? overlay.objections : kb.objections,
    proofs: overlay.proofs?.length ? overlay.proofs : kb.proofs,
    source_documents: [
      ...filterSourcesForDirection(kb.source_documents ?? [], null),
      ...filterSourcesForDirection(kb.source_documents ?? [], directionSlug),
    ],
    reference_sites: [
      ...filterReferencesForDirection(kb.reference_sites ?? [], null),
      ...filterReferencesForDirection(kb.reference_sites ?? [], directionSlug),
    ],
  };
}

export function directionScopeLabel(slug: string | null | undefined, directions: ForgeDirection[]): string {
  if (!slug) return "Общее (весь продукт)";
  return directions.find((d) => d.slug === slug)?.title ?? slug;
}
