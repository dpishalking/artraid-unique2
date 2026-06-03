import { Link } from "react-router-dom";
import { ArrowRight, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildPrototypeFromOfferUrl,
  saveOfferPrototypePrefill,
} from "@/lib/offer-generator/prototypeHandoff";
import type { OfferBrief, OfferResult } from "@/lib/offer-generator/types";

type Props = {
  brief: OfferBrief;
  result: OfferResult;
  projectId?: string;
};

export function OfferPrototypeBanner({ brief, result, projectId }: Props) {
  const href = buildPrototypeFromOfferUrl(projectId);

  return (
    <section className="rounded-2xl border-2 border-primary/35 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent p-5 md:p-6 shadow-[0_12px_40px_-24px_hsl(var(--primary)/0.45)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <LayoutTemplate className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-display text-lg md:text-xl font-bold leading-snug text-foreground">
            Отлично! Оффер составлен
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Давайте сделаю прототип сайта, который останется просто передать дизайнеру
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0 w-full sm:w-auto bg-gradient-money text-primary-foreground font-semibold shadow-glow h-11"
        >
          <Link
            to={href}
            onClick={() => saveOfferPrototypePrefill(brief, result)}
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Собрать прототип лендинга
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
