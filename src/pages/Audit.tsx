import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SiteAnalyzer } from "@/components/SiteAnalyzer";
import { ProductLaneContextBanner } from "@/components/product/ProductLaneContextBanner";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitForProjectContext } from "@/lib/navigation/flowExit";
import { useEffectiveProjectId } from "@/hooks/useEffectiveProjectId";
import {
  isCabinetWorkspaceRoute,
  isPrimaryAuditSurface,
} from "@/lib/surface/isPrimaryAuditSurface";
import { SiteChromeFooter } from "@/components/layout/SiteChromeFooter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  EyeOff,
  HelpCircle,
  Wrench,
  ArrowRight,
  Sparkles,
  Target,
  Brain,
  TrendingUp,
  DollarSign,
  Zap,
  FileText,
  Clock,
  Shield,
  Layers,
  Compass,
  Gauge,
  ScrollText,
  Link2,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Lock,
  TrendingDown,
  BadgeCheck,
  Quote,
} from "lucide-react";
import authorPhoto from "@/assets/author.png";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";
import reportPreview1 from "@/assets/report-preview-1.jpg";
import reportPreview2 from "@/assets/report-preview-2.jpg";
import reportPreview3 from "@/assets/report-preview-3.jpg";
import reportPreview4 from "@/assets/report-preview-4.jpg";
import reportPreview5 from "@/assets/report-preview-5.jpg";
import reportPreview6 from "@/assets/report-preview-6.jpg";
import reportPreview7 from "@/assets/report-preview-7.jpg";
import reportPreview8 from "@/assets/report-preview-8.jpg";

const scrollToTop = (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const frameworks = [
  { icon: DollarSign, name: "Hormozi Value Equation", desc: "Покажет, насколько ваше предложение вкусное. И почему у вас купят, а не у соседа." },
  { icon: Gauge, name: "MECLABS Score", desc: "Оценит главный экран: за 5 секунд понятно, что вы предлагаете и зачем оставлять заявку?" },
  { icon: Layers, name: "Schwartz Awareness", desc: "Поймёт, насколько ниша «уставшая» от рекламы — и что говорить, чтобы выделиться." },
  { icon: Target, name: "JTBD", desc: "Найдёт настоящую причину, зачем к вам приходят. Часто она не та, о которой написано на сайте." },
  { icon: Shield, name: "Cialdini × 6", desc: "Проверит 6 рычагов доверия: отзывы, кейсы, гарантии. Где вы недодали — там клиент уходит." },
  { icon: TrendingUp, name: "Eisenberg Trinity", desc: "Каждый экран спросим: понятно? полезно? есть, что нажать? Если хоть одно «нет» — теряем заявку." },
  { icon: Brain, name: "Хант × Голополосов", desc: "Сверит, на каком языке говорит сайт и на каком думает посетитель. Несовпадение = молчаливый уход." },
  { icon: ScrollText, name: "StoryBrand 7", desc: "Соберёт сайт в историю: посетитель — герой, вы — проводник. Без этого получается каша." },
  { icon: Compass, name: "April Dunford Positioning", desc: "Объясняет за 10 секунд: кто вы, для кого и чем лучше других. Если непонятно — закроют вкладку." },
  { icon: Zap, name: "BJ Fogg B=MAP", desc: "Найдёт, где путь к заявке слишком сложный: лишние поля, мутные кнопки, страх «а что дальше»." },
  { icon: FileText, name: "Ильяхов / Sugarman", desc: "Проверит каждое слово: цепляет или впустую занимает место. Лишнее — вырежем, слабое — усилим." },
];

const faqItems = [
  {
    q: "Это правда бесплатно? В чём подвох?",
    a: "Да, разбор бесплатный, без регистрации и без скрытых платежей. Я делаю это, чтобы показать уровень мышления — часть людей потом приходит на платную консультацию или ведение проекта. Большинство просто пользуется отчётом и внедряет правки сами. Это нормально.",
  },
  {
    q: "Чем это отличается от того, что мне расскажет ChatGPT?",
    a: "ChatGPT даст общие советы. Здесь сайт прогоняется через 11 конкретных маркетинговых фреймворков, оценивается по формулам (Hormozi, MECLABS), даётся скоринг, приоритизация ICE и поэтапный roadmap внедрения. Это структурированный отчёт, а не диалог.",
  },
  {
    q: "Подойдёт ли моей нише?",
    a: "Лучше всего работает для услуг, экспертов, инфо-продуктов, B2B, медицинских и сервисных проектов с холодным трафиком. Для маркетплейсов и больших интернет-магазинов будет полезно по части оффера и доверия, но не по карточкам товаров.",
  },
  {
    q: "Сколько времени занимает разбор?",
    a: "В среднем 35–60 секунд. AI заходит на сайт, читает контент, прогоняет через 11 методик и собирает отчёт. Дальше у вас остаётся PDF и интерактивный дашборд.",
  },
  {
    q: "Откуда цифра «до 70% заявок»?",
    a: "Это усреднённая оценка по данным аналитических лабораторий (CXL, Baymard, MECLABS) и нашей практике аудитов. Типовой сайт с холодным трафиком реализует 20–40% своего потенциала: слабый оффер, провалы в доверии, мутный CTA, несоответствие температуре трафика. Остальные 60–80% — это и есть «утечка», которую видно в разборе.",
  },
  {
    q: "Что если сайт на Tilda / Tilda-like / лендинг на конструкторе?",
    a: "Без разницы. Анализируется содержание, смыслы, структура, оффер, CTA, доверие — а не код. Большинство тестируемых сайтов как раз на конструкторах.",
  },
  {
    q: "Какие данные вы храните?",
    a: "Только URL, который вы ввели, и сгенерированный отчёт. Никакой персональной информации, никакой аналитики посетителей вашего сайта мы не собираем.",
  },
];

const reportSections = [
  { num: "01", title: "Разбор первого экрана", desc: "Понятно ли с порога, что вы предлагаете и зачем оставлять заявку." },
  { num: "02", title: "Голос клиента", desc: "Что думает посетитель в каждой слабой точке. Почему молча уходит." },
  { num: "03", title: "Сила оффера", desc: "Насколько ваше предложение вкуснее, чем у конкурентов. И что усилить в первую очередь." },
  { num: "04", title: "Контекст рынка", desc: "Насколько ниша уставшая от рекламы и говорит ли сайт на её языке." },
  { num: "05", title: "10–15 точек роста", desc: "Конкретный список: что переписать, добавить, убрать. С приоритетом — что важнее." },
  { num: "06", title: "План внедрения", desc: "Что делать сегодня, что — на неделе, что — в течение месяца. По шагам." },
  { num: "07", title: "PDF на email", desc: "Полный отчёт файлом — можно отдать команде или подрядчику и сразу делать." },
];

const reportPreviews = [
  {
    img: reportPreview1,
    title: "Executive Summary",
    desc: "Главная цифра потерь и 4 ключевые шкалы: понятность, ценность, доверие, действие.",
  },
  {
    img: reportPreview5,
    title: "Основные проблемы",
    desc: "Топ-проблем с severity, голосом клиента и Impact Score — что бьёт по конверсии сильнее всего.",
  },
  {
    img: reportPreview6,
    title: "Где теряются деньги",
    desc: "Воронка потерь по этапам: видно, где утекает трафик и сколько это стоит.",
  },
  {
    img: reportPreview2,
    title: "Каскад роста конверсии",
    desc: "Видно вклад каждого фикса: с текущей конверсии до итоговой по шагам.",
  },
  {
    img: reportPreview7,
    title: "Было / Стало",
    desc: "Конкретные примеры: как переписать заголовок, CTA и блоки доверия — с готовым текстом.",
  },
  {
    img: reportPreview3,
    title: "Сила оффера по Hormozi",
    desc: "Итоговый балл и 4 параметра: Dream / Правдоподобность / Скорость / Простота.",
  },
  {
    img: reportPreview8,
    title: "MECLABS Score",
    desc: "Мотиваторы vs барьеры, awareness-лестница и термометр sophistication ниши.",
  },
  {
    img: reportPreview4,
    title: "План внедрения",
    desc: "Что делать сегодня, на неделе и в месяц. С эффектом и ICE-приоритизацией.",
  },
];

const caseStudies = [
  {
    niche: "Эксперт-психолог",
    url: "psy-***.ru",
    crBefore: "0.9%",
    crAfter: "2.4%",
    cpl: "−42%",
    time: "2 недели",
    note: "Переписали оффер первого экрана и добавили блок доверия.",
  },
  {
    niche: "B2B SaaS, аналитика",
    url: "data-***.io",
    crBefore: "1.2%",
    crAfter: "3.1%",
    cpl: "−38%",
    time: "3 недели",
    note: "Усилили правдоподобность и выровняли воронку под температуру трафика.",
  },
  {
    niche: "Мед.клиника, премиум",
    url: "clinic-***.ru",
    crBefore: "1.5%",
    crAfter: "3.8%",
    cpl: "−47%",
    time: "10 дней",
    note: "Сократили форму, переписали 3 ключевых блока, добавили кейсы.",
  },
  {
    niche: "Онлайн-школа",
    url: "school-***.com",
    crBefore: "0.7%",
    crAfter: "1.9%",
    cpl: "−35%",
    time: "2 недели",
    note: "Поменяли CTA, добавили пример программы и социальные доказательства.",
  },
  {
    niche: "Услуги, инфраструктура",
    url: "infra-***.ru",
    crBefore: "1.1%",
    crAfter: "2.6%",
    cpl: "−40%",
    time: "3 недели",
    note: "Структурировали оффер по JTBD и убрали трение в форме заявки.",
  },
];

const methodologies = [
  "Hormozi",
  "MECLABS",
  "ConversionXL",
  "Cialdini",
  "Eisenberg",
  "StoryBrand",
  "JTBD",
  "April Dunford",
  "BJ Fogg",
  "Schwartz",
  "Хант",
  "Sugarman",
];

const Audit = () => {
  const { pathname } = useLocation();
  const [hasAudit, setHasAudit] = useState(false);
  const inCabinetShell = isCabinetWorkspaceRoute(pathname);
  const marketingOnly = !inCabinetShell && isPrimaryAuditSurface();
  const projectId = useEffectiveProjectId();
  const [defaultUrl, setDefaultUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!projectId) {
      setDefaultUrl(undefined);
      return;
    }
    import("@/lib/projects/projectApi").then(({ getProjectById }) =>
      getProjectById(projectId).then((data) => {
        const url = data?.project.current_website_url?.trim();
        if (url) setDefaultUrl(url);
      }),
    );
  }, [projectId]);

  return (
    <main className={cn("flex flex-col", !hasAudit && "min-h-screen")}>
      {inCabinetShell ? (
        <FlowPageHeader title="Аудит сайта" hideExit />
      ) : !marketingOnly ? (
        <FlowPageHeader
          exit={flowExitForProjectContext(projectId)}
          showHomeLink={!!projectId}
          title="Аудит сайта"
        />
      ) : null}
      {/* HERO */}
      <section
        id="analyzer"
        className={cn(
          hasAudit
            ? "w-full px-3 py-4 sm:px-5 md:px-6 lg:px-8"
            : "container mx-auto px-4 pt-8 pb-8 md:pt-12 md:pb-12 py-[10px]",
        )}
      >
        {!hasAudit && (
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-money animate-pulse" />
              Если льёте от 100к/мес в рекламу — а заявки всё дороже
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.07] tracking-tight md:text-6xl">
              Узнайте, где конкретно ваш сайт{" "}
              <span className="bg-gradient-money bg-clip-text text-transparent">сливает до 70% заявок</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              AI проверит сайт по <strong className="font-semibold text-foreground">11 методикам сильных маркетологов</strong> и за{" "}
              <strong className="font-semibold text-foreground">35 секунд</strong> даст готовый план: что переписать, что усилить, как{" "}
              <strong className="font-semibold text-foreground">поднять конверсию</strong> и{" "}
              <strong className="font-semibold text-money">снизить CPL на 30–40%</strong>.{" "}
              <span className="font-semibold text-foreground">Бесплатно, без регистрации.</span>
            </p>
          </div>
        )}

        <div className={cn("mx-auto", hasAudit ? "mt-0 w-full max-w-none" : "mt-10 max-w-2xl")}>
          {!marketingOnly && !hasAudit && <ProductLaneContextBanner projectId={projectId} className="mb-6" />}
          <SiteAnalyzer
            projectId={projectId}
            defaultUrl={defaultUrl}
            onAuditChange={setHasAudit}
            showProjectIntegrations={!marketingOnly}
          />
        </div>
      </section>

      {!hasAudit && (<>
      {/* КАК ВЫГЛЯДИТ ВАШ ОТЧЁТ — КАРУСЕЛЬ */}
      <section className="container mx-auto px-4 py-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Как будет выглядеть ваш отчёт
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Интерактивный консалтинговый дашборд с цифрами, шкалами и пошаговым планом. Полистайте.
            </p>
          </div>

          <div className="mt-10">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent>
                {reportPreviews.map(({ img, title, desc }, i) => (
                  <CarouselItem key={title} className="md:basis-2/3 lg:basis-1/2">
                    <Reveal delay={i * 80}>
                      <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-card backdrop-blur">
                        <div className="relative aspect-[3/2] overflow-hidden bg-background/40">
                          <img
                            src={img}
                            alt={`Превью раздела отчёта: ${title}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent" />
                        </div>
                        <div className="p-5">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-money">
                            Раздел {String(i + 1).padStart(2, "0")}
                          </div>
                          <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
                          <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>

            <div className="mt-6 text-center text-xs text-muted-foreground md:hidden">
              Свайпните, чтобы посмотреть остальные разделы →
            </div>
          </div>
        </div>
      </section>

       {/* ЧТО ВНУТРИ — 12 ФРЕЙМВОРКОВ */}
       <section className="container mx-auto px-4 md:py-14 py-[46px] my-0">
        <div className="mx-auto max-w-5xl">
          <Reveal><div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Эти 11 методик принесли миллионы долларов предпринимателям по всему миру
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              По ним проверяем оффер, первый экран, триггеры доверия, отработку возражерний, копирайтинг, формы захвата и путь к заявке&nbsp; и показываем, что исправить первым, чтобы поднять конверсию.
            </p>
          </div></Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {frameworks.map(({ icon: Icon, name, desc }, i) => (
              <Reveal key={name} delay={i * 60}>
                <div className="group relative h-full overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur transition-colors hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-money shadow-glow">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold leading-tight">{name}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Как это работает
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Три шага. Никакой регистрации, никаких созвонов.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Link2,
                title: "Вставьте ссылку на сайт",
                desc: "Любая страница: лендинг, главная, услуга. Никаких настроек — просто URL.",
              },
              {
                num: "02",
                icon: Brain,
                title: "AI прогоняет сайт через 11 фреймворков",
                desc: "Читает каждый экран, считает скоринги, ищет точки разрыва воронки. Около 60 секунд.",
              },
              {
                num: "03",
                icon: FileText,
                title: "Получаете отчёт + PDF",
                desc: "Интерактивный дашборд, 10–15 точек роста, приоритизация ICE, roadmap.",
              },
            ].map(({ num, icon: Icon, title, desc }, i) => (
              <Reveal key={num} delay={i * 120}>
                <div className="relative h-full rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur">
                <div className="absolute -top-3 left-6 rounded-full bg-gradient-money px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-glow">
                  Шаг {num}
                </div>
                  <Icon className="mt-2 h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ПРИМЕР ОТЧЁТА */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-money" /> Что вы получите
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              8 разделов с детальным отчётом по вашему сайту
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Структурированный документ, который можно отдать дизайнеру, копирайтеру или подрядчику по трафику — и он сразу поймёт, что делать.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {reportSections.map(({ num, title, desc }, i) => (
              <Reveal key={num} delay={i * 70}>
                <div className="flex h-full gap-4 rounded-xl border border-border bg-card/40 p-5 backdrop-blur">
                  <div className="font-display text-2xl font-bold text-money/70">{num}</div>
                  <div>
                    <h3 className="font-display font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* РЕЗУЛЬТАТЫ РАЗБОРОВ — КЕЙСЫ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-money" /> Результаты после внедрения разбора
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Что меняется после внедрения правок из отчёта
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Конверсия и CPL — две метрики, которые двигаются быстрее всего. Вот сводка по реальным проектам, которые внедрили рекомендации.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {caseStudies.map((c, i) => (
              <Reveal key={c.url} delay={i * 70}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card/40 p-6 backdrop-blur transition-colors hover:border-money/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {c.niche}
                      </div>
                      <div className="mt-1 truncate font-mono text-sm text-foreground/80">{c.url}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-money/30 bg-money/10 px-2.5 py-1 text-[11px] font-semibold text-money">
                      <Clock className="h-3 w-3" />
                      {c.time}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-background/40 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Конверсия
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-1.5 font-display tabular-nums">
                        <span className="text-sm text-muted-foreground line-through">{c.crBefore}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-money" />
                        <span className="text-xl font-bold text-money">{c.crAfter}</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        CPL
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-1.5 font-display tabular-nums">
                        <TrendingDown className="h-4 w-4 text-money" />
                        <span className="text-xl font-bold text-money">{c.cpl}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 flex gap-2 text-sm text-muted-foreground">
                    <Quote className="h-4 w-4 shrink-0 text-money/60" />
                    {c.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
            Названия сайтов скрыты по NDA. Цифры — результат внедрения 60-80% рекомендаций из AI-разбора.
          </p>
        </div>
      </section>

      {/* ГАРАНТИЯ + 12 МЕТОДИК */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-money/30 bg-card/60 p-8 shadow-card backdrop-blur md:p-12">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-money opacity-20 blur-3xl" />
              <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-money shadow-glow md:h-24 md:w-24">
                  <BadgeCheck className="h-10 w-10 text-primary-foreground md:h-12 md:w-12" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-money">
                    Якорь правдоподобности
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                    Если AI не найдёт минимум{" "}
                    <span className="bg-gradient-money bg-clip-text text-transparent">3 точки роста</span>{" "}
                    — вернём… ой, он же бесплатный 🙂
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground md:text-base">
                    Вы ничем не рискуете: ни деньгами, ни регистрацией, ни временем. Худший сценарий — потратите 35 секунд и убедитесь, что у вас всё идеально (что почти невероятно).
                  </p>
                </div>
              </div>

              <div className="relative mt-8 border-t border-border/60 pt-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Логика разбора собрана из 11 фреймворков топ-маркетологов мира
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {methodologies.map((m) => (
                    <li
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/85"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-money" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* АВТОР */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Кто стоит за этим разбором
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              AI помогает быстро находить слабые места, но логика диагностики собрана из 11 фреймворков топ-маркетологов мира и 10+ лет личной практики.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-money opacity-20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[300px_1fr] md:items-center">
              <div className="mx-auto md:mx-0">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-money opacity-30 blur-xl" />
                  <img
                    src={authorPhoto}
                    alt="Даниил Пищалкин — маркетолог, автор AI-разбора сайтов"
                    className="relative w-full max-w-[300px] rounded-2xl object-contain bg-background/40"
                    loading="lazy"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  Даниил Пищалкин
                </h3>
                <p className="mt-1 text-sm font-medium text-primary md:text-base">
                  Маркетолог, практик по упаковке офферов, конверсии сайтов и запуску трафика
                </p>
                <p className="mt-4 text-sm text-muted-foreground md:text-base">
                  С 2011 года занимаюсь маркетингом и запусками сложных продуктов. Работал с экспертами, физическими продуктами, медицинскими и сервисными проектами.
                </p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {[
                    "15 лет в маркетинге и построении бизнес-систем",
                    "Открутили 77 миллионов с окупаемостью 250%+ для медицинского производства",
                    "309 млн ₽ принёс себе и клиентам за последние 5 лет",
                    "Вывел на европейский рынок бутылку-водородогенератор и сделал солдаут ещё до физической поставки партии товара в Германию",
                    "Рекордный запуск: $1 000 000 на запуске курса по обучению криптовалютной торговле",
                  ].map((fact) => (
                    <li
                      key={fact}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-foreground/85"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-money" />
                      {fact}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <MagneticButton>
                    <Button
                      asChild
                      className="group h-12 rounded-lg bg-gradient-money px-6 font-semibold text-primary-foreground shadow-glow hover:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.6)]"
                    >
                      <a href="#analyzer" onClick={scrollToTop}>
                        Получить AI-разбор сайта
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Какие вопросы и подозрения у вас могут возникнуть?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              {"\n"}
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqItems.map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 60}>
                <Collapsible className="rounded-xl border border-border bg-card/40 backdrop-blur">
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 p-5 text-left">
                  <span className="font-display font-semibold">{q}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="px-5 pb-5 text-sm text-muted-foreground md:text-base">{a}</p>
                  </CollapsibleContent>
                </Collapsible>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ФИНАЛЬНЫЙ CTA — LOSS FRAMING */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 text-center shadow-card backdrop-blur md:p-14">
            <div className="pointer-events-none absolute inset-0 bg-gradient-money opacity-10" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-gradient-money opacity-20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Каждый день промедления = потерянные заявки
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Узнайте, где именно ваш сайт теряет деньги
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Пока трафик идёт на сайт со слабым оффером — бюджет утекает. 35 секунд диагностики дешевле, чем ещё неделя сливов в рекламе.
              </p>

              <div className="mt-7 flex flex-col items-center gap-3">
                <MagneticButton>
                  <Button
                    asChild
                    size="lg"
                    className="group h-14 rounded-lg bg-gradient-money px-8 text-base font-semibold text-primary-foreground shadow-glow hover:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.6)]"
                  >
                    <a href="#analyzer" onClick={scrollToTop}>
                      Запустить разбор бесплатно
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                </MagneticButton>
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-money" /> Бесплатно</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-money" /> Без регистрации</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-money" /> ~35 секунд</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </>)}

      <SiteChromeFooter showAuditDisclaimer />
    </main>
  );
};

export default Audit;
