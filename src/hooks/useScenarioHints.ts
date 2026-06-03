import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LandingScenario } from "@/config/landingScenarios";

const BATCH_SIZE = 4;

export type HintFieldStatus = "idle" | "loading" | "ready" | "error";

export function useScenarioHints() {
  const [aiHints, setAiHints] = useState<Record<string, string[]>>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, HintFieldStatus>>({});
  const inFlight = useRef<Set<string>>(new Set());
  const aiHintsRef = useRef(aiHints);
  const fieldStatusRef = useRef(fieldStatus);
  aiHintsRef.current = aiHints;
  fieldStatusRef.current = fieldStatus;

  const clearHints = useCallback(() => {
    setAiHints({});
    setFieldStatus({});
    inFlight.current.clear();
  }, []);

  const setStatus = useCallback((ids: string[], status: HintFieldStatus) => {
    setFieldStatus((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = status;
      });
      return next;
    });
  }, []);

  const fetchHints = useCallback(
    async (scenario: LandingScenario, answers: Record<string, string>, fieldIds: string[]) => {
      const missing = fieldIds.filter((id) => {
        if (inFlight.current.has(id)) return false;
        if (aiHintsRef.current[id]?.length) return false;
        const st = fieldStatusRef.current[id];
        if (st === "ready" || st === "loading") return false;
        return true;
      });
      if (missing.length === 0) return;

      missing.forEach((id) => inFlight.current.add(id));
      setStatus(missing, "loading");

      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const fields = batch.map((id) => {
          const q = scenario.questions.find((x) => x.id === id)!;
          return { id: q.id, label: q.label, helper: q.helperText };
        });

        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hints`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              scenario_title: scenario.title,
              fields,
              context: answers,
              niche:
                answers.product ||
                answers.hypothesis ||
                answers.eventTitle ||
                answers.consultationType ||
                answers.coldAudience ||
                answers.audience ||
                scenario.title,
            }),
          });
          const data = await r.json();
          if (r.ok && data.hints) {
            setAiHints((prev) => ({ ...prev, ...data.hints }));
            const ready: string[] = [];
            const failed: string[] = [];
            batch.forEach((id) => {
              if ((data.hints[id] as string[] | undefined)?.length) ready.push(id);
              else failed.push(id);
            });
            if (ready.length) setStatus(ready, "ready");
            if (failed.length) setStatus(failed, "error");
          } else {
            console.warn("generate-hints:", data.error || r.status);
            setStatus(batch, "error");
          }
        } catch (e) {
          console.warn("generate-hints fetch failed:", e);
          setStatus(batch, "error");
        } finally {
          batch.forEach((id) => inFlight.current.delete(id));
        }
      }
    },
    [setStatus],
  );

  /** После первого ответа — подсказки для следующих 4 вопросов (как раньше после «ниши»). */
  const prefetchAfterFirstQuestion = useCallback(
    (scenario: LandingScenario, answers: Record<string, string>) => {
      const ids = scenario.questions.slice(1, 5).map((q) => q.id);
      if (ids.length) void fetchHints(scenario, answers, ids);
    },
    [fetchHints],
  );

  /** Вторая волна — вопросы 5–8 (как раньше после шага 4). */
  const prefetchAdvancedQuestions = useCallback(
    (scenario: LandingScenario, answers: Record<string, string>) => {
      const ids = scenario.questions.slice(4, 8).map((q) => q.id);
      if (ids.length) void fetchHints(scenario, answers, ids);
    },
    [fetchHints],
  );

  const retryField = useCallback(
    (scenario: LandingScenario, answers: Record<string, string>, fieldId: string) => {
      inFlight.current.delete(fieldId);
      setFieldStatus((prev) => ({ ...prev, [fieldId]: "idle" }));
      void fetchHints(scenario, answers, [fieldId]);
    },
    [fetchHints],
  );

  const getStatus = useCallback(
    (fieldId: string): HintFieldStatus => fieldStatus[fieldId] ?? "idle",
    [fieldStatus],
  );

  const isLoading = useCallback(
    (fieldId: string) => getStatus(fieldId) === "loading",
    [getStatus],
  );

  return {
    aiHints,
    clearHints,
    prefetchAfterFirstQuestion,
    prefetchAdvancedQuestions,
    retryField,
    getStatus,
    isLoading,
  };
}
