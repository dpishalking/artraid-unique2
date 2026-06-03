import { motion } from "framer-motion";
import type { OfferPurpose } from "@/lib/offer-generator/types";
import { cn } from "@/lib/utils";

type ThumbMeta = {
  gradient: string;
  glow: string;
};

const THUMB_META: Record<OfferPurpose, ThumbMeta> = {
  landing_hero: { gradient: "from-amber-500/25 via-orange-600/10 to-background", glow: "bg-amber-400/20" },
  post: { gradient: "from-violet-500/25 via-purple-600/10 to-background", glow: "bg-violet-400/20" },
  ad: { gradient: "from-rose-500/25 via-pink-600/10 to-background", glow: "bg-rose-400/20" },
  stories_reels: { gradient: "from-fuchsia-500/25 via-pink-500/10 to-background", glow: "bg-fuchsia-400/20" },
  email: { gradient: "from-sky-500/25 via-blue-600/10 to-background", glow: "bg-sky-400/20" },
  telegram_bot: { gradient: "from-cyan-500/25 via-teal-600/10 to-background", glow: "bg-cyan-400/20" },
  consultation: { gradient: "from-emerald-500/25 via-green-600/10 to-background", glow: "bg-emerald-400/20" },
  webinar: { gradient: "from-indigo-500/25 via-violet-600/10 to-background", glow: "bg-indigo-400/20" },
  lead_magnet: { gradient: "from-orange-500/25 via-amber-600/10 to-background", glow: "bg-orange-400/20" },
  commercial_proposal: { gradient: "from-slate-400/20 via-zinc-600/10 to-background", glow: "bg-slate-400/15" },
  presentation: { gradient: "from-blue-500/25 via-indigo-600/10 to-background", glow: "bg-blue-400/20" },
  service: { gradient: "from-teal-500/25 via-emerald-600/10 to-background", glow: "bg-teal-400/20" },
  product: { gradient: "from-yellow-500/20 via-amber-600/10 to-background", glow: "bg-yellow-400/20" },
  custom: { gradient: "from-primary/20 via-primary/5 to-background", glow: "bg-primary/15" },
};

function ThumbArt({ id }: { id: OfferPurpose }) {
  const stroke = "currentColor";
  const fill = "currentColor";

  switch (id) {
    case "landing_hero":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="28" y="12" width="104" height="72" rx="8" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
          <rect x="40" y="24" width="56" height="6" rx="2" fill={fill} opacity="0.9" />
          <rect x="40" y="34" width="80" height="4" rx="1.5" fill={fill} opacity="0.35" />
          <rect x="40" y="42" width="72" height="4" rx="1.5" fill={fill} opacity="0.25" />
          <rect x="40" y="58" width="36" height="14" rx="6" fill={fill} opacity="0.75" />
          <circle cx="118" cy="20" r="3" fill={fill} opacity="0.5" />
        </svg>
      );
    case "post":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="36" y="14" width="88" height="68" rx="10" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
          <circle cx="52" cy="30" r="8" fill={fill} opacity="0.5" />
          <rect x="66" y="26" width="48" height="4" rx="2" fill={fill} opacity="0.7" />
          <rect x="66" y="34" width="40" height="3" rx="1.5" fill={fill} opacity="0.3" />
          <rect x="44" y="48" width="72" height="3" rx="1.5" fill={fill} opacity="0.25" />
          <rect x="44" y="56" width="64" height="3" rx="1.5" fill={fill} opacity="0.2" />
          <path d="M44 72h12M60 72h8" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case "ad":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <circle cx="80" cy="48" r="28" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.2" />
          <circle cx="80" cy="48" r="18" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
          <circle cx="80" cy="48" r="6" fill={fill} opacity="0.8" />
          <path d="M80 20v12M80 64v12M52 48H40M108 48h12" stroke={stroke} strokeWidth="1.5" opacity="0.4" />
          <rect x="98" y="22" width="36" height="24" rx="4" fill={fill} opacity="0.55" />
          <path d="M106 30h20M106 36h14" stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "stories_reels":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="58" y="8" width="44" height="80" rx="10" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.4" />
          <rect x="62" y="14" width="8" height="3" rx="1" fill={fill} opacity="0.9" />
          <rect x="72" y="14" width="8" height="3" rx="1" fill={fill} opacity="0.35" />
          <rect x="82" y="14" width="8" height="3" rx="1" fill={fill} opacity="0.35" />
          <rect x="62" y="22" width="36" height="52" rx="6" fill={fill} opacity="0.2" />
          <circle cx="80" cy="72" r="4" fill={fill} opacity="0.6" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="32" y="28" width="96" height="52" rx="8" fill={fill} fillOpacity="0.15" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <path d="M32 36l48 32 48-32" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
          <rect x="44" y="48" width="72" height="3" rx="1.5" fill={fill} opacity="0.5" />
          <rect x="44" y="56" width="56" height="3" rx="1.5" fill={fill} opacity="0.3" />
          <rect x="44" y="64" width="40" height="3" rx="1.5" fill={fill} opacity="0.2" />
        </svg>
      );
    case "telegram_bot":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="28" y="20" width="72" height="28" rx="10" fill={fill} opacity="0.2" />
          <rect x="60" y="48" width="72" height="28" rx="10" fill={fill} opacity="0.35" />
          <circle cx="48" cy="34" r="10" fill={fill} opacity="0.55" />
          <path d="M44 34l4 4 8-8" stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="72" y="56" width="48" height="3" rx="1.5" fill="hsl(var(--background))" opacity="0.7" />
          <rect x="72" y="64" width="32" height="3" rx="1.5" fill="hsl(var(--background))" opacity="0.45" />
        </svg>
      );
    case "consultation":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="36" y="22" width="48" height="52" rx="8" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
          <rect x="44" y="30" width="32" height="4" rx="2" fill={fill} opacity="0.5" />
          <rect x="44" y="40" width="24" height="20" rx="4" fill={fill} opacity="0.25" />
          <rect x="92" y="28" width="40" height="32" rx="8" fill={fill} fillOpacity="0.3" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <circle cx="112" cy="44" r="8" fill={fill} opacity="0.55" />
          <path d="M100 58h24" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case "webinar":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="24" y="32" width="112" height="40" rx="6" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <circle cx="80" cy="52" r="10" fill={fill} opacity="0.45" />
          <path d="M76 50l6 4-6 4V50z" fill="hsl(var(--background))" opacity="0.9" />
          <circle cx="44" cy="78" r="4" fill={fill} opacity="0.35" />
          <circle cx="60" cy="78" r="4" fill={fill} opacity="0.35" />
          <circle cx="100" cy="78" r="4" fill={fill} opacity="0.35" />
          <circle cx="116" cy="78" r="4" fill={fill} opacity="0.35" />
        </svg>
      );
    case "lead_magnet":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="48" y="16" width="64" height="72" rx="6" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="58" y="28" width="44" height="4" rx="2" fill={fill} opacity="0.6" />
          <rect x="58" y="38" width="36" height="3" rx="1.5" fill={fill} opacity="0.3" />
          <rect x="58" y="46" width="40" height="3" rx="1.5" fill={fill} opacity="0.25" />
          <path d="M72 62h20v14H72z" fill={fill} opacity="0.5" />
          <path d="M88 58v22l10-6-10-6z" fill={fill} opacity="0.75" />
        </svg>
      );
    case "commercial_proposal":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="40" y="24" width="80" height="56" rx="6" fill={fill} fillOpacity="0.15" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="52" y="36" width="56" height="4" rx="2" fill={fill} opacity="0.55" />
          <rect x="52" y="46" width="48" height="3" rx="1.5" fill={fill} opacity="0.3" />
          <rect x="52" y="54" width="52" height="3" rx="1.5" fill={fill} opacity="0.25" />
          <rect x="52" y="62" width="40" height="3" rx="1.5" fill={fill} opacity="0.2" />
          <rect x="108" y="18" width="24" height="20" rx="4" fill={fill} opacity="0.45" />
          <path d="M114 28h12M114 32h8" stroke="hsl(var(--background))" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "presentation":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <path d="M48 72h64l-8-40H56l-8 40z" fill={fill} fillOpacity="0.2" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="40" y="20" width="80" height="44" rx="6" fill={fill} fillOpacity="0.25" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="52" y="32" width="24" height="20" rx="2" fill={fill} opacity="0.4" />
          <path d="M84 48l16-12v24l-16-12z" fill={fill} opacity="0.55" />
        </svg>
      );
    case "service":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <circle cx="56" cy="48" r="20" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
          <path d="M56 38v20M46 48h20" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <rect x="88" y="30" width="48" height="40" rx="8" fill={fill} fillOpacity="0.25" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="98" y="42" width="28" height="4" rx="2" fill={fill} opacity="0.55" />
          <rect x="98" y="52" width="20" height="3" rx="1.5" fill={fill} opacity="0.3" />
        </svg>
      );
    case "product":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <path d="M48 40h64l-8 36H56l-8-36z" fill={fill} fillOpacity="0.25" stroke={stroke} strokeWidth="1.5" strokeOpacity="0.35" />
          <path d="M56 40V28h48v12" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.4" />
          <rect x="68" y="52" width="24" height="16" rx="3" fill={fill} opacity="0.4" />
          <circle cx="80" cy="32" r="6" fill={fill} opacity="0.5" />
        </svg>
      );
    case "custom":
      return (
        <svg viewBox="0 0 160 96" className="h-full w-full" aria-hidden>
          <rect x="40" y="20" width="80" height="56" rx="10" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.45" />
          <path d="M52 64l20-20 8 8 20-20" fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx="108" cy="36" r="10" fill={fill} opacity="0.35" />
          <path d="M104 36h8M108 32v8" stroke="hsl(var(--background))" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  id: OfferPurpose;
  selected?: boolean;
  className?: string;
};

export function OfferPurposeThumb({ id, selected, className }: Props) {
  const meta = THUMB_META[id];

  return (
    <div
      className={cn(
        "relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/5",
        `bg-gradient-to-br ${meta.gradient}`,
        selected && "ring-1 ring-primary/40",
        className,
      )}
    >
      <motion.div
        className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl", meta.glow)}
        animate={{ opacity: selected ? 1 : 0.7 }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center px-3 pt-1 text-primary"
        animate={{ scale: selected ? 1.03 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <ThumbArt id={id} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent"
        initial={false}
        animate={{ opacity: selected ? 0.45 : 0.7 }}
      />
    </div>
  );
}
