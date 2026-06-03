import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BRIEF_STEPS } from "@/lib/offer-generator/constants";
import type { OfferBrief } from "@/lib/offer-generator/types";

const BATCH_SIZE = 2;
const HINTS_FETCH_TIMEOUT_MS = 55_000;
const SESSION_TIMEOUT_MS = 8_000;
const STALE_LOADING_MS = 50_000;

export type HintFieldStatus = "idle" | "loading" | "ready" | "error";

type BriefFieldKey = (typeof BRIEF_STEPS)[number]["key"];

function briefToContext(brief: OfferBrief): Record<string, string> {
  const ctx: Record<string, string> = {};
  for (const step of BRIEF_STEPS) {
    const v = brief[step.key];
    if (typeof v === "string" && v.trim()) ctx[step.key] = v.trim();
  }
  if (brief.customPurpose?.trim()) ctx.customPurpose = brief.customPurpose.trim();
  if (brief.offerPurpose) ctx.offerPurpose = brief.offerPurpose;
  return ctx;
}

function nicheFromBrief(brief: OfferBrief): string {
  return (
    brief.productDescription?.trim() ||
    brief.targetAudience?.trim() ||
    brief.customPurpose?.trim() ||
    brief.offerPurpose ||
    "продукт или услуга"
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`${label}: timeout`)), ms);
    promise
      .then((v) => {
        window.clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        window.clearTimeout(t);
        reject(e);
      });
  });
}

export function useOfferHints() {
  const [aiHints, setAiHints] = useState<Record<string, string[]>>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, HintFieldStatus>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inFlight = useRef<Set<string>>(new Set());
  const loadingSince = useRef<Record<string, number>>({});
  const aiHintsRef = useRef(aiHints);
  const fieldStatusRef = useRef(fieldStatus);
  aiHintsRef.current = aiHints;
  fieldStatusRef.current = fieldStatus;

  const clearHints = useCallback(() => {
    setAiHints({});
    setFieldStatus({});
    setFieldErrors({});
    inFlight.current.clear();
    loadingSince.current = {};
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
    async (brief: OfferBrief, fieldKeys: BriefFieldKey[]) => {
      const now = Date.now();
      const missing = fieldKeys.filter((id) => {
        if (aiHintsRef.current[id]?.length) return false;
        const st = fieldStatusRef.current[id];
        if (st === "ready") return false;
        if (st === "loading") {
          const since = loadingSince.current[id] ?? now;
          if (now - since < STALE_LOADING_MS) return false;
        }
        if (inFlight.current.has(id) && st === "loading") {
          const since = loadingSince.current[id] ?? now;
          if (now - since < STALE_LOADING_MS) return false;
        }
        return true;
      });
      if (missing.length === 0) return;

      missing.forEach((id) => {
        inFlight.current.add(id);
        loadingSince.current[id] = now;
      });
      setStatus(missing, "loading");
      setFieldErrors((prev) => {
        const next = { ...prev };
        missing.forEach((id) => delete next[id]);
        return next;
      });

      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE);
        const fields = batch.map((key) => {
          const step = BRIEF_STEPS.find((s) => s.key === key)!;
          return { id: key, label: step.question, helper: step.hint };
        });

        try {
          const { data: { session } } = await withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            "session",
          );
          const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const bearer = session?.access_token ?? anonKey;
          if (!bearer || !import.meta.env.VITE_SUPABASE_URL) {
            setStatus(batch, "error");
            setFieldErrors((prev) => ({
              ...prev,
              ...Object.fromEntries(
                batch.map((id) => [id, "Не настроен Supabase на фронте."]),
              ),
            }));
            continue;
          }

          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), HINTS_FETCH_TIMEOUT_MS);

          const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-hints`, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${bearer}`,
              apikey: anonKey,
            },
            body: JSON.stringify({
              scenario_title: "Генератор офферов",
              fields,
              context: briefToContext(brief),
              niche: nicheFromBrief(brief),
            }),
          });
          window.clearTimeout(timeoutId);

          const data = await r.json().catch(() => ({}));
          if (r.ok && data.hints) {
            setAiHints((prev) => ({ ...prev, ...data.hints }));
            const ready: string[] = [];
            const failed: string[] = [];
            batch.forEach((id) => {
              if ((data.hints[id] as string[] | undefined)?.length) ready.push(id);
              else failed.push(id);
            });
            if (ready.length) setStatus(ready, "ready");
            if (failed.length) {
              setStatus(failed, "error");
              setFieldErrors((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  failed.map((id) => [id, "Модель не вернула примеры — нажмите «Повторить»."]),
                ),
              }));
            }
          } else {
            const msg =
              typeof data?.error === "string"
                ? data.error
                : r.status === 401
                  ? "Войдите в аккаунт или обновите страницу."
                  : r.status === 429
                    ? "Слишком много запросов — подождите минуту."
                    : `Не удалось загрузить примеры (${r.status}).`;
            console.warn("generate-hints:", msg);
            setStatus(batch, "error");
            setFieldErrors((prev) => ({
              ...prev,
              ...Object.fromEntries(batch.map((id) => [id, msg])),
            }));
          }
        } catch (e) {
          const msg =
            e instanceof Error && e.name === "AbortError"
              ? "Запрос занял слишком много времени — нажмите «Повторить»."
              : e instanceof Error
                ? e.message
                : "Не удалось загрузить примеры.";
          console.warn("generate-hints fetch failed:", e);
          setStatus(batch, "error");
          setFieldErrors((prev) => ({
            ...prev,
            ...Object.fromEntries(batch.map((id) => [id, msg])),
          }));
        } finally {
          batch.forEach((id) => {
            inFlight.current.delete(id);
            delete loadingSince.current[id];
          });
        }
      }
    },
    [setStatus],
  );

  const prefetchAfterFirstAnswer = useCallback(
    (brief: OfferBrief) => {
      const keys = BRIEF_STEPS.slice(1, 5).map((s) => s.key);
      void fetchHints(brief, keys);
    },
    [fetchHints],
  );

  const prefetchAdvancedAnswers = useCallback(
    (brief: OfferBrief) => {
      const keys = BRIEF_STEPS.slice(4, 7).map((s) => s.key);
      void fetchHints(brief, keys);
    },
    [fetchHints],
  );

  const retryField = useCallback(
    (brief: OfferBrief, fieldKey: BriefFieldKey) => {
      inFlight.current.delete(fieldKey);
      delete loadingSince.current[fieldKey];
      setFieldStatus((prev) => ({ ...prev, [fieldKey]: "idle" }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      void fetchHints(brief, [fieldKey]);
    },
    [fetchHints],
  );

  const getStatus = useCallback(
    (fieldKey: string): HintFieldStatus => fieldStatus[fieldKey] ?? "idle",
    [fieldStatus],
  );

  const isLoading = useCallback(
    (fieldKey: string) => getStatus(fieldKey) === "loading",
    [getStatus],
  );

  /** Подгрузить подсказки для текущего поля (переход на шаг ≥ 1 брифа). */
  const ensureFieldHints = useCallback(
    (brief: OfferBrief, fieldKey: BriefFieldKey) => {
      void fetchHints(brief, [fieldKey]);
    },
    [fetchHints],
  );

  const getError = useCallback(
    (fieldKey: string): string | undefined => {
      if (getStatus(fieldKey) !== "error") return undefined;
      return (
        fieldErrors[fieldKey] ??
        "Не удалось загрузить примеры. Проверьте вход в аккаунт или попробуйте позже."
      );
    },
    [getStatus, fieldErrors],
  );

  return {
    aiHints,
    clearHints,
    prefetchAfterFirstAnswer,
    prefetchAdvancedAnswers,
    ensureFieldHints,
    retryField,
    getStatus,
    getError,
    isLoading,
  };
}
