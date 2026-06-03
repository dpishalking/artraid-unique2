import type { ReactNode } from "react";
import { motion } from "framer-motion";

function ScenarioVisualFrame({
  children,
  gradient,
}: {
  children: ReactNode;
  gradient: string;
}) {
  return (
    <motion.div
      className={`mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 shadow-inner ${gradient}`}
      aria-hidden
    >
      {children}
    </motion.div>
  );
}

export function ScenarioVisual({ id, selected }: { id: string; selected: boolean }) {
  const scale = selected ? 1.06 : 1;
  const spring = { type: "spring" as const, stiffness: 400, damping: 22 };

  switch (id) {
    case "cold_traffic":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-sky-500/55 to-blue-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-sky-300" animate={{ scale }} transition={spring}>
            <circle cx="24" cy="24" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="24" cy="24" r="5" fill="currentColor" className="text-sky-400" />
            <path d="M24 5v5M24 38v5M5 24h5M38 24h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </motion.svg>
        </ScenarioVisualFrame>
      );
    case "product_card":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-violet-500/55 to-purple-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-violet-300" animate={{ scale }} transition={spring}>
            <rect x="9" y="13" width="30" height="22" rx="4" fill="rgba(167,139,250,0.25)" stroke="currentColor" strokeWidth="2" />
            <rect x="13" y="19" width="12" height="3" rx="1" fill="currentColor" />
            <rect x="13" y="25" width="18" height="2" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="13" y="29" width="14" height="2" rx="1" fill="currentColor" opacity="0.4" />
            <circle cx="33" cy="17" r="4" fill="#a78bfa" />
          </motion.svg>
        </ScenarioVisualFrame>
      );
    case "hypothesis_test":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-amber-500/55 to-orange-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-amber-300" animate={{ scale }} transition={spring}>
            <path d="M8 36V24l7-6 7 5 10-12v25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="37" cy="13" r="5" fill="#fbbf24" />
            <path d="M35 13h4M37 11v4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
          </motion.svg>
        </ScenarioVisualFrame>
      );
    case "consultation_lead":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-emerald-500/55 to-teal-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-emerald-300" animate={{ scale }} transition={spring}>
            <rect x="10" y="15" width="28" height="19" rx="4" fill="rgba(52,211,153,0.2)" stroke="currentColor" strokeWidth="2" />
            <circle cx="19" cy="25" r="4" fill="#34d399" />
            <path d="M27 23h11M27 27h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            <path d="M18 9v4M30 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </motion.svg>
        </ScenarioVisualFrame>
      );
    case "product_sale":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-rose-500/55 to-pink-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-rose-300" animate={{ scale }} transition={spring}>
            <path d="M15 19h20l-2 17H17L15 19z" fill="rgba(251,113,133,0.25)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M19 19c0-3.5 2.5-7 5-7s5 3.5 5 7" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="33" cy="13" r="6" fill="hsl(var(--primary))" />
            <text x="33" y="16" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="8" fontWeight="700">₽</text>
          </motion.svg>
        </ScenarioVisualFrame>
      );
    case "webinar":
      return (
        <ScenarioVisualFrame gradient="bg-gradient-to-br from-fuchsia-500/55 to-violet-700/25">
          <motion.svg viewBox="0 0 48 48" className="h-9 w-9 text-fuchsia-300" animate={{ scale }} transition={spring}>
            <rect x="8" y="14" width="32" height="22" rx="3" fill="rgba(217,70,239,0.2)" stroke="currentColor" strokeWidth="2" />
            <path d="M22 22l9 5-9 5V22z" fill="currentColor" />
            <circle cx="37" cy="11" r="4" fill="#ef4444" />
          </motion.svg>
        </ScenarioVisualFrame>
      );
    default:
      return null;
  }
}
