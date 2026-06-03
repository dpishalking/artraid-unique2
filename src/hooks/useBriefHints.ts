import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BRIEF_QUESTIONS, questionAcceptsAiHints, type BriefAnswers } from "@/lib/projects/briefStorage";

const BATCH_SIZE = 4;

export type HintFieldStatus = "idle" | "loading" | "ready" | "error";

export function useBriefHints() {
  const [aiHints, setAiHints] = useState<Record<string, string[]>>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, HintFieldStatus>>({});
  const inFlight = useRef<Set<string>>(new Set());
  const aiHintsRef = useRef(aiHints);
  const fieldStatusRef = useRef(fieldStatus);
  aiHintsRef.current = aiHints;
  fieldStatusRef.current = fieldStatus;

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
    async (answers: BriefAnswers, fieldIds: string[]) => {
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

      const niche =
        answers.product_name?.trim() ||
        answers.product_description?.trim() ||
        "продукт или услуга";

      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const fields = batch.map((id) => {
          const q = BRIEF_QUESTIONS.find((x) => x.id === id)!;
          return { id: q.id, label: q.title, helper: q.subtitle };
        });

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

          const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hints`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              niche,
              fields,
              context: answers,
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
            setStatus(batch, "error");
          }
        } catch {
          setStatus(batch, "error");
        } finally {
          batch.forEach((id) => inFlight.current.delete(id));
        }
      }
    },
    [setStatus],
  );

  const prefetchAfterFirstQuestion = useCallback(
    (answers: BriefAnswers) => {
      const ids = BRIEF_QUESTIONS.slice(1, 8)
        .filter((q) => questionAcceptsAiHints(q.inputType))
        .map((q) => q.id)
        .slice(0, 4);
      if (ids.length) void fetchHints(answers, ids);
    },
    [fetchHints],
  );

  const prefetchForStep = useCallback(
    (stepIndex: number, answers: BriefAnswers) => {
      const start = Math.max(1, stepIndex + 1);
      const ids = BRIEF_QUESTIONS.slice(start, start + 8)
        .filter((q) => questionAcceptsAiHints(q.inputType))
        .map((q) => q.id)
        .slice(0, 4);
      if (ids.length) void fetchHints(answers, ids);
    },
    [fetchHints],
  );

  const retryField = useCallback(
    (answers: BriefAnswers, fieldId: string) => {
      inFlight.current.delete(fieldId);
      setFieldStatus((prev) => ({ ...prev, [fieldId]: "idle" }));
      void fetchHints(answers, [fieldId]);
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
    prefetchAfterFirstQuestion,
    prefetchForStep,
    retryField,
    getStatus,
    isLoading,
  };
}
