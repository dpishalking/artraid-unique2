import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-background">
      <ShieldX className="h-12 w-12 text-muted-foreground" />
      <h1 className="font-display text-2xl font-bold">Access denied</h1>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        У вас нет прав для доступа к админ-панели.
      </p>
      <Button asChild variant="outline">
        <Link to="/prototype">Вернуться в сервис</Link>
      </Button>
    </div>
  );
}
