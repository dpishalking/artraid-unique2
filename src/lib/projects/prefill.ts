import { getScenarioById } from "@/config/landingScenarios";
import type { OfferBrief } from "@/lib/offer-generator/types";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";
import type { Project, ProjectContext } from "./types";

/** Map project memory → offer generator brief fields. */
export function offerBriefFromProject(
  project: Project,
  context: ProjectContext | null,
): Partial<OfferBrief> {
  return {
    productDescription:
      context?.product_description?.trim() ||
      project.product_description?.trim() ||
      "",
    targetAudience:
      context?.target_audience?.trim() || project.target_audience?.trim() || "",
    painPoint: context?.main_pain?.trim() || "",
    promisedResult: context?.key_promise?.trim() || context?.main_desire?.trim() || "",
    proof: context?.key_proofs?.length ? context.key_proofs.join("; ") : "",
    objections: context?.objections?.length ? context.objections.join("; ") : "",
    customerSituation: context?.important_notes?.trim() || project.additional_context?.trim() || "",
  };
}

export type ProjectPrefillSource = {
  project: Project;
  context: ProjectContext | null;
  memory: ProjectMemorySections | null;
};

function isAuditDerived(text: string): boolean {
  return /\[Вывод аудита|\[Аудит сайта/i.test(text);
}

function safeText(value?: string | null): string {
  const s = value?.trim();
  if (!s || isAuditDerived(s)) return "";
  return s;
}

function firstNonEmpty(...values: (string | undefined | null)[]): string {
  for (const v of values) {
    const s = safeText(v);
    if (s) return s;
  }
  return "";
}

function joinBlocks(...parts: (string | undefined | null)[]): string {
  return parts.map((p) => safeText(p)).filter(Boolean).join("\n\n");
}

function buildProductText({ project, context, memory: m }: ProjectPrefillSource): string {
  const name = firstNonEmpty(
    m?.product?.product_name,
    context?.product_name,
    project.product_name,
    project.name,
  );
  const desc = firstNonEmpty(
    m?.product?.product_description,
    context?.product_description,
    project.product_description,
    m?.offer_positioning?.current_offer,
    context?.current_offer,
    project.current_offer,
  );
  if (name && desc && !desc.includes(name)) return `${name}\n\n${desc}`;
  return firstNonEmpty(desc, name);
}

function buildAudienceText({ project, context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.audience?.target_audience,
    context?.target_audience,
    project.target_audience,
    m?.audience?.audience_segments?.join("; "),
    context?.audience_segments?.join("; "),
  );
}

function buildPainText({ context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.pains_desires?.main_pain,
    context?.main_pain,
    m?.pains_desires?.frustrations,
    ...(m?.pains_desires?.secondary_pains ?? []),
    ...(context?.secondary_pains ?? []),
  );
}

function buildFailedAlternatives({ project, context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    context?.previous_attempts,
    m?.pains_desires?.alternatives,
    project.additional_context,
  );
}

function buildHiddenReason({ memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(m?.websites?.current_landing_problem, m?.pains_desires?.hidden_pains);
}

function buildMechanism({ context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.product?.product_unique_mechanism,
    context?.unique_mechanism,
    m?.offer_positioning?.differentiation,
    context?.positioning,
  );
}

function formatProof({ context, memory: m }: ProjectPrefillSource): string {
  const parts = [
    m?.proofs?.testimonials,
    m?.proofs?.cases,
    m?.proofs?.numbers,
    m?.proofs?.social_proof,
    m?.proofs?.expert_proofs,
  ]
    .map((s) => safeText(s))
    .filter(Boolean);
  if (parts.length) return parts.join("\n\n");
  if (context?.key_proofs?.length) {
    return context.key_proofs.filter((p) => !isAuditDerived(p)).join("; ");
  }
  return "";
}

function formatObjections({ context, memory: m }: ProjectPrefillSource): string {
  const entries = m?.objections?.filter((o) => o.objection?.trim()) ?? [];
  if (entries.length) {
    return entries
      .map((o) => {
        const line = o.objection.trim();
        return o.answer?.trim() ? `${line} → ${o.answer.trim()}` : line;
      })
      .join("\n");
  }
  if (context?.objections?.length) {
    return context.objections.filter((o) => !isAuditDerived(o)).join("\n");
  }
  return "";
}

function buildTargetAction({ context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(m?.offer_positioning?.call_to_action, context?.recommended_next_step);
}

function buildPromise({ context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.offer_positioning?.key_promise,
    context?.key_promise,
    m?.pains_desires?.main_desire,
    context?.main_desire,
    m?.product?.product_core_result,
    ...(m?.pains_desires?.desired_outcomes ?? []),
    ...(context?.desired_outcomes ?? []),
  );
}

function buildInside({ memory: m }: ProjectPrefillSource): string {
  const features = m?.product?.product_features?.filter(Boolean) ?? [];
  const benefits = m?.product?.product_benefits?.filter(Boolean) ?? [];
  const parts = [...features, ...benefits].map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return "";
  return parts.map((p) => `• ${p}`).join("\n");
}

function buildPrice({ context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.pricing?.price_points,
    m?.pricing?.packages,
    m?.product?.product_price_range,
    context?.price_range,
  );
}

function buildExpert({ memory: m }: ProjectPrefillSource): string {
  const f = m?.founder;
  if (!f) return "";
  const nameLine =
    f.founder_name && f.founder_role
      ? `${f.founder_name}, ${f.founder_role}`
      : f.founder_name;
  return joinBlocks(nameLine, f.founder_bio, f.founder_expertise, f.founder_credentials);
}

function buildHypothesis(source: ProjectPrefillSource): string {
  if (source.project.main_goal === "test_hypothesis") {
    return joinBlocks(source.project.name, source.project.product_description);
  }
  return firstNonEmpty(
    source.memory?.offer_positioning?.positioning,
    source.context?.positioning,
  );
}

function buildCustomerSituation({ project, context, memory: m }: ProjectPrefillSource): string {
  return firstNonEmpty(
    m?.audience?.customer_situation,
    context?.important_notes,
    project.additional_context,
  );
}

function setPoolKeys(pool: Record<string, string>, keys: string[], value: string) {
  if (!value) return;
  for (const key of keys) pool[key] = value;
}

/** Общий пул ответов по id вопросов сценариев из карточки проекта и памяти. */
export function buildScenarioAnswerPool(source: ProjectPrefillSource): Record<string, string> {
  const pool: Record<string, string> = {};
  const product = buildProductText(source);
  const audience = buildAudienceText(source);
  const pain = buildPainText(source);
  const promise = buildPromise(source);
  const inside = buildInside(source);

  setPoolKeys(pool, ["product", "consultationType", "eventTitle"], product);
  setPoolKeys(pool, ["hypothesis"], buildHypothesis(source) || product);
  setPoolKeys(pool, ["coldAudience", "audience", "buyer", "segment", "who_for"], audience);
  setPoolKeys(pool, ["mainPain", "problem", "currentLoss"], pain);
  setPoolKeys(pool, ["tasks"], buildCustomerSituation(source) || pain);
  setPoolKeys(pool, ["failedAlternatives", "alternatives"], buildFailedAlternatives(source));
  setPoolKeys(pool, ["hiddenReason"], buildHiddenReason(source));
  setPoolKeys(pool, ["mechanism", "howItWorks", "process"], buildMechanism(source));
  setPoolKeys(pool, ["proof", "examples"], formatProof(source));
  setPoolKeys(pool, ["objections"], formatObjections(source));
  setPoolKeys(pool, ["targetAction", "nextStep"], buildTargetAction(source));
  setPoolKeys(
    pool,
    ["mainValue", "result", "promise", "consultationValue", "mvpOffer", "mainPromise"],
    promise,
  );
  setPoolKeys(pool, ["inside"], inside);
  setPoolKeys(pool, ["program"], inside || buildMechanism(source));
  setPoolKeys(pool, ["price"], buildPrice(source));
  setPoolKeys(pool, ["expert", "speaker"], buildExpert(source));
  setPoolKeys(pool, ["urgency", "whyBuyNow", "whyNow"], firstNonEmpty(source.memory?.offer_positioning?.urgency_reason));
  setPoolKeys(pool, ["knownRisks", "not_for"], safeText(source.memory?.product?.product_limitations));
  setPoolKeys(pool, ["riskReversal"], firstNonEmpty(source.memory?.offer_positioning?.guarantee));
  setPoolKeys(pool, ["output"], firstNonEmpty(source.memory?.product?.product_core_result, promise));

  const offer = firstNonEmpty(
    source.memory?.offer_positioning?.current_offer,
    source.context?.current_offer,
    source.project.current_offer,
  );
  if (offer && !pool.mvpOffer) pool.mvpOffer = offer;

  return pool;
}

export function defaultScenarioIdForProject(project: Project): string {
  switch (project.main_goal) {
    case "test_hypothesis":
      return "hypothesis_test";
    case "new_launch":
      return "product_sale";
    default:
      return "cold_traffic";
  }
}

/** Отфильтровать пул под вопросы конкретного сценария. */
export function scenarioAnswersForScenario(
  scenarioId: string,
  pool: Record<string, string>,
): Record<string, string> {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) return {};
  const out: Record<string, string> = {};
  for (const q of scenario.questions) {
    const value = pool[q.id]?.trim();
    if (value && value.length >= 2) out[q.id] = value;
  }
  return out;
}

/** Заполнить только пустые поля — не затирает ввод пользователя. */
export function mergeEmptyAnswers(
  prev: Record<string, string>,
  incoming: Record<string, string>,
): Record<string, string> {
  const next = { ...prev };
  for (const [key, value] of Object.entries(incoming)) {
    if ((prev[key]?.trim().length ?? 0) < 2) next[key] = value;
  }
  return next;
}
