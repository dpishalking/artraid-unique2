import { Link } from "react-router-dom";
import { Info } from "lucide-react";

type Props = {
  authNext: string;
  variant?: "prototype" | "offer";
};

export function GuestDemoBanner({ authNext, variant = "prototype" }: Props) {
  const label =
    variant === "offer"
      ? "Демо без входа: оффер не привяжется к проекту."
      : "Демо без входа: до 1 прототипа в сутки с этого устройства.";

  return (
    <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
      <span className="inline-flex items-start gap-2">
        <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <span>
          {label}{" "}
          <Link to={`/auth?next=${encodeURIComponent(authNext)}`} className="text-primary font-medium hover:underline">
            Войдите
          </Link>
          , чтобы сохранять в аккаунт и работать из мастерской проекта.
        </span>
      </span>
    </div>
  );
}
