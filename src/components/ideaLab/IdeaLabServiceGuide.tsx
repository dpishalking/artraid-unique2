import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  IDEA_LAB_GUIDE_TITLE,
  IDEA_LAB_SERVICE_INTRO,
  IDEA_LAB_SERVICE_STEPS,
  IDEA_LAB_SERVICE_TIPS,
} from "@/lib/ideaLab/serviceGuide";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

type Props = {
  defaultOpen?: boolean;
  className?: string;
};

export function IdeaLabServiceGuide({ defaultOpen = true, className }: Props) {
  return (
    <div className={cn(il.glass, className)}>
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "guide" : undefined}
      >
        <AccordionItem value="guide" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:pb-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span className={il.goldText}>{IDEA_LAB_GUIDE_TITLE}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0">
            <p className="text-sm leading-relaxed text-muted-foreground">{IDEA_LAB_SERVICE_INTRO}</p>
            <ol className="mt-4 space-y-3">
              {IDEA_LAB_SERVICE_STEPS.map((step) => (
                <li key={step.title}>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className={cn("mt-4", il.label)}>Советы</p>
            <ul className="mt-2 space-y-1.5">
              {IDEA_LAB_SERVICE_TIPS.map((tip) => (
                <li key={tip} className="text-xs leading-relaxed text-muted-foreground">
                  · {tip}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
