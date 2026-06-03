import type { LucideIcon } from "lucide-react";
import { Clock, Users, Wallet } from "lucide-react";

export const HOME_PAIN_POINTS: {
  icon: LucideIcon;
  title: string;
  problem: string;
  solution: string;
}[] = [
  {
    icon: Clock,
    title: "Время",
    problem: "Часы на разбор сайта, брифы и правки копирайтера",
    solution: "Аудит за ~35 сек, оффер из 8 вопросов, прототип за ~5 мин",
  },
  {
    icon: Wallet,
    title: "Деньги",
    problem: "Трафик льётся, а заявки дорожают — непонятно, где дыра",
    solution: "Loss map: видно, на каком шаге воронки теряются клиенты",
  },
  {
    icon: Users,
    title: "Клиенты",
    problem: "Сообщение не цепляет — идеальные лиды уходят к конкурентам",
    solution: "Готовый оффер и hero под ваш формат и аудиторию",
  },
];

export const HOME_COMPARISON_ROWS: {
  task: string;
  manual: string;
  system: string;
}[] = [
  {
    task: "Аудит конверсии сайта",
    manual: "2–5 дней · агентство от 50 000 ₽",
    system: "~35 сек · бесплатно",
  },
  {
    task: "Оффер и первый экран",
    manual: "4–8 часов копирайтера",
    system: "8 вопросов · минуты",
  },
  {
    task: "Каркас лендинга",
    manual: "1–2 недели с подрядчиком",
    system: "19 блоков · ~5 мин",
  },
  {
    task: "Контекст между задачами",
    manual: "Каждый раз заново в чатах и Notion",
    system: "Мастерская проекта · память без повторных брифов",
  },
];

export const HOME_PLAN_STEPS: { step: string; title: string; desc: string }[] = [
  {
    step: "01",
    title: "Аудит по URL",
    desc: "Где сайт теряет заявки и что править в первую очередь",
  },
  {
    step: "02",
    title: "Оффер под формат",
    desc: "Hero, пост, КП или реклама — одно ясное сообщение",
  },
  {
    step: "03",
    title: "Прототип лендинга",
    desc: "Структура и тексты — можно отдать дизайнеру и трафику",
  },
];

export const HOME_CASE_SNIPPETS: {
  niche: string;
  metric: string;
  note: string;
}[] = [
  {
    niche: "B2B SaaS",
    metric: "CR 1,2% → 3,1% · CPL −38%",
    note: "Усилили правдоподобность и воронку под температуру трафика",
  },
  {
    niche: "Мед.клиника",
    metric: "CR 1,5% → 3,8% · CPL −47%",
    note: "Переписали ключевые блоки и добавили доверие за 10 дней",
  },
  {
    niche: "Онлайн-школа",
    metric: "CR 0,7% → 1,9% · CPL −35%",
    note: "Новый CTA, программа курса и социальные доказательства",
  },
];
