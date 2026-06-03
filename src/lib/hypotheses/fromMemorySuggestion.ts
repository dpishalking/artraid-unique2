import { getMemoryFieldLabel } from "@/lib/projectMemory/sectionsNav";
import { setMemoryUpdateStatus } from "@/lib/projectMemory/api";
import { createHypothesis } from "./api";

function prettyValue(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(String).join("\n");
  if (v && typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v ?? "").trim();
}

function stripAuditPrefix(text: string): string {
  return text.replace(/^\[Вывод аудита ·[^\]]+\]\n?/i, "").trim();
}

function firstMeaningfulLine(text: string): string {
  for (const line of text.split("\n")) {
    const cleaned = line.replace(/^•\s*/, "").trim();
    if (cleaned.length >= 8) return cleaned;
  }
  return text.trim();
}

function suggestTitle(section: string, field: string, body: string): string {
  const label = getMemoryFieldLabel(section, field);
  const line = firstMeaningfulLine(stripAuditPrefix(body));
  if (line.length >= 10 && line.length <= 140) return line;
  if (line.length > 140) return `${line.slice(0, 137)}…`;
  return label || "Гипотеза из аудита";
}

function hypothesisType(section: string, field: string): string {
  if (section === "offer_positioning") return "offer";
  if (section === "pains_desires") return "research";
  if (section === "websites") return "packaging";
  return "packaging";
}

/** Перенести предложение из аудита в backlog гипотез (без записи в память). */
export async function applyMemorySuggestionAsHypothesis(row: Record<string, unknown>) {
  const projectId = String(row.project_id);
  const section = String(row.section ?? "");
  const field = String(row.field ?? "");
  const body = prettyValue(row.suggested_value);
  const cleaned = stripAuditPrefix(body);
  if (!cleaned) throw new Error("Пустое предложение");

  const fieldLabel = getMemoryFieldLabel(section, field);

  await createHypothesis({
    projectId,
    title: suggestTitle(section, field, cleaned),
    description: cleaned,
    whatToChange: fieldLabel ? `Проверить: ${fieldLabel}` : suggestTitle(section, field, cleaned),
    expectedImpact: "Рост конверсии лендинга",
    sourceType: String(row.source_type ?? "website_audit"),
    hypothesisType: hypothesisType(section, field),
    priority: "high",
    status: "new",
  });

  await setMemoryUpdateStatus(String(row.id), "rejected");
}
