import { Wallet, Search, Filter, Calculator, Send } from "lucide-react";

const BLOCKS = [
  {
    icon: Wallet,
    title: "Где в вашем проекте чистая прибыль?",
    paragraphs: [
      "Давайте честно: все эти пляски с сайтами, трафиком, конверсией, продажами, наймом и аналитикой вы делаете не ради приятного проведения времени.",
      "У вас в кармане должна быть чистая прибыль.",
      "Деньги, которые можно и нужно инвестировать в себя, семью, хобби, новые проекты. Да и просто чтобы мочь выкинуть в окно тысяч 300 и почувствовать себя настоящей рок-звездой. Почему нет?",
      "Но часто у предпринимателя просто не хватает времени и сил, чтобы быть спецом везде. Оно и не надо. И часто в попытках за всем уследить уходит фокус с главного: \n\n\n«Что конкретно делать, чтобы получать деньги себе в карман?»",
    ],
    accent: true,
  },
  {
    icon: Search,
    title: "Что, если я разберу ваш проект?",
    paragraphs: [
      "Как вам идея, если я разберу ваш проект на предмет: «А где, собственно, чистая прибыль в кармане?»",
      "У нас будет около 60 минут. Я денег за эту встречу не возьму.",
      "Мы найдём несколько рычагов вашего роста и определим, при каких показателях в маркетинге и продажах вы реально начнёте зарабатывать деньги себе в карман, а не просто на оплату «существования проекта».",
    ],
  },
  {
    icon: Filter,
    title: "Кого я беру на разбор",
    paragraphs: [
      "Есть ограничение.",
      "Я возьму только те компании, которые уже сейчас работают с трафиком, имеют продажи и хотя бы базовую воронку.",
      "В ином случае я не смогу дать вау-эффект от нашей встречи.",
    ],
  },
  {
    icon: Calculator,
    title: "Почему бесплатно?",
    paragraphs: [
      "Это математика.",
      "Примерно 3 из 10 человек идут со мной в консалтинг на 3–6 месяцев, где мы пересобираем всю систему и делаем по-настоящему прорывные результаты.",
      "Но об этом позже.",
    ],
  },
  {
    icon: Send,
    title: "Как попасть на встречу",
    paragraphs: [
      "Если чувствуете, что готовы честно посмотреть на свою бизнес-модель и хотите уже найти, где деньги лежат, пишите мне в Telegram.",
      "Там договоримся о встрече в Zoom.",
    ],
    cta: true,
  },
];

export function ConsultingOffer({ embedded = false }: { embedded?: boolean }) {
  return (
    <section data-pdf-section className={embedded ? "space-y-4" : "mt-2 space-y-5"}>
      {!embedded && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-money/40 to-transparent" />
          <span className="rounded-full border border-money/40 bg-money/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-money text-center">
            Личное предложение
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-money/40 to-transparent" />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {BLOCKS.map(({ icon: Icon, title, paragraphs, accent, cta }, idx) => {
          const isFirst = idx === 0;
          return (
            <article
              key={title}
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-card backdrop-blur md:p-7 ${
                accent
                  ? "border-money/40 bg-card/70 md:col-span-2"
                  : cta
                    ? "border-primary/40 bg-card/70 md:col-span-2"
                    : "border-border bg-card/60"
              }`}
            >
              {accent && (
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-money opacity-20 blur-3xl" />
              )}
              {cta && (
                <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/30 opacity-30 blur-3xl" />
              )}
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`rounded-xl p-2.5 ${
                      accent || cta
                        ? "bg-gradient-money text-background"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className={`font-display font-bold tracking-tight ${
                      isFirst ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
                    }`}
                  >
                    {title}
                  </h3>
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-foreground/85 md:text-base">
                  {paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                {cta && (
                  <a
                    href="https://t.me/d_pishalking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-money px-6 py-3 text-sm font-semibold text-background shadow-glow transition-transform hover:scale-[1.02] md:text-base"
                  >
                    <Send className="h-4 w-4" />
                    Написать в Telegram
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}