import { workshopToolUrl } from "@/lib/navigation/ideaLabUrls";
import { isIdeaLabStandalone } from "./constants";
import type { IdeaLabCard, IdeaLabServiceHandoff, IdeaLabStageId } from "./types";

export type HandoffService = IdeaLabServiceHandoff["service"];

const OFFER_PURPOSES = [
  "post",
  "landing_hero",
  "ad",
  "email",
  "presentation",
  "product",
  "service",
] as const;

export type OfferPurpose = (typeof OFFER_PURPOSES)[number];

function isOfferPurpose(v: string | undefined): v is OfferPurpose {
  return Boolean(v && OFFER_PURPOSES.includes(v as OfferPurpose));
}

/** Ссылка на сервис с контекстом проекта (если есть). */
export function buildIdeaLabServiceUrl(
  handoff: Pick<IdeaLabServiceHandoff, "service" | "purpose">,
  projectId?: string,
): string {
  const tool =
    handoff.service === "offer_generator"
      ? "/offer-generator"
      : handoff.service === "prototype"
        ? "/prototype"
        : handoff.service === "audit"
          ? "/audit"
          : "/quiz";

  const extra: Record<string, string> = {};
  if (handoff.service === "offer_generator" && handoff.purpose && isOfferPurpose(handoff.purpose)) {
    extra.purpose = handoff.purpose;
  }

  return workshopToolUrl(tool, projectId, extra);
}

/** Карточка и этап достаточны, чтобы вести в генератор оффера (не раньше). */
export function isReadyForOfferHandoff(
  stage: IdeaLabStageId,
  clarityPercent: number,
  card: IdeaLabCard,
  userMessage = "",
): boolean {
  const audience = (card.target_audience ?? "").trim();
  const problem = (card.main_problem ?? "").trim();
  const outcome = (card.desired_outcome ?? "").trim();
  const format = (card.product_format ?? "").trim();

  const hasCore =
    audience.length >= 8 &&
    problem.length >= 8 &&
    outcome.length >= 6 &&
    format.length >= 4;

  if (!hasCore || clarityPercent < 62) return false;

  if (stage === "offer") return true;

  const msg = userMessage.toLowerCase();
  const asksCopy = /черновик|напиш|состав.*(пост|оффер)|готов.*текст|собери пост|промо-пост/i.test(
    msg,
  );
  if (asksCopy && clarityPercent >= 65 && (stage === "actions" || stage === "validation")) {
    return true;
  }

  return false;
}

export function buildOfferHandoff(userMessage: string): IdeaLabServiceHandoff {
  const msg = userMessage.toLowerCase();
  let purpose: string | undefined;
  if (/пост|промо|stories|рилс|соцсет/i.test(msg)) purpose = "post";
  else if (/лендинг|hero|главн/i.test(msg)) purpose = "landing_hero";
  else if (/email|письм/i.test(msg)) purpose = "email";
  else if (/реклам|объявлен/i.test(msg)) purpose = "ad";

  return {
    service: "offer_generator",
    purpose,
    label:
      purpose === "post" ? "Собрать пост в генераторе" : "Открыть генератор текстов",
    reason:
      "Продукт прояснён — готовые тексты для поста или лендинга собираются в мастерской, карточка подставится.",
  };
}

/** Показать кнопку перехода только когда реально пора писать оффер. */
export function resolveDisplayHandoff(
  coach: { handoff?: IdeaLabServiceHandoff } | undefined,
  _reply: string,
  userText: string,
  stage: IdeaLabStageId,
  clarityPercent: number,
  card: IdeaLabCard,
): IdeaLabServiceHandoff | undefined {
  if (isIdeaLabStandalone()) return undefined;
  if (!isReadyForOfferHandoff(stage, clarityPercent, card, userText)) return undefined;
  if (coach?.handoff) return coach.handoff;
  return buildOfferHandoff(userText);
}
