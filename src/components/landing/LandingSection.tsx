import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingSectionVariant = "hero" | "default" | "muted" | "elevated";

type LandingSectionProps = {
  children: ReactNode;
  variant?: LandingSectionVariant;
  className?: string;
  innerClassName?: string;
  id?: string;
  narrow?: boolean;
};

const variantClass: Record<LandingSectionVariant, string> = {
  hero: "bg-background",
  default: "bg-background",
  muted: "border-y border-border/70 bg-muted/20",
  elevated: "border-y border-border bg-card/30",
};

export function LandingSection({
  children,
  variant = "default",
  className,
  innerClassName,
  id,
  narrow = false,
}: LandingSectionProps) {
  return (
    <section id={id} className={cn(variantClass[variant], "py-16 md:py-24", className)}>
      <div className={cn("container mx-auto px-4", narrow && "max-w-4xl", innerClassName)}>{children}</div>
    </section>
  );
}
