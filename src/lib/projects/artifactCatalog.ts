import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Megaphone,
  Layers,
  ScanSearch,
  MessageSquare,
  Mail,
  FileText,
  Sparkles,
  Quote,
} from "lucide-react";

export type ArtifactCategoryId = "core" | "launch" | "social";

export type ProjectArtifact = {
  id: string;
  category: ArtifactCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  required?: boolean;
  href: (projectId: string) => string;
  readyHint?: string;
};

export const ARTIFACT_CATEGORIES: { id: ArtifactCategoryId; label: string }[] = [
  { id: "core", label: "Ключевые активы" },
  { id: "launch", label: "Для запуска" },
  { id: "social", label: "Соцсети и рассылки" },
];

export const PROJECT_ARTIFACTS: ProjectArtifact[] = [
  {
    id: "memory",
    category: "core",
    title: "Память проекта",
    description: "Единый контекст для всех инструментов: продукт, аудитория, обещание.",
    icon: Brain,
    required: true,
    href: (id) => `/projects/${id}/memory`,
    readyHint: "Заполните хотя бы 40% — тогда оффер и прототип будут точнее.",
  },
  {
    id: "offer",
    category: "core",
    title: "Оффер",
    description: "Заголовок, подзаголовок и CTA под формат: лендинг, пост, реклама.",
    icon: Megaphone,
    href: (id) => `/offer-generator?projectId=${id}`,
  },
  {
    id: "prototype",
    category: "core",
    title: "Прототип лендинга",
    description: "Структура из 19 блоков — можно сразу передать дизайнеру.",
    icon: Layers,
    href: (id) => `/prototype?projectId=${id}`,
  },
  {
    id: "audit",
    category: "core",
    title: "Аудит сайта",
    description: "Где теряются заявки и что усилить в упаковке.",
    icon: ScanSearch,
    href: (id) => `/audit?projectId=${id}`,
  },
  {
    id: "one_liner",
    category: "launch",
    title: "Однострочник",
    description: "Короткая формулировка «кто → результат» для био и первых касаний.",
    icon: Quote,
    href: (id) => `/offer-generator?projectId=${id}&purpose=landing_hero`,
  },
  {
    id: "landing_hero",
    category: "launch",
    title: "Первый экран",
    description: "Hero-блок лендинга: боль, обещание, кнопка.",
    icon: Sparkles,
    href: (id) => `/offer-generator?projectId=${id}&purpose=landing_hero`,
  },
  {
    id: "post",
    category: "social",
    title: "Пост",
    description: "Промо-пост для Telegram, VK или Instagram.",
    icon: MessageSquare,
    href: (id) => `/offer-generator?projectId=${id}&purpose=post`,
  },
  {
    id: "email",
    category: "social",
    title: "Письмо",
    description: "Email с оффером и одним чётким действием.",
    icon: Mail,
    href: (id) => `/offer-generator?projectId=${id}&purpose=email`,
  },
  {
    id: "proposal",
    category: "launch",
    title: "Коммерческое предложение",
    description: "Структура КП для B2B или личной продажи.",
    icon: FileText,
    href: (id) => `/offer-generator?projectId=${id}&purpose=commercial_proposal`,
  },
];

export const DEFAULT_ARTIFACT_SELECTION = new Set(
  PROJECT_ARTIFACTS.filter((a) => a.required || a.id === "offer" || a.id === "prototype").map(
    (a) => a.id,
  ),
);
