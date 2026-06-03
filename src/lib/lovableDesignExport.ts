import type { ForgePrototypeContent } from "@/lib/forge/types";
import {
  buildPrototypeMarkdown,
  type PrototypeMarkdownContent,
} from "@/lib/prototypeMarkdown";

export type LovableExportOptions = {
  productName?: string;
  niche?: string;
  audience?: string;
  tone?: string;
  /** Домен для рекламного трафика (если ещё не привязан — preview URL) */
  domain?: string;
  directionLabel?: string | null;
};

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function replaceAll(haystack: string, needle: string, value: string): string {
  return haystack.split(needle).join(value);
}

export function forgeToMarkdownContent(
  content: ForgePrototypeContent,
): PrototypeMarkdownContent | null {
  const blocks = content.blocks;
  if (!blocks || typeof blocks === "object" && typeof blocks._placeholder === "string") {
    return null;
  }
  if (!blocks.hero && !content.meta?.project_name) return null;

  const meta = content.meta ?? {};
  return {
    meta: {
      project_name: meta.project_name ?? "Прототип",
      tone_of_voice: meta.tone_of_voice ?? "",
      target_action: meta.target_action ?? "",
      ...(meta as PrototypeMarkdownContent["meta"]),
    },
    blocks,
  };
}

export function canExportLovableDesign(
  templateId: string,
  content: ForgePrototypeContent | null,
): boolean {
  if (!content) return false;
  if (templateId !== "full") return false;
  return forgeToMarkdownContent(content) !== null;
}

async function loadMasterPromptTemplate(): Promise<string> {
  const mod = await import("../../docs/lovable/lovable-design-master-prompt.tz?raw");
  return mod.default;
}

export async function buildLovableDesignPrompt(
  content: ForgePrototypeContent,
  options: LovableExportOptions = {},
): Promise<string | null> {
  const mdContent = forgeToMarkdownContent(content);
  if (!mdContent) return null;

  const masterPromptTemplate = await loadMasterPromptTemplate();
  const markdown = buildPrototypeMarkdown(mdContent);
  const blocks = content.blocks ?? {};
  const hero = blocks.hero as { headline?: string; subheadline?: string } | undefined;
  const micro = (blocks.micro_copy ?? {}) as Record<string, string | undefined>;

  const projectName = options.productName ?? mdContent.meta.project_name ?? "Лендинг";
  const headline = hero?.headline ?? projectName;
  const subheadline = hero?.subheadline ?? mdContent.meta.target_action ?? "";

  let prompt = masterPromptTemplate;
  prompt = replaceAll(prompt, "{{PRODUCT_NAME}}", projectName);
  prompt = replaceAll(
    prompt,
    "{{NICHE}}",
    options.niche ?? options.directionLabel ?? "см. контент прототипа ниже",
  );
  prompt = replaceAll(
    prompt,
    "{{AUDIENCE}}",
    options.audience ?? "см. контент прототипа ниже",
  );
  prompt = replaceAll(
    prompt,
    "{{TONE}}",
    options.tone ?? mdContent.meta.tone_of_voice ?? "разговор на кухне",
  );
  prompt = replaceAll(prompt, "{{MICRO_FORM_PLACEHOLDER}}", micro.form_placeholder ?? "Ваше имя");
  prompt = replaceAll(prompt, "{{MICRO_FORM_SUBMIT}}", micro.form_submit ?? "Оставить заявку");
  prompt = replaceAll(
    prompt,
    "{{MICRO_FORM_SUCCESS}}",
    micro.form_success ?? "Спасибо! Мы свяжемся с вами.",
  );
  prompt = replaceAll(prompt, "{{MICRO_TRUST_BADGE}}", micro.trust_badge ?? "");
  prompt = replaceAll(prompt, "{{MICRO_NAV_CTA}}", micro.nav_cta ?? "Оставить заявку");
  prompt = replaceAll(prompt, "{{MICRO_HERO_BADGE}}", micro.hero_badge ?? "");
  prompt = replaceAll(prompt, "{{PROJECT_NAME}}", projectName);
  prompt = replaceAll(prompt, "{{HERO_HEADLINE shortened}}", truncate(headline, 60));
  prompt = replaceAll(prompt, "{{SUBHEADLINE first 155 chars}}", truncate(subheadline, 155));
  prompt = replaceAll(prompt, "{{PASTE_PROTOTYPE_MARKDOWN_HERE}}", markdown.trim());
  prompt = replaceAll(prompt, "{{DOMAIN}}", options.domain ?? "ваш-домен.land");
  prompt = replaceAll(
    prompt,
    "{{TARGET_ACTION}}",
    mdContent.meta.target_action ?? "оставить заявку",
  );

  return prompt.trim();
}

export function downloadLovableDesignPrompt(text: string, filenameBase: string): void {
  const safe =
    filenameBase
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-_]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "lovable-landing";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}-lovable-prompt.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyLovableDesignPrompt(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
