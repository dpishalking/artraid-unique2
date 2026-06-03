import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LEGAL_DOCS_REVISION } from "@/lib/legal/entity";
import { ideaLabRegisterPath } from "@/lib/ideaLab/constants";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle: string;
  variant?: "default" | "idea-lab";
  children: React.ReactNode;
};

const prose =
  "prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline";

export function LegalDocumentShell({ title, subtitle, variant = "default", children }: Props) {
  const isIdeaLab = variant === "idea-lab";

  return (
    <div
      className={cn(
        "min-h-0 flex-1",
        isIdeaLab ? "text-foreground" : "min-h-screen bg-background text-foreground",
      )}
    >
      <div className={cn("mx-auto max-w-3xl px-4 py-8 sm:px-6", isIdeaLab ? "pb-4" : "py-16")}>
        {isIdeaLab ? (
          <Link
            to={ideaLabRegisterPath()}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-amber-400/90 transition-colors hover:text-amber-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад в Idea Lab
          </Link>
        ) : null}

        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {subtitle} · Редакция от {LEGAL_DOCS_REVISION}
        </p>

        <div className={cn("mt-8", prose)}>{children}</div>
      </div>
    </div>
  );
}
