import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap, CheckCircle2, ArrowLeft, MessageCircle, X, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { useCredits } from "@/hooks/useCredits";
import { CREDITS_ENABLED } from "@/config/features";

type Package = {
  id: string;
  count: number;
  name: string;
  subtitle: string;
  price: string;
  perUnit: string;
  savings?: string;
  hint?: string;
  badge: string | null;
  highlight: boolean;
  features: string[];
  tg: string;
  borderClass: string;
};

const PACKAGES: Package[] = [
  {
    id: "restart",
    count: 1,
    name: "Рестарт",
    subtitle: "Для первого прототипа и проверки идеи",
    price: "490",
    perUnit: "490₽ за 1 прототип",
    badge: null,
    highlight: false,
    features: [
      "1 полный прототип лендинга",
      "19 смысловых блоков с копирайтингом",
      "Перегенерация любого блока",
      "Экспорт в Markdown",
      "Подходит, чтобы быстро проверить одну идею",
    ],
    tg: "1 генерация — 490₽",
    borderClass: "border-border",
  },
  {
    id: "growth",
    count: 5,
    name: "Рост",
    subtitle: "Лучший выбор для теста гипотез",
    price: "1 990",
    perUnit: "398₽ за 1 прототип",
    savings: "Экономия 460₽ по сравнению с покупкой по одной",
    hint: "Оптимально, если хочешь сравнить несколько офферов, сегментов или подходов к упаковке.",
    badge: "Выбор большинства",
    highlight: true,
    features: [
      "5 полных прототипов лендинга",
      "19 смысловых блоков с копирайтингом в каждом",
      "Перегенерация любого блока",
      "Экспорт в Markdown",
      "Кредиты не сгорают",
      "Удобно для теста нескольких гипотез",
      "Можно сравнить разные офферы и выбрать сильнейший",
    ],
    tg: "5 генераций — 1990₽",
    borderClass: "border-primary/60",
  },
  {
    id: "system",
    count: 10,
    name: "Система",
    subtitle: "Для регулярной сборки лендингов",
    price: "2 990",
    perUnit: "299₽ за 1 прототип",
    savings: "Экономия 1 910₽ по сравнению с покупкой по одной",
    badge: null,
    highlight: false,
    features: [
      "10 полных прототипов лендинга",
      "19 смысловых блоков с копирайтингом в каждом",
      "Перегенерация любого блока",
      "Экспорт в Markdown",
      "Кредиты не сгорают",
      "Максимальная выгода за 1 генерацию",
      "Подходит для маркетологов, продюсеров и агентств",
      "Удобно для регулярной работы с продуктами и гипотезами",
    ],
    tg: "10 генераций — 2990₽",
    borderClass: "border-money/40",
  },
];

/** Keep thousands grouped: "1 990" → "1\u00A0990" */
function nbMoney(value: string): string {
  return value.replace(/(\d)\s+(\d)/g, "$1\u00A0$2");
}

function PackageCta({ count, price }: { count: number; price: string }) {
  const amount = `${nbMoney(price)}₽`;
  if (count === 1) {
    return <span className="whitespace-nowrap tabular-nums">Попробовать за {amount}</span>;
  }
  return (
    <span className="flex flex-col items-center gap-0.5 leading-tight">
      <span>Купить {count} генераций</span>
      <span className="whitespace-nowrap tabular-nums font-bold">{amount}</span>
    </span>
  );
}

function generationLabel(count: number): string {
  if (count === 1) return "1 генерация";
  if (count >= 2 && count <= 4) return `${count} генерации`;
  return `${count} генераций`;
}

function openPurchase(tg: string) {
  window.open(`https://t.me/d_pishalking?text=${encodeURIComponent("Хочу купить: " + tg)}`, "_blank");
}

export default function Pricing() {
  const { balance, loading } = useCredits();

  if (!CREDITS_ENABLED) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-lg text-center rounded-3xl border border-border bg-card/80 p-10 backdrop-blur"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            <Zap className="h-3.5 w-3.5" />
            Сейчас бесплатно
          </motion.div>
          <h1 className="font-display text-2xl font-bold mb-3">Оплата пока не подключена</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Аудит сайта, прототипы лендинга и обратная связь доступны без покупки генераций.
            Когда включим тарифы — сообщим на сайте.
          </p>
          <motion.div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-gradient-money text-primary-foreground shadow-glow">
              <Link to="/">Сделать аудит сайта</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/prototype">Собрать прототип</Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]"
        />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-money/6 blur-[100px]" />
      </motion.div>

      <motion.div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/prototype"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Назад к конструктору
          </Link>

          <motion.div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
              <Zap className="h-3.5 w-3.5" />
              Кредиты на генерации
            </div>
            <h1 className="font-display text-3xl font-bold md:text-4xl mb-3">
              Выберите пакет
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Один кредит = один полный прототип лендинга (19 блоков с копирайтингом).
              Кредиты не сгорают.
            </p>
            {!loading && balance !== null && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 text-money" />
                Текущий баланс:{" "}
                <span className="font-bold text-foreground">
                  {balance} кредит{balance === 1 ? "" : balance >= 2 && balance <= 4 ? "а" : "ов"}
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Packages */}
        <div className="grid gap-5 md:grid-cols-3 mb-10 pt-2 max-w-5xl mx-auto">
          {PACKAGES.map((pkg, i) => (
            <Reveal key={pkg.id} delay={i * 60}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border-2 ${pkg.borderClass} bg-card/70 p-6 backdrop-blur transition-transform duration-300 ${
                  pkg.highlight
                    ? "z-10 shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_28px_70px_-24px_hsl(var(--primary)/0.35)] xl:scale-[1.03] xl:-my-1"
                    : ""
                }`}
              >
                {pkg.badge && (
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/30 bg-gradient-money px-3.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-glow whitespace-nowrap"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {pkg.badge}
                  </motion.div>
                )}

                <div className={pkg.badge ? "pt-3" : ""}>
                  <h2 className="font-display text-xl font-bold text-foreground">{pkg.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{pkg.subtitle}</p>
                </div>

                <p className="mt-4 text-sm font-semibold text-foreground/90">
                  {generationLabel(pkg.count)}
                </p>

                <div className="mt-3 mb-4">
                  <div className="font-display text-3xl font-bold tabular-nums whitespace-nowrap">
                    {nbMoney(pkg.price)}₽
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{nbMoney(pkg.perUnit)}</p>
                  {pkg.savings && (
                    <p className="text-xs font-medium text-money mt-1.5 leading-snug">{nbMoney(pkg.savings)}</p>
                  )}
                </div>

                {pkg.hint && (
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 -mt-1 border-l-2 border-primary/40 pl-3">
                    {pkg.hint}
                  </p>
                )}

                <ul className="space-y-2 mb-6 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-foreground/80 leading-snug">
                      <CheckCircle2 className="h-3.5 w-3.5 text-money shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full min-h-11 rounded-xl font-semibold text-xs sm:text-sm px-3 h-auto py-2.5 ${
                    pkg.highlight
                      ? "bg-gradient-money text-primary-foreground shadow-glow hover:opacity-95"
                      : "bg-card border border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  }`}
                  onClick={() => openPurchase(pkg.tg)}
                >
                  <PackageCta count={pkg.count} price={pkg.price} />
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground leading-relaxed">
                  Нажимая кнопку, вы принимаете{" "}
                  <Link to="/oferta" className="underline hover:text-foreground transition-colors">
                    условия оферты
                  </Link>{" "}
                  и{" "}
                  <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                    политику конфиденциальности
                  </Link>
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* What is 1 generation */}
        <Reveal>
          <div className="rounded-2xl border border-border bg-card/50 px-6 py-6 backdrop-blur mb-5">
            <h2 className="font-display text-lg font-bold mb-2">Что входит в одну генерацию?</h2>
            <p className="text-sm text-foreground/85 leading-relaxed">
              <strong>1 генерация = 1 полный прототип лендинга:</strong> структура страницы, оффер,
              заголовки, смысловые блоки, CTA, аргументы, копирайтинг и экспорт в Markdown.
            </p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Это не просто текст. Это основа лендинга, которую можно передать дизайнеру,
              разработчику или сразу доработать под запуск.
            </p>
          </div>
        </Reveal>

        {/* Trust block */}
        <Reveal>
          <motion.div
            className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 backdrop-blur mb-5"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-base font-bold mb-3">Важно перед оплатой</h2>
            <ul className="space-y-2.5">
              {[
                {
                  title: "Кредиты не сгорают",
                  text: "— можно использовать генерации тогда, когда появится задача.",
                },
                {
                  title: "Оплата один раз",
                  text: "— это не подписка и не скрытое списание.",
                },
                {
                  title: "Можно перегенерировать блоки",
                  text: "— если формулировка не попала в задачу с первого раза.",
                },
              ].map(({ title, text }) => (
                <li key={title} className="text-sm text-foreground/85">
                  <strong className="text-foreground">{title}</strong> {text}
                </li>
              ))}
            </ul>
          </motion.div>
        </Reveal>

        {/* Manual vs service */}
        <Reveal>
          <div className="grid gap-4 md:grid-cols-2 mb-10">
            <div className="rounded-2xl border border-border bg-card/40 px-5 py-5">
              <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
                Собирать вручную
              </h3>
              <ul className="space-y-2">
                {[
                  "несколько часов на структуру",
                  "отдельно думать над оффером",
                  "отдельно писать блоки",
                  "сложно быстро сравнить гипотезы",
                  "легко застрять на первом экране",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Minus className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <motion.div
              className="rounded-2xl border border-money/30 bg-money/5 px-5 py-5"
              whileHover={{ borderColor: "hsl(var(--money) / 0.5)" }}
            >
              <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-money shrink-0" />
                Через сервис
              </h3>
              <ul className="space-y-2">
                {[
                  "прототип за несколько минут",
                  "19 готовых смысловых блоков",
                  "можно быстро сравнить разные подходы",
                  "экспорт в Markdown",
                  "проще передать в разработку или дизайн",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                    <CheckCircle2 className="h-3.5 w-3.5 text-money shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </Reveal>

        <Reveal>
          <div className="rounded-2xl border border-money/30 bg-money/5 px-6 py-5 backdrop-blur">
            <p className="font-semibold text-sm mb-3 text-foreground">📦 Как вы получите заказ</p>
            <ol className="space-y-2">
              {[
                "Нажмите «Купить» и оплатите выбранный пакет",
                "После подтверждения оплаты кредиты зачисляются на ваш аккаунт автоматически — в течение нескольких минут",
                "Перейдите в конструктор прототипа и нажмите «Собрать прототип» — спишется 1 кредит",
                "Готовый прототип лендинга (19 блоков) доступен сразу на экране и по ссылке",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-money/20 text-[10px] font-bold text-money">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal>
          <motion.div
            className="mt-5 rounded-2xl border border-border bg-card/40 px-6 py-5 backdrop-blur flex flex-col gap-3 md:flex-row md:items-center md:gap-6"
          >
            <MessageCircle className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">Оплата вручную</p>
              <p className="text-sm text-muted-foreground">
                Напишите в Telegram с пометкой «кредиты + пакет» — пополним баланс в течение нескольких минут.
                Принимаем перевод на карту или СБП.
              </p>
            </div>
            <a href="https://t.me/d_pishalking" target="_blank" rel="noreferrer">
              <Button variant="outline" className="rounded-xl shrink-0">
                Написать в Telegram
              </Button>
            </a>
          </motion.div>
        </Reveal>

        <Reveal>
          <div className="mt-5 rounded-2xl border border-border bg-card/40 px-6 py-5 backdrop-blur">
            <p className="font-semibold text-sm mb-3">Контакты</p>
            <motion.div className="grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
              <a href="tel:+79112394471" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <span className="text-primary">📞</span> +7 (911) 239-44-71
              </a>
              <a href="mailto:tvtska@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <span className="text-primary">✉️</span> tvtska@gmail.com
              </a>
              <a
                href="https://t.me/d_pishalking"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <span className="text-primary">💬</span> @d_pishalking
              </a>
            </motion.div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { q: "Кредиты сгорают?", a: "Нет. Купленные кредиты хранятся на аккаунте бессрочно." },
              {
                q: "Что считается одной генерацией?",
                a: "Создание нового прототипа (19 блоков). Перегенерация отдельного блока кредиты не тратит.",
              },
              {
                q: "Почему это выгодно?",
                a: "Фрилансер-копирайтер берёт 5 000–15 000₽ за один лендинг, маркетолог — от 30 000₽. Здесь то же самое от 299₽ за генерацию в пакете «Система».",
              },
              {
                q: "Можно вернуть деньги?",
                a: "Да — если прототип не сгенерировался по технической причине. Напишите в Telegram, разберёмся.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card/40 px-5 py-4">
                <p className="font-semibold text-sm mb-1">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </motion.div>

      <footer className="mt-12 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4">
          <span>ИП Можарова А.Н. · ИНН 222391963986 · ОГРНИП 324774600700724</span>
          <a href="tel:+79112394471" className="hover:text-foreground transition-colors">
            +7 (911) 239-44-71
          </a>
          <a href="mailto:tvtska@gmail.com" className="hover:text-foreground transition-colors">
            tvtska@gmail.com
          </a>
          <Link to="/oferta" className="hover:text-foreground transition-colors">
            Оферта
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Конфиденциальность
          </Link>
        </div>
      </footer>
    </main>
  );
}
