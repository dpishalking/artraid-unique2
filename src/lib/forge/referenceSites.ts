export type StagedReferenceSite = {
  id: string;
  url: string;
  label: string;
  note: string;
};

export function normalizeReferenceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function emptyReferenceRow(): StagedReferenceSite {
  return { id: crypto.randomUUID(), url: "", label: "", note: "" };
}

export function referencesForApi(rows: StagedReferenceSite[]) {
  return rows
    .map((r) => ({
      url: normalizeReferenceUrl(r.url),
      label: r.label.trim() || undefined,
      note: r.note.trim() || undefined,
    }))
    .filter((r) => r.url.length > 0);
}
