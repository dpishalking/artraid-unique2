import { motion } from "framer-motion";

type Props = {
  numeral: "I" | "II" | "III";
  title: string;
  subtitle: string;
};

export function ActDivider({ numeral, title, subtitle }: Props) {
  return (
    <motion.div
      data-pdf-section
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className="relative my-10 md:my-16"
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/40 to-background/20 px-6 py-10 md:px-12 md:py-14 shadow-card">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[180px] md:text-[260px] font-black leading-none tracking-tighter text-primary/10"
        >
          {numeral}
        </span>
        <div className="relative flex items-center gap-3">
          <span className="h-px w-10 bg-primary/60" />
          <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-primary/80 font-semibold">
            Акт {numeral}
          </span>
        </div>
        <h2 className="relative mt-4 font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="relative mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}