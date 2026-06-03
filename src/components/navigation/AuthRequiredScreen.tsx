import { Link, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitHome } from "@/lib/navigation/flowExit";

type Props = {
  title?: string;
  description?: string;
};

export function AuthRequiredScreen({
  title = "Нужен вход в аккаунт",
  description = "Проекты и память маркетинга хранятся в личном кабинете. Войдите или зарегистрируйтесь — после этого вернём на эту страницу.",
}: Props) {
  const location = useLocation();
  const next = `${location.pathname}${location.search}${location.hash}`;
  const authHref = `/auth?next=${encodeURIComponent(next)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FlowPageHeader exit={flowExitHome()} title="Вход" />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <Button asChild size="lg" className="w-full bg-gradient-money text-primary-foreground font-semibold">
            <Link to={authHref}>
              <LogIn className="mr-2 h-5 w-5" />
              Войти или зарегистрироваться
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Вернуться на главную</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
