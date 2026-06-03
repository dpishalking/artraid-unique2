import type { Project, ProjectContext } from "@/lib/projects/types";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";
import { mainGoalLabel } from "@/lib/projects/constants";

export type ProjectCardField = {
  id: string;
  label: string;
  value: string | null;
  fromQuiz: boolean;
  editPath?: string;
};

function pick(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) {
    const t = typeof v === "string" ? v.trim() : "";
    if (t) return t;
  }
  return null;
}

export function buildProjectCardFields(
  project: Project,
  context: ProjectContext | null,
  memory: ProjectMemorySections | null,
  quizSnapshot: Record<string, unknown> | null,
): ProjectCardField[] {
  const quiz = quizSnapshot ?? {};
  const fromQuizIds = new Set(project.quiz_memory_mapped_fields ?? []);

  const m = memory;
  const product = pick(
    m?.product?.product_description,
    project.product_description,
    context?.product_description,
    quiz.productDescription as string,
  );
  const audience = pick(
    m?.audience?.target_audience,
    project.target_audience,
    context?.target_audience,
    quiz.targetAudience as string,
  );
  const pain = pick(m?.pains_desires?.main_pain, context?.main_pain);
  const offer = pick(m?.offer_positioning?.current_offer, project.current_offer, context?.current_offer);
  const site = pick(
    m?.websites?.main_website_url,
    project.current_website_url,
    context?.current_website_url,
    quiz.website as string,
  );
  const goal = project.main_goal ? mainGoalLabel(project.main_goal) : null;
  const compCount = (m?.competitors?.length ?? 0) + (project.competitors?.length ?? 0);
  const competitors = compCount > 0 ? `${compCount} записей` : null;
  const proofs = pick(m?.proofs?.cases, m?.proofs?.testimonials, m?.proofs?.numbers);
  const strengths = pick(m?.offer_positioning?.offer_strengths, m?.company?.company_advantages?.join(", "));
  const constraints = pick(
    m?.constraints?.important_notes,
    m?.constraints?.things_not_to_say,
    context?.constraints,
  );

  const fields: ProjectCardField[] = [
    {
      id: "company",
      label: "Компания",
      value: pick(m?.company?.company_name, project.name),
      fromQuiz: fromQuizIds.has("company.company_name"),
    },
    {
      id: "product",
      label: "Продукт / услуга",
      value: product,
      fromQuiz: fromQuizIds.has("product.product_description") || Boolean(quiz.productDescription),
    },
    {
      id: "audience",
      label: "Целевая аудитория",
      value: audience,
      fromQuiz: fromQuizIds.has("audience.target_audience") || Boolean(quiz.targetAudience),
    },
    {
      id: "pain",
      label: "Главная боль клиента",
      value: pain,
      fromQuiz: false,
      editPath: "memory",
    },
    {
      id: "offer",
      label: "Текущее предложение",
      value: offer,
      fromQuiz: false,
      editPath: "context",
    },
    {
      id: "site",
      label: "Сайт / лендинг",
      value: site,
      fromQuiz: fromQuizIds.has("websites.main_website_url") || Boolean(quiz.website),
    },
    {
      id: "traffic",
      label: "Каналы трафика",
      value: pick(m?.business_metrics?.traffic_sources),
      fromQuiz: false,
      editPath: "memory",
    },
    {
      id: "goal",
      label: "Цель",
      value: goal,
      fromQuiz: fromQuizIds.has("business_metrics.business_goal") || Boolean(quiz.mainGoal),
    },
    {
      id: "competitors",
      label: "Конкуренты",
      value: competitors,
      fromQuiz: false,
      editPath: "context",
    },
    {
      id: "strengths",
      label: "Сильные стороны",
      value: strengths,
      fromQuiz: false,
      editPath: "memory",
    },
    {
      id: "proofs",
      label: "Доказательства / кейсы",
      value: proofs,
      fromQuiz: false,
      editPath: "memory",
    },
    {
      id: "constraints",
      label: "Ограничения / нюансы",
      value: constraints,
      fromQuiz: false,
      editPath: "memory",
    },
  ];

  return fields;
}

export function countFilledCardFields(fields: ProjectCardField[]): number {
  return fields.filter((f) => f.value).length;
}
