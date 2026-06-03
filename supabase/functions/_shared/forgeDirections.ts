/** Слияние общей KB и overlay направления — для edge functions. */

export type DirectionOverlay = {
  audience?: Record<string, unknown>;
  usp?: Record<string, unknown>;
  pains?: unknown[];
  voc?: string[];
  objections?: unknown[];
  proofs?: unknown[];
};

export type DirectionRow = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  kb: DirectionOverlay;
  updated_at: string;
};

export function mergeDirectionKb(base: Record<string, unknown>, overlay: DirectionOverlay): DirectionOverlay {
  return {
    audience: { ...(base.audience as object), ...(overlay.audience ?? {}) },
    usp: { ...(base.usp as object), ...(overlay.usp ?? {}) },
    pains: overlay.pains?.length ? overlay.pains : (base.pains as unknown[]),
    voc: overlay.voc?.length
      ? [...new Set([...((base.voc as string[]) ?? []), ...overlay.voc])]
      : (base.voc as string[]),
    objections: overlay.objections?.length ? overlay.objections : (base.objections as unknown[]),
    proofs: overlay.proofs?.length ? overlay.proofs : (base.proofs as unknown[]),
  };
}

export function upsertDirectionRow(
  directions: DirectionRow[],
  slug: string,
  title: string,
  kbPatch: DirectionOverlay,
): DirectionRow[] {
  const now = new Date().toISOString();
  const idx = directions.findIndex((d) => d.slug === slug);
  if (idx >= 0) {
    const prev = directions[idx];
    const next = [...directions];
    next[idx] = {
      ...prev,
      kb: mergeDirectionKb(prev.kb as Record<string, unknown>, kbPatch),
      updated_at: now,
    };
    return next;
  }
  return [
    ...directions,
    {
      id: crypto.randomUUID(),
      slug,
      title,
      kb: kbPatch,
      updated_at: now,
    },
  ];
}

export function buildEffectiveKbRow(
  kbRow: Record<string, unknown>,
  directionSlug: string | null | undefined,
): Record<string, unknown> {
  if (!directionSlug) return kbRow;
  const directions = (kbRow.directions as DirectionRow[]) ?? [];
  const dir = directions.find((d) => d.slug === directionSlug);
  if (!dir?.kb) return kbRow;

  const o = dir.kb;
  const filterTagged = <T extends { direction_slug?: string }>(items: T[] | undefined) =>
    (items ?? []).filter((x) => !x.direction_slug || x.direction_slug === directionSlug);

  return {
    ...kbRow,
    _direction_title: dir.title,
    _direction_slug: directionSlug,
    audience: { ...(kbRow.audience as object), ...(o.audience ?? {}) },
    usp: { ...(kbRow.usp as object), ...(o.usp ?? {}) },
    pains: o.pains?.length ? o.pains : kbRow.pains,
    voc: o.voc?.length ? o.voc : kbRow.voc,
    objections: o.objections?.length ? o.objections : kbRow.objections,
    proofs: o.proofs?.length ? o.proofs : kbRow.proofs,
    source_documents: [
      ...filterTagged(kbRow.source_documents as { direction_slug?: string }[] | undefined),
    ],
    reference_sites: filterTagged(kbRow.reference_sites as { direction_slug?: string }[] | undefined),
  };
}

export function structuredToDirectionOverlay(structured: Record<string, unknown>): DirectionOverlay {
  return {
    audience: structured.audience as Record<string, unknown>,
    usp: structured.usp as Record<string, unknown>,
    pains: structured.pains as unknown[],
    voc: structured.voc as string[],
    objections: structured.objections as unknown[],
    proofs: structured.proofs as unknown[],
  };
}

export function structuredToGeneralKb(structured: Record<string, unknown>): Record<string, unknown> {
  return {
    product: structured.product,
    audience: structured.audience,
    usp: structured.usp,
    pains: structured.pains,
    voc: structured.voc,
    fab_matrix: structured.fab_matrix,
    objections: structured.objections,
    proofs: structured.proofs,
    tone: structured.tone,
  };
}
