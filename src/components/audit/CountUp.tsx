import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  /** Извлекаем число из строки и анимируем его. Префикс/суффикс ("−", "%") сохраняем. */
  value: string;
  /** Длительность анимации, сек. */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** Парсим первое число из строки. Возвращаем [prefix, number, suffix]. */
function splitNumeric(input: string): { prefix: string; number: number | null; suffix: string } {
  const match = input.match(/(-?\d+(?:[.,]\d+)?)/);
  if (!match) return { prefix: input, number: null, suffix: "" };
  const raw = match[1].replace(",", ".");
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return { prefix: input, number: null, suffix: "" };
  const idx = match.index ?? 0;
  return {
    prefix: input.slice(0, idx),
    number: n,
    suffix: input.slice(idx + match[1].length),
  };
}

/** Считалка: анимирует первое число в строке от 0 до целевого значения при появлении в кадре. */
export function CountUp({ value, duration = 1.2, className, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const { prefix, number, suffix } = splitNumeric(value);
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => {
    if (number == null) return value;
    const isInt = Number.isInteger(number);
    const formatted = isInt ? Math.round(latest).toString() : latest.toFixed(1);
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (!inView || number == null) return;
    const controls = animate(motionValue, number, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, number, duration, motionValue]);

  if (number == null) {
    return (
      <span ref={ref} className={className} style={style}>
        {value}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={className} style={style}>
      {display}
    </motion.span>
  );
}
