import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Props = {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "destructive" | "orange" | "yellow" | "money" | "primary";
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  destructive: "hsl(var(--destructive))",
  orange: "hsl(25 95% 53%)",
  yellow: "hsl(48 95% 53%)",
  money: "hsl(var(--money))",
  primary: "hsl(var(--primary))",
};

export function Donut({ value, max = 10, size = 92, stroke = 8, label, tone }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));

  const auto: NonNullable<Props["tone"]> =
    value <= 3 ? "destructive" : value <= 6 ? "orange" : value <= 8 ? "yellow" : "money";
  const color = TONE[tone ?? auto];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg ref={ref} width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeOpacity={0.35}
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: inView ? c * (1 - pct) : c }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-xl font-bold leading-none"
            style={{ color, fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground">/ {max}</span>
        </div>
      </div>
      {label && (
        <div className="text-center text-xs font-medium text-foreground/85">{label}</div>
      )}
    </div>
  );
}