import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Hypothesis } from "@/lib/hypotheses/api";
import {
  listHypothesesForProject,
  parseHypothesisResult,
  updateHypothesisStatus,
} from "@/lib/hypotheses/api";
import type { HypothesisChannel } from "@/lib/hypotheses/methodology";
import { resolveHypothesisChannel } from "@/lib/hypotheses/methodology";
import { AddHypothesisModal } from "@/components/hypotheses/AddHypothesisModal";
import { HypothesisProtocolModal } from "@/components/hypotheses/HypothesisProtocolModal";
import { ResultModal } from "@/components/hypotheses/ResultModal";
import { WinCardModal } from "@/components/hypotheses/WinCard";
import { ACTIVE_STATUSES, priorityRank } from "@/components/hypotheses/lab/shared";

type AiSeed = { problem: string; channel: HypothesisChannel };

type HypothesisLabContextValue = {
  projectId: string;
  projectName?: string;
  domain?: string;
  hasAudit: boolean;
  reportShareId: string | null;
  loading: boolean;
  hypotheses: Hypothesis[];
  candidates: Hypothesis[];
  auditCandidates: Hypothesis[];
  manualCandidates: Hypothesis[];
  active: Hypothesis[];
  running: Hypothesis[];
  rejected: Hypothesis[];
  knowledge: Hypothesis[];
  reload: () => Promise<void>;
  setProtocolTarget: (h: Hypothesis | null) => void;
  setResultTarget: (h: Hypothesis | null) => void;
  showWinCard: (h: Hypothesis) => void;
  setShowAddModal: (open: boolean) => void;
  setAiSeed: (seed: AiSeed | null) => void;
  aiSeed: AiSeed | null;
  handleStartProgress: (h: Hypothesis) => Promise<void>;
};

const HypothesisLabContext = createContext<HypothesisLabContextValue | null>(null);

export function useHypothesisLab() {
  const ctx = useContext(HypothesisLabContext);
  if (!ctx) throw new Error("useHypothesisLab must be used within HypothesisLabProvider");
  return ctx;
}

type ProviderProps = {
  projectId: string;
  projectName?: string;
  domain?: string;
  hasAudit: boolean;
  reportShareId: string | null;
  children: ReactNode;
};

export function HypothesisLabProvider({
  projectId,
  projectName,
  domain,
  hasAudit,
  reportShareId,
  children,
}: ProviderProps) {
  const [searchParams] = useSearchParams();
  const initialMetricId = searchParams.get("metricId") ?? "";
  const [loading, setLoading] = useState(true);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [protocolTarget, setProtocolTarget] = useState<Hypothesis | null>(null);
  const [resultTarget, setResultTarget] = useState<Hypothesis | null>(null);
  const [winTarget, setWinTarget] = useState<Hypothesis | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiSeed, setAiSeed] = useState<AiSeed | null>(null);

  const reload = useCallback(() => {
    return listHypothesesForProject(projectId)
      .then(setHypotheses)
      .catch(() => toast.error("Не удалось загрузить гипотезы"));
  }, [projectId]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const candidates = useMemo(
    () =>
      hypotheses
        .filter((h) => h.status === "new")
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)),
    [hypotheses],
  );

  const auditCandidates = useMemo(
    () =>
      candidates.filter((h) => {
        const src = (h.source_type ?? "").toLowerCase();
        return src.includes("audit") || src.includes("website");
      }),
    [candidates],
  );

  const manualCandidates = useMemo(
    () => candidates.filter((h) => !auditCandidates.some((a) => a.id === h.id)),
    [candidates, auditCandidates],
  );

  const active = useMemo(
    () => hypotheses.filter((h) => ACTIVE_STATUSES.has(h.status)),
    [hypotheses],
  );

  const running = useMemo(
    () => active.filter((h) => h.status === "selected" || h.status === "in_progress"),
    [active],
  );

  const rejected = useMemo(
    () => hypotheses.filter((h) => h.status === "rejected"),
    [hypotheses],
  );

  const knowledge = useMemo(
    () =>
      hypotheses.filter((h) => {
        const parsed = parseHypothesisResult(h);
        return (
          (h.status === "implemented" || h.status === "won") &&
          (parsed.decision || parsed.insight || parsed.nextAction)
        );
      }),
    [hypotheses],
  );

  const handleStartProgress = async (h: Hypothesis) => {
    try {
      await updateHypothesisStatus(h.id, "in_progress");
      await reload();
    } catch {
      toast.error("Не удалось обновить статус");
    }
  };

  const handleSaved = async (updated: Hypothesis) => {
    await reload();
    if (updated.status === "implemented") setWinTarget(updated);
  };

  const value: HypothesisLabContextValue = {
    projectId,
    projectName,
    domain,
    hasAudit,
    reportShareId,
    loading,
    hypotheses,
    candidates,
    auditCandidates,
    manualCandidates,
    active,
    running,
    rejected,
    knowledge,
    reload,
    setProtocolTarget,
    setResultTarget,
    showWinCard: setWinTarget,
    setShowAddModal,
    setAiSeed,
    aiSeed,
    handleStartProgress,
  };

  return (
    <HypothesisLabContext.Provider value={value}>
      {children}

      <AddHypothesisModal
        projectId={projectId}
        open={showAddModal}
        initialMetricId={initialMetricId}
        onClose={() => setShowAddModal(false)}
        onCreated={(h) => {
          reload().then(() => setProtocolTarget(h));
        }}
      />

      <HypothesisProtocolModal
        hypothesis={protocolTarget}
        open={protocolTarget !== null}
        onClose={() => setProtocolTarget(null)}
        onSaved={reload}
      />

      <ResultModal
        hypothesis={resultTarget}
        open={resultTarget !== null}
        onClose={() => setResultTarget(null)}
        onSaved={handleSaved}
      />

      {winTarget && (
        <WinCardModal
          hypothesis={winTarget}
          domain={domain}
          open={winTarget !== null}
          onClose={() => setWinTarget(null)}
        />
      )}
    </HypothesisLabContext.Provider>
  );
}

export function filterByChannel(
  items: Hypothesis[],
  channel: HypothesisChannel | "all",
): Hypothesis[] {
  if (channel === "all") return items;
  return items.filter((h) => resolveHypothesisChannel(h) === channel);
}
