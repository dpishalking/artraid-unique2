import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FolderKanban, Lightbulb, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import authorPhoto from "@/assets/author.png";
import { getCurrentSiteHost, PRIMARY_SITE_HOST } from "@/constants/site";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProjectId } from "@/hooks/useActiveProjectId";
import { getProjectById } from "@/lib/projects/projectApi";
import { CABINET_PATH, MARKETING_SITE_PATH } from "@/lib/navigation/flowExit";
import { ideaLabEntryUrl } from "@/lib/navigation/ideaLabUrls";
import { AUTHOR_BIO_PARAGRAPH, AUTHOR_FACTS, AUTHOR_ROLE_LINE } from "@/lib/marketing/authorProfile";
import { LandingSection } from "@/components/landing/LandingSection";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeProjectId = useActiveProjectId();
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !activeProjectId) {
      setActiveProjectName(null);
      return;
    }
    getProjectById(activeProjectId)
      .then((data) => setActiveProjectName(data?.project.name ?? null))
      .catch(() => setActiveProjectName(null));
  }, [user, activeProjectId]);

  if (authLoading) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  /** На основном домене с корня — только аудит; министэнд по-прежнему `/site` и `/?public=1`. */
  const auditOnlyPrimaryRoot =
    pathname === "/" &&
    getCurrentSiteHost() === PRIMARY_SITE_HOST &&
    searchParams.get("public") !== "1";

  if (auditOnlyPrimaryRoot) {
    return <Navigate to="/audit" replace />;
  }

  const showPublicLanding =
    pathname === MARKETING_SITE_PATH || searchParams.get("public") === "1";
  if (user && !showPublicLanding) {
    return <Navigate to={CABINET_PATH} replace />;
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/8 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-money/6 blur-[100px]" />
      </div>

      <LandingSection variant="hero" className="pt-28 pb-10 md:pt-36 md:pb-16">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Выберите путь ниже по стадии
            </p>
            <h1 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl leading-tight md:leading-tight">
              Аудит по адресу сайта, восемь шагов до текста оффера и черновой каркас лендинга — в памяти одного проекта; или идею продукта проясняете в Idea Lab с наставником — кому и что продаёте — до авторизации для сохранения в мастерскую
            </h1>
            <p className="mt-5 md:mt-6 text-left sm:text-center text-base md:text-lg text-muted-foreground leading-relaxed text-pretty border-l-4 border-money/70 sm:border-l-0 sm:pl-0 pl-4 sm:mx-auto max-w-3xl">
              Для уже ведущегося проекта вы за один рабочий заход собираете эту связку в кабинете без повторного брифа у подрядчика и без потери контекста между вкладками. В Idea Lab в демонстрационном режиме проговариваете смысл, аудиторию и формулировку продукта — без готовых рекламных текстов; вход под учётной записью понадобится только когда захотите оформить работу как проект.
            </p>
          </motion.div>

          {user && activeProjectId ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-8"
            >
              <Link
                to={`/projects/${activeProjectId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm hover:border-primary/50 transition-colors"
              >
                <span>
                  <span className="font-semibold text-foreground">
                    Продолжить в проекте
                    {activeProjectName ? `: ${activeProjectName}` : ""}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Аудит, оффер и прототип в одном контексте
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2 md:gap-5"
          >
            <Link to="/cabinet" className="group block h-full">
              <div className="relative flex h-full min-h-[220px] flex-col rounded-3xl border-2 border-primary/40 bg-card/80 p-6 md:p-8 shadow-[0_12px_48px_-16px_hsl(var(--primary)/0.35)] backdrop-blur transition-all hover:border-primary/70 hover:-translate-y-0.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-money shadow-glow mb-4">
                  <FolderKanban className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold md:text-2xl mb-2">
                  У меня уже есть проект
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                  Кабинет: проекты, память контекста, аудит, оффер и прототип без лишних брифов.
                </p>
                <div className="flex items-center justify-between rounded-xl bg-gradient-money px-4 py-3 shadow-glow">
                  <span className="font-semibold text-primary-foreground text-sm">
                    Перейти в кабинет
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <a href={ideaLabEntryUrl()} className="group block h-full">
              <div className="relative flex h-full min-h-[220px] flex-col rounded-3xl border-2 border-amber-500/40 bg-card/80 p-6 md:p-8 backdrop-blur transition-all hover:border-amber-500/65 hover:-translate-y-0.5">
                <Badge className="absolute right-4 top-4 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]">
                  Демо
                </Badge>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mb-4">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold md:text-2xl mb-2">
                  У меня только идея
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                  Диалог с наставником: кому продаёте, что продаёте и в каком формате. Проект — когда захотите.
                </p>
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3">
                  <span className="font-semibold text-white text-sm">Idea Lab</span>
                  <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </motion.div>
        </div>
      </LandingSection>

      <LandingSection variant="default" className="py-12 md:py-16 border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-money opacity-20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[280px_1fr] md:items-center">
              <div className="mx-auto md:mx-0">
                <div className="relative mx-auto max-w-[280px]">
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-money opacity-30 blur-xl" />
                  <img
                    src={authorPhoto}
                    alt="Даниил Пищалкин — маркетолог, автор AI-разбора сайтов"
                    className="relative mx-auto w-full rounded-2xl bg-background/40 object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Автор системы
                </p>
                <h3 className="font-display text-2xl font-semibold md:text-3xl">Даниил Пищалкин</h3>
                <p className="mt-1 text-sm font-medium text-primary">{AUTHOR_ROLE_LINE}</p>
                <p className="mt-4 text-sm text-muted-foreground">{AUTHOR_BIO_PARAGRAPH}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {AUTHOR_FACTS.map((fact) => (
                    <li
                      key={fact}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-foreground/85"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-money" />
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      <footer className="container mx-auto max-w-5xl px-4 py-10 border-t border-border">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left md:items-start">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-money" />
            <span className="text-sm font-semibold">{getCurrentSiteHost()}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link to="/oferta" className="hover:text-foreground">
              Оферта
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Конфиденциальность
            </Link>
            <a href="https://t.me/d_pishalking" target="_blank" rel="noreferrer" className="hover:text-foreground">
              Telegram
            </a>
          </nav>
          <div className="text-xs text-muted-foreground md:max-w-sm md:text-right">
            <p>ИП Можарова А.Н.</p>
            <p className="mt-1">ИНН 222391963986 · ОГРНИП 324774600700724</p>
            <p className="mt-1">
              <a href="mailto:tvtska@gmail.com" className="hover:text-foreground">
                tvtska@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
