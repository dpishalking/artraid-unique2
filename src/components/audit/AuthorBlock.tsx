import authorPhoto from "@/assets/author.png";
import { AUTHOR_FACTS, AUTHOR_BIO_PARAGRAPH, AUTHOR_ROLE_LINE } from "@/lib/marketing/authorProfile";

export function AuthorBlock({ compact = false }: { compact?: boolean }) {
  return (
    <section data-pdf-section className="mt-2">
      <h3
        className={
          compact
            ? "mb-4 font-display text-xl font-semibold tracking-tight"
            : "mb-5 font-display text-2xl font-bold tracking-tight md:text-3xl"
        }
      >
        {compact ? "Автор разбора" : "Автор сервиса по анализу сайтов"}
      </h3>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 shadow-card backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-money opacity-20 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[260px_1fr] md:items-center">
          <div className="mx-auto md:mx-0">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-money opacity-30 blur-xl" />
              <img
                src={authorPhoto}
                alt="Даниил Пищалкин — маркетолог, автор AI-разбора сайтов"
                className="relative w-full max-w-[260px] rounded-2xl bg-background/40 object-contain"
                loading="lazy"
              />
            </div>
          </div>
          <div>
            <h4 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Даниил Пищалкин
            </h4>
            <p className="mt-1 text-sm font-medium text-primary md:text-base">{AUTHOR_ROLE_LINE}</p>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">{AUTHOR_BIO_PARAGRAPH}</p>
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
    </section>
  );
}