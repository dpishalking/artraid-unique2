import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "icon" | "segmented";
};

export function ThemeToggle({ className, variant = "segmented" }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn("h-9 w-9 shrink-0 border-border/80", className)}
        aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
        title={isDark ? "Светлая тема" : "Тёмная тема"}
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg border border-border/80 bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Тема оформления"
    >
      <button
        type="button"
        disabled={!mounted}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
          !isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Светлая</span>
      </button>
      <button
        type="button"
        disabled={!mounted}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs",
          isDark
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Тёмная</span>
      </button>
    </div>
  );
}
