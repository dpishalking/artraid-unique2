import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LOADING_STEPS } from "@/lib/offer-generator/constants";

export function OfferLoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-6" />
      <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Собираем оффер…</h2>
      <p className="text-muted-foreground text-sm md:text-base mb-8">
        Определяем боль, результат, механизм и лучший угол подачи.
      </p>
      <ul className="w-full space-y-2 text-left">
        {LOADING_STEPS.map((step, i) => (
          <li
            key={step}
            className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
              i === activeStep
                ? "border-primary/50 bg-primary/10 text-foreground font-medium"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
