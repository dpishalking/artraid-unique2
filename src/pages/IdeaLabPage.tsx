import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { flowExitPersonalCabinet } from "@/lib/navigation/flowExit";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { IdeaCoachChat } from "@/components/ideaLab/IdeaCoachChat";
import { ProjectClarityCard } from "@/components/ideaLab/ProjectClarityCard";
import { ClarityProgress } from "@/components/ideaLab/ClarityProgress";
import { SuggestedNextActions } from "@/components/ideaLab/SuggestedNextActions";
import { IdeaLabSessionControls } from "@/components/ideaLab/IdeaLabSessionControls";
import { IdeaLabServiceGuide } from "@/components/ideaLab/IdeaLabServiceGuide";
import { IdeaLabRoleDetailPanel } from "@/components/ideaLab/IdeaLabRoleDetailPanel";
import { IdeaLabMoreIdeasLocked } from "@/components/ideaLab/IdeaLabMoreIdeasLocked";
import { useIdeaLabQuota } from "@/hooks/useIdeaLabQuota";
import { IDEA_LAB_STAGES } from "@/lib/ideaLab/stages";
import { applyChatResponse, fetchIdeaLabChat, loadIdeaLabState, saveIdeaLabState } from "@/lib/ideaLab/api";
import { calculateClarityPercent } from "@/lib/ideaLab/clarity";
import { syncIdeaLabToProject } from "@/lib/ideaLab/syncToProject";
import type { IdeaLabCard, IdeaLabCoachRole, IdeaLabState, StartupMode } from "@/lib/ideaLab/types";
import { DEFAULT_IDEA_LAB_STATE } from "@/lib/ideaLab/types";
import { buildFreshIdeaLabState } from "@/lib/ideaLab/session";
import { normalizeCoachRole } from "@/lib/ideaLab/roles";
import { getProjectById } from "@/lib/projects/projectApi";
import { isReadyForOfferHandoff } from "@/lib/ideaLab/handoff";
import {
  IDEA_LAB_MESSAGE_LIMIT,
  ideaLabDashboardPath,
  ideaLabIdeasNewPath,
  ideaLabRegisterPath,
  isIdeaLabStandalone,
} from "@/lib/ideaLab/constants";
import {
  ideaLabMessagesRemaining,
  ideaLabUserMessageCount,
  isIdeaLabMessageLimitReached,
} from "@/lib/ideaLab/messageLimit";
import { isIdeaLabProject } from "@/lib/ideaLab/ideaProjects";
import { Button } from "@/components/ui/button";
import { ArrowRight, Megaphone } from "lucide-react";
import { buildIdeaLabServiceUrl } from "@/lib/ideaLab/handoff";

export default function IdeaLabPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [state, setState] = useState<IdeaLabState>(DEFAULT_IDEA_LAB_STATE);
  const [projectName, setProjectName] = useState("");
  const [startupMode, setStartupMode] = useState<StartupMode>("find_idea");

  const { canCreateMore, atIdeaLimit } = useIdeaLabQuota();
  const coachRole = normalizeCoachRole(state.coachRole);
  const userMsgCount = ideaLabUserMessageCount(state);
  const atLimit = isIdeaLabMessageLimitReached(state);
  const remaining = ideaLabMessagesRemaining(state);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getProjectById(projectId);
      if (!data || !isIdeaLabProject(data.project)) {
        toast.error("Идея не найдена");
        nav(ideaLabDashboardPath(), { replace: true });
        return;
      }
      setProjectName(data.project.name);
      const modeRaw = data.project.startup_mode;
      const mode: StartupMode =
        modeRaw === "unclear" ? "find_idea" : ((modeRaw as StartupMode) ?? "find_idea");
      setStartupMode(mode);
      let lab = await loadIdeaLabState(projectId);
      if (lab.messages.length === 0) {
        lab = buildFreshIdeaLabState(mode, lab.coachRole ?? "coach");
        await saveIdeaLabState(projectId, lab);
      } else if (!lab.coachRole) {
        lab = { ...lab, coachRole: "coach" };
      }
      setState(lab);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить диалог");
      nav(ideaLabDashboardPath(), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [projectId, nav]);

  useEffect(() => {
    if (!projectId || authLoading || !user) return;
    void loadProject();
  }, [projectId, authLoading, user, loadProject]);

  if (!authLoading && !user) {
    return <Navigate to="/" replace />;
  }

  if (!projectId) {
    return <Navigate to={ideaLabRegisterPath()} replace />;
  }

  const stageTitle = IDEA_LAB_STAGES.find((s) => s.id === state.stage)?.title ?? state.stage;

  const handleSend = async (text: string) => {
    if (atLimit) {
      toast.message(`Лимит ${IDEA_LAB_MESSAGE_LIMIT} сообщений — откройте карточку или начните новую идею в дашборде`);
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetchIdeaLabChat(projectId, text, state.messages, coachRole);
      const next = await applyChatResponse(projectId, state, text, res);
      setState(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка диалога");
    } finally {
      setChatLoading(false);
    }
  };

  const handleCardEdit = async (key: keyof IdeaLabCard, value: string) => {
    const card = { ...state.card, [key]: value };
    const next: IdeaLabState = {
      ...state,
      card,
      clarityPercent: calculateClarityPercent(card),
    };
    setState(next);
    await saveIdeaLabState(projectId, next);
  };

  const handleSyncFinish = async () => {
    setSyncing(true);
    try {
      await syncIdeaLabToProject(projectId, state.card, {
        ...state,
        completedAt: new Date().toISOString(),
      });
      toast.success("Карточка идеи сохранена");
      if (isIdeaLabStandalone()) {
        nav(ideaLabDashboardPath());
      } else {
        nav(`/projects/${projectId}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSyncing(false);
    }
  };

  const resetDialog = useCallback(
    async (role?: IdeaLabCoachRole) => {
      const nextRole = role ?? coachRole;
      const fresh = buildFreshIdeaLabState(startupMode, nextRole);
      await saveIdeaLabState(projectId, fresh);
      setState(fresh);
      toast.success("Новый диалог — счётчик сообщений сброшен");
    },
    [coachRole, startupMode, projectId],
  );

  const handleNewIdea = () => {
    if (!canCreateMore) {
      nav(ideaLabDashboardPath());
      return;
    }
    nav(ideaLabIdeasNewPath());
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!isIdeaLabStandalone() ? (
        <FlowPageHeader
          exit={flowExitPersonalCabinet()}
          hideExit={false}
          title={`Idea Lab · ${projectName}`}
          className="bg-card/80"
        >
          <span className="hidden text-xs text-muted-foreground sm:inline">{stageTitle}</span>
        </FlowPageHeader>
      ) : (
        <div className="border-b border-amber-500/10 bg-[hsl(220_28%_6%/0.7)] px-4 py-2.5 backdrop-blur-md">
          <div className="container mx-auto flex max-w-6xl items-center justify-between gap-2">
            <Link
              to={ideaLabDashboardPath()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Дашборд идей
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{projectName}</span> · {stageTitle}
            </p>
          </div>
        </div>
      )}

      <div className="border-b border-amber-500/10 bg-gradient-to-r from-amber-500/[0.06] via-transparent to-amber-500/[0.06]">
        <p className="container mx-auto max-w-6xl px-4 py-2 text-center text-xs text-muted-foreground">
          Сообщений в диалоге:{" "}
          <span className={atLimit ? "font-semibold text-amber-600" : "font-medium text-foreground"}>
            {userMsgCount}/{IDEA_LAB_MESSAGE_LIMIT}
          </span>
          {atLimit ? (
            <> — лимит исчерпан. Редактируйте карточку справа или создайте новую идею.</>
          ) : (
            <> · осталось {remaining}</>
          )}
        </p>
      </div>

      <main className="container mx-auto max-w-6xl flex-1 space-y-6 px-4 py-6 md:py-8">
        <ClarityProgress percent={state.clarityPercent} />

        <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
          <div className="min-h-[480px] lg:col-span-3">
            <IdeaCoachChat
              messages={state.messages}
              loading={chatLoading}
              stageTitle={stageTitle}
              onSend={(t) => void handleSend(t)}
              disabled={atLimit}
              projectId={projectId}
              isDemo={false}
              coachRole={coachRole}
              stage={state.stage}
              clarityPercent={state.clarityPercent}
              card={state.card}
            />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <IdeaLabSessionControls
              coachRole={coachRole}
              onRoleChange={(role) => void resetDialog(role)}
              onResetDialog={() => void resetDialog()}
              onNewProject={handleNewIdea}
              hasDialogHistory={state.messages.length > 1}
              showNewProject
              canCreateMoreProject={canCreateMore}
            />
            {atIdeaLimit && <IdeaLabMoreIdeasLocked compact />}
            {state.messages.length <= 1 && (
              <IdeaLabRoleDetailPanel role={coachRole} />
            )}
            <IdeaLabServiceGuide defaultOpen={false} />
            <ProjectClarityCard card={state.card} onEdit={(k, v) => void handleCardEdit(k, v)} />
            {!isIdeaLabStandalone() &&
              isReadyForOfferHandoff(state.stage, state.clarityPercent, state.card) && (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium">Продукт прояснён</p>
                <p className="text-xs text-muted-foreground">
                  Ясность собрана — готовые тексты можно собрать в мастерской, контекст идеи подставится.
                </p>
                <Button asChild size="sm" className="w-full bg-gradient-money text-primary-foreground">
                  <a
                    href={buildIdeaLabServiceUrl(
                      { service: "offer_generator", purpose: "post" },
                      projectId,
                    )}
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Генератор текстов
                    <ArrowRight className="ml-auto h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
            <SuggestedNextActions
              projectId={projectId}
              onSyncAndFinish={() => void handleSyncFinish()}
              syncing={syncing}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
