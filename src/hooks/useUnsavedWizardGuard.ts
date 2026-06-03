import { useEffect } from "react";

/** Предупреждение при закрытии вкладки / перезагрузке во время незавершённого wizard. */
export function useUnsavedWizardGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
