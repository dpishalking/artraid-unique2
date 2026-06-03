import type { ComparisonTableArtifact } from "./types";

const LEGACY_GROUPS = /^(ФРЕЙМВОРКИ|HORMOZI|РЫНОК|ДОВЕРИЕ)$/i;
const LEGACY_ROW_IDS = new Set([
  "hormozi",
  "meclabs",
  "eisenberg",
  "storybrand",
  "dream",
  "belief",
  "speed",
  "ease",
  "awareness",
  "sophistication",
  "promise",
  "trust_coverage",
  "proof",
]);

/** Снимок собран до шаблона PDF (15 показателей Hormozi/MECLABS). */
export function isStaleComparisonTable(
  table: ComparisonTableArtifact | undefined | null,
): boolean {
  if (!table?.rows?.length) return false;
  if (table.template === "competitive_intel_pdf") return false;
  if (table.rows.some((r) => LEGACY_GROUPS.test(r.group))) return true;
  if (table.rows.some((r) => LEGACY_ROW_IDS.has(r.id))) return true;
  return table.indicator_count === 15;
}

export function isIntelComparisonTable(
  table: ComparisonTableArtifact | undefined | null,
): boolean {
  return !!table?.rows?.length && !isStaleComparisonTable(table);
}
