import { Link } from "react-router-dom";
import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  builderBody,
  builderHeading,
  builderMuted,
  builderWorkspace,
  builderWorkspacePadding,
} from "@/components/builder/builderStyles";

type Props = {
  nextPath?: string;
};

export function BuilderAuthGate({ nextPath = "/prototype" }: Props) {
  const authHref = `/auth?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className={`${builderWorkspace} ${builderWorkspacePadding} max-w-lg mx-auto text-center`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-money shadow-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h1 className={`${builderHeading} text-2xl md:text-3xl mb-2`}>Конструктор прототипа</h1>
      <p className={`${builderBody} text-sm mb-6 leading-relaxed`}>
        Войдите, чтобы собрать лендинг по сценарию — бриф, AI-подсказки и готовый прототип из блоков.
      </p>
      <Button asChild size="lg" className="w-full bg-gradient-money text-primary-foreground font-semibold shadow-glow">
        <Link to={authHref}>
          <LogIn className="mr-2 h-5 w-5" />
          Войти или зарегистрироваться
        </Link>
      </Button>
      <p className={`${builderMuted} text-xs mt-4`}>
        После входа вернётесь на эту страницу автоматически.
      </p>
    </div>
  );
}
