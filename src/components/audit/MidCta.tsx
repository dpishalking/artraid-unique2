import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type Props = {
  text?: string;
  href?: string;
  onClick?: () => void;
};

/** Эмоциональный мини-CTA после ключевой проблемы — ловит пик ощущения «у меня правда так». */
export function MidCta({
  text = "Хочешь, чтобы это разобрали руками? Скажу за 60 минут, что чинить первым",
  href = "#sec-cta",
  onClick,
}: Props) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      data-pdf-hide
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group flex items-center justify-between gap-4 rounded-xl border border-money/30 bg-money/[0.04] px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-money/[0.07]"
    >
      <span>{text}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-money transition-transform group-hover:translate-x-1" />
    </motion.a>
  );
}
