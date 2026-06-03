/** Предложения project_memory_updates из аудита сайта.
 *
 * В память проекта попадают только:
 * - выводы по упаковке/лендингу (websites, offer_weaknesses);
 * - формулировки «голоса клиента» с сайта (frustrations), если они явно от посетителя.
 *
 * Не маппим diagnosis.mainProblem в pains_desires — это обратная связь по сайту, не боль ЦА.
 */

type Row = Record<string, unknown>;

function str(v: unknown, maxLen = 4000): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, maxLen);
}

function auditNote(kind: string, body: string): string {
  return `[Вывод аудита · ${kind}]\n${body}`;
}

function pushRow(
  out: Row[],
  projectId: string,
  analysisLogId: string,
  section: string,
  field: string,
  value: string | null,
  noteKind: string,
): void {
  if (!value) return;
  out.push({
    project_id: projectId,
    source_type: "website_audit",
    source_id: analysisLogId,
    section,
    field,
    old_value: null,
    suggested_value: auditNote(noteKind, value),
    status: "pending",
  });
}

export function buildMemorySuggestionRowsFromAudit(
  projectId: string,
  analysisLogId: string,
  auditRaw: unknown,
): Row[] {
  const audit = (auditRaw && typeof auditRaw === "object" ? auditRaw : {}) as Record<
    string,
    unknown
  >;
  const diag = audit.diagnosis && typeof audit.diagnosis === "object"
    ? (audit.diagnosis as Record<string, unknown>)
    : {};

  const out: Row[] = [];

  const mainProblem = str(diag.mainProblem);
  const secondary = str(diag.secondaryIssue ?? diag.summaryHint ?? "");
  const landingProblem = [mainProblem, secondary && secondary !== mainProblem ? secondary : null]
    .filter(Boolean)
    .join("\n\n");
  pushRow(
    out,
    projectId,
    analysisLogId,
    "websites",
    "current_landing_problem",
    landingProblem,
    "проблема текущего лендинга",
  );

  const problems = Array.isArray(audit.problems) ? audit.problems : [];
  const weaknessLines: string[] = [];
  for (const p of problems.slice(0, 6)) {
    if (!p || typeof p !== "object") continue;
    const row = p as Record<string, unknown>;
    const title = str(row.title, 300);
    const why = str(row.whyItHurts, 600);
    if (!title) continue;
    weaknessLines.push(why ? `• ${title} — ${why}` : `• ${title}`);
  }
  if (weaknessLines.length) {
    pushRow(
      out,
      projectId,
      analysisLogId,
      "offer_positioning",
      "offer_weaknesses",
      weaknessLines.join("\n"),
      "слабые места упаковки",
    );
  }

  const mainLever = str(diag.mainLever);
  if (mainLever) {
    pushRow(
      out,
      projectId,
      analysisLogId,
      "websites",
      "current_landing_goal",
      mainLever,
      "главный рычаг роста",
    );
  }

  const customerVoices = new Set<string>();
  for (const p of problems) {
    if (!p || typeof p !== "object") continue;
    const thought = str((p as Record<string, unknown>).customerThought, 500);
    if (thought) customerVoices.add(thought);
  }
  const resistance = Array.isArray(audit.resistanceMap) ? audit.resistanceMap : [];
  for (const r of resistance.slice(0, 5)) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const thought = str(row.whatClientThinks, 500);
    const moment = str(row.moment, 120);
    if (!thought) continue;
    customerVoices.add(moment ? `${moment}: ${thought}` : thought);
  }
  if (customerVoices.size) {
    pushRow(
      out,
      projectId,
      analysisLogId,
      "pains_desires",
      "frustrations",
      [...customerVoices].slice(0, 5).map((line) => `• ${line}`).join("\n"),
      "что думает посетитель на сайте",
    );
  }

  const moneyLeak = str(diag.mainMoneyLeak);
  if (moneyLeak) {
    pushRow(
      out,
      projectId,
      analysisLogId,
      "business_metrics",
      "business_goal",
      moneyLeak,
      "где теряются заявки (оценка аудита)",
    );
  }

  return out.slice(0, 6);
}
