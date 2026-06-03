import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentSiteHost } from "@/constants/site";

type Props = {
  className?: string;
  /** Дисклеймер для страниц разбора (аудит, шэринг отчёта). */
  showAuditDisclaimer?: boolean;
};

export function SiteChromeFooter({ className, showAuditDisclaimer = false }: Props) {
  return (
    <footer className={cn("mt-auto border-t border-border/50 bg-background/25 backdrop-blur-sm", className)}>
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
        {showAuditDisclaimer && (
          <p className="mx-auto mb-6 max-w-3xl text-center text-xs text-muted-foreground md:text-sm md:leading-relaxed">
            <strong className="font-semibold text-foreground">Важно:</strong> AI-аудит не заменяет полноценную
            стратегическую диагностику, но помогает быстро увидеть очевидные точки роста и получить первые гипотезы
            для улучшения сайта.
          </p>
        )}

        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="h-4 w-4 text-money" aria-hidden />
            <span>{getCurrentSiteHost()}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link to="/oferta" className="transition-colors hover:text-foreground">
              Оферта
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Конфиденциальность
            </Link>
            <a
              href="https://t.me/d_pishalking"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Telegram
            </a>
            <Link to="/audit" className="transition-colors hover:text-foreground">
              Разбор сайта
            </Link>
          </nav>

          <div className="text-[11px] text-muted-foreground md:max-w-xs md:text-right md:text-xs">
            <p>ИП Можарова А.Н.</p>
            <p className="mt-1">ИНН 222391963986 · ОГРНИП 324774600700724</p>
            <p className="mt-1">
              <a href="mailto:tvtska@gmail.com" className="underline-offset-4 hover:text-foreground hover:underline">
                tvtska@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
