import { Sparkles } from "lucide-react";
import { getCurrentSiteHost } from "@/constants/site";
import { LegalDocLink } from "@/components/legal/LegalDocLink";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function IdeaLabFooter({ className }: Props) {
  return (
    <footer
      className={cn(
        "relative z-[1] border-t border-border/80 bg-background/70 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-start md:justify-between md:gap-8 lg:px-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-amber-400" aria-hidden />
          <span>
            Idea Lab · <span className="text-muted-foreground">{getCurrentSiteHost()}</span>
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <LegalDocLink doc="oferta" className="transition-colors hover:text-amber-200">
            Оферта
          </LegalDocLink>
          <LegalDocLink doc="privacy" className="transition-colors hover:text-amber-200">
            Конфиденциальность
          </LegalDocLink>
          <a
            href="https://t.me/d_pishalking"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-amber-200"
          >
            Telegram
          </a>
        </nav>

        <div className="text-[11px] leading-relaxed text-muted-foreground md:max-w-sm md:text-right md:text-xs">
          <p className="text-xs font-medium text-foreground/90">ИП Можарова Анастасия Николаевна</p>
          <p className="mt-1.5">ИНН 222391963986 · ОГРНИП 324774600700724</p>
          <p className="mt-1.5 text-[11px] leading-snug md:text-xs">
            Пятницкое шоссе 15к1, кв. 239
          </p>
          <p className="mt-1.5">
            <a
              href="mailto:tvtska@gmail.com"
              className="underline-offset-4 hover:text-amber-200 hover:underline"
            >
              tvtska@gmail.com
            </a>
            {" · "}
            <a href="tel:+79112394471" className="underline-offset-4 hover:text-amber-200 hover:underline">
              +7 (911) 239-44-71
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
