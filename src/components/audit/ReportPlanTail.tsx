import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AuthorBlock } from "./AuthorBlock";
import { ConsultingOffer } from "./ConsultingOffer";
import { cn } from "@/lib/utils";
import { REPORT_MAX } from "./reportDesign";

/** Хвост вкладки «План»: компактный автор + сворачиваемое личное предложение. */
export function ReportPlanTail() {
  return (
    <div className={cn(REPORT_MAX, "space-y-6 border-t border-border/40 pt-10")}>
      <AuthorBlock compact />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="personal-offer"
          className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-sm backdrop-blur"
        >
          <AccordionTrigger className="px-5 py-4 text-left font-display text-lg font-semibold tracking-tight hover:no-underline md:px-6">
            Личное предложение · разбор с автором
          </AccordionTrigger>
          <AccordionContent className="border-t border-border/40 px-2 pb-4 pt-2 md:px-3">
            <ConsultingOffer embedded />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
