import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  /** Имя query-параметра (по умолчанию step) */
  param?: string;
};

/**
 * Синхронизирует шаг wizard с history: системная «Назад» ходит по шагам, а не с сайта.
 */
export function useWizardStepHistory(
  step: number,
  setStep: (next: number) => void,
  { enabled = true, param = "step" }: Options = {},
) {
  const skipNextPush = useRef(true);
  const setStepRef = useRef(setStep);
  setStepRef.current = setStep;

  useEffect(() => {
    if (!enabled) return;

    const onPop = (event: PopStateEvent) => {
      const fromState = event.state?.wizardStep;
      if (typeof fromState === "number" && Number.isFinite(fromState)) {
        setStepRef.current(fromState);
        return;
      }
      const fromUrl = Number(new URLSearchParams(window.location.search).get(param));
      if (Number.isFinite(fromUrl) && fromUrl >= 0) {
        setStepRef.current(fromUrl);
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enabled, param]);

  useEffect(() => {
    if (!enabled) return;

    const url = new URL(window.location.href);
    const current = url.searchParams.get(param);
    const next = String(step);

    if (skipNextPush.current) {
      skipNextPush.current = false;
      if (current !== next) {
        url.searchParams.set(param, next);
        window.history.replaceState({ wizardStep: step }, "", url);
      }
      return;
    }

    if (current === next) return;
    url.searchParams.set(param, next);
    window.history.pushState({ wizardStep: step }, "", url);
  }, [step, enabled, param]);
}
