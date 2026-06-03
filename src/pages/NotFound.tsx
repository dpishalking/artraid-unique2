import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/", label: "Главная" },
  { to: "/cabinet", label: "Дашборд" },
  { to: "/audit", label: "Аудит сайта" },
  { to: "/prototype", label: "Прототип лендинга" },
] as const;

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <h1 className="mb-2 font-display text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-muted-foreground">
          Такой страницы нет. Проверьте адрес или выберите раздел ниже.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mb-4">
          {LINKS.map(({ to, label }) => (
            <Button key={to} variant="outline" size="sm" asChild>
              <Link to={to}>{label}</Link>
            </Button>
          ))}
        </div>
        <Button asChild className="bg-gradient-money text-primary-foreground">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    </div>
  );
}
