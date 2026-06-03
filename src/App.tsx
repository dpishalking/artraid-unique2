import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Audit from "./pages/Audit.tsx";
import NotFound from "./pages/NotFound.tsx";
import Backlog from "./pages/Backlog.tsx";
import PrototypeBacklog from "./pages/PrototypeBacklog.tsx";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { LabLayout } from "@/components/admin/layout/LabLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.tsx";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage.tsx";
import AdminPackagesPage from "./pages/admin/AdminPackagesPage.tsx";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage.tsx";
import AdminCreditsPage from "./pages/admin/AdminCreditsPage.tsx";
import AdminGenerationsPage from "./pages/admin/AdminGenerationsPage.tsx";
import AdminPromptsPage from "./pages/admin/AdminPromptsPage.tsx";
import AdminAuditsPage from "./pages/admin/AdminAuditsPage.tsx";
import AdminIdeaLabPage from "./pages/admin/AdminIdeaLabPage.tsx";
import AdminLogsPage from "./pages/admin/AdminLogsPage.tsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.tsx";
import AdminTokenRedirect from "./pages/admin/AdminTokenRedirect.tsx";
import LabProductsPage from "./pages/admin/lab/LabProductsPage.tsx";
import LabProductNewPage from "./pages/admin/lab/LabProductNewPage.tsx";
import LabProductPage from "./pages/admin/lab/LabProductPage.tsx";
import LabPrototypeNewPage from "./pages/admin/lab/LabPrototypeNewPage.tsx";
import LabPrototypePage from "./pages/admin/lab/LabPrototypePage.tsx";
import LabPromptsPage from "./pages/admin/lab/LabPromptsPage.tsx";
import LpPage from "./pages/lp/LpPage.tsx";
import { StudioLayout } from "@/components/studio/StudioLayout";
import StudioPortalPage from "./pages/studio/StudioPortalPage.tsx";
import StudioResultPage from "./pages/studio/StudioResultPage.tsx";
import SharedReport from "./pages/SharedReport.tsx";
import SharedNicheSnapshot from "./pages/SharedNicheSnapshot.tsx";
import Auth from "./pages/Auth.tsx";
import Builder from "./pages/Builder.tsx";
import BuilderRedirect from "./pages/BuilderRedirect.tsx";
import PrototypeView from "./pages/PrototypeView.tsx";
import MyPrototypes from "./pages/MyPrototypes.tsx";
import Pricing from "./pages/Pricing.tsx";
import Oferta from "./pages/Oferta.tsx";
import Privacy from "./pages/Privacy.tsx";
import Demo from "./pages/Demo.tsx";
import OfferGeneratorPage from "./pages/OfferGeneratorPage.tsx";
import ProjectCreatePage from "./pages/projects/ProjectCreatePage.tsx";
import ProjectDashboardPage from "./pages/projects/ProjectDashboardPage.tsx";
import ProjectContextPage from "./pages/projects/ProjectContextPage.tsx";
import ProjectOnboardingPage from "./pages/projects/ProjectOnboardingPage.tsx";
import IdeaLabPage from "./pages/IdeaLabPage.tsx";
import ProjectMemoryPage from "./pages/projects/ProjectMemoryPage.tsx";
import ProjectMemoryQuickPage from "./pages/projects/ProjectMemoryQuickPage.tsx";
import ProjectArtifactsPage from "./pages/projects/ProjectArtifactsPage.tsx";
import ProjectPrototypesPage from "./pages/projects/ProjectPrototypesPage.tsx";
import ProjectHypothesisLabPage from "./pages/projects/ProjectHypothesisLabPage.tsx";
import { HypothesisLabOverview } from "@/components/hypotheses/lab/HypothesisLabOverview";
import { HypothesisLabGenerateView } from "@/components/hypotheses/lab/HypothesisLabGenerateView";
import { HypothesisLabBacklogView } from "@/components/hypotheses/lab/HypothesisLabBacklogView";
import { HypothesisLabActiveView } from "@/components/hypotheses/lab/HypothesisLabActiveView";
import { HypothesisLabResultsView } from "@/components/hypotheses/lab/HypothesisLabResultsView";
import GrowthCyclePage from "./pages/GrowthCyclePage.tsx";
import { HypothesisLabCycleRedirect } from "@/components/hypotheses/lab/HypothesisLabCycleRedirect";
import ProjectFilesPage from "./pages/projects/ProjectFilesPage.tsx";
import ProjectCompetitorsPage from "./pages/projects/ProjectCompetitorsPage.tsx";
import ProjectCompetitorsComparePage from "./pages/projects/ProjectCompetitorsComparePage.tsx";
import ProjectPredictiveModelPage from "./pages/projects/ProjectPredictiveModelPage.tsx";
import ProjectCommercialMetricsPage from "./pages/projects/ProjectCommercialMetricsPage.tsx";
import QuizPage from "./pages/quiz/QuizPage.tsx";
import CabinetDashboardPage from "./pages/CabinetDashboardPage.tsx";
import { PersonalCabinetLayout } from "@/components/navigation/PersonalCabinetLayout";
import { IdeaLabLayout } from "@/components/ideaLab/IdeaLabLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IdeaLabProjectRedirect } from "@/components/ideaLab/IdeaLabProjectRedirect";
import { ProjectRouteGuard } from "@/components/projects/ProjectRouteGuard";
import { ProjectLayout } from "@/components/projects/ProjectLayout";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SuggestIdeaFab } from "@/components/SuggestIdeaFab";
import { ProductNavBar } from "@/components/navigation/ProductNavBar";
import { shouldHideCabinetProductChrome } from "@/lib/surface/isPrimaryAuditSurface";
import { isIdeaLabHost, isForgeStudioHost } from "@/constants/site";
import { IdeaLabAuthGuard } from "@/components/ideaLab/IdeaLabAuthGuard";
import IdeaLabRegisterPage from "./pages/ideaLab/IdeaLabRegisterPage.tsx";
import IdeaLabDashboardPage from "./pages/ideaLab/IdeaLabDashboardPage.tsx";
import IdeaLabNewIdeaPage from "./pages/ideaLab/IdeaLabNewIdeaPage.tsx";
import {
  IDEA_LAB_DASHBOARD_PATH,
  IDEA_LAB_IDEAS_NEW_PATH,
  ideaLabSessionPath,
} from "@/lib/ideaLab/constants";

const queryClient = new QueryClient();

function IdeaLabLegacySessionRedirect() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <Navigate to={IDEA_LAB_DASHBOARD_PATH} replace />;
  return <Navigate to={ideaLabSessionPath(projectId)} replace />;
}

const pageVariants = {
  initial: { opacity: 0, filter: "blur(12px)", scale: 0.99 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, filter: "blur(12px)", scale: 0.99, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

const BUILDER_PATHS = new Set(["/prototype", "/builder", "/quiz", "/lab", "/idea-lab"]);

function ForgeStudioHostRoutes() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route element={<StudioLayout />}>
        <Route path="/:token" element={<StudioPortalPage />} />
        <Route path="/:token/result/:slug" element={<StudioResultPage />} />
        <Route index element={<p className="text-center text-white/50 py-16">Откройте ссылку от команды</p>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function IdeaLabHostRoutes() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route element={<IdeaLabLayout />}>
        <Route index element={<IdeaLabRegisterPage />} />
        <Route
          path="dashboard"
          element={
            <IdeaLabAuthGuard>
              <IdeaLabDashboardPage />
            </IdeaLabAuthGuard>
          }
        />
        <Route
          path="ideas/new"
          element={
            <IdeaLabAuthGuard>
              <IdeaLabNewIdeaPage />
            </IdeaLabAuthGuard>
          }
        />
        <Route
          path="session/:projectId"
          element={
            <IdeaLabAuthGuard>
              <IdeaLabPage />
            </IdeaLabAuthGuard>
          }
        />
        <Route path="lab" element={<Navigate to="/dashboard" replace />} />
        <Route path="idea-lab" element={<Navigate to="/dashboard" replace />} />
        <Route path="oferta" element={<Oferta />} />
        <Route path="privacy" element={<Privacy />} />
      </Route>
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function WorkshopRoutes() {
  const location = useLocation();
  const isBuilder =
    BUILDER_PATHS.has(location.pathname) ||
    location.pathname.startsWith("/quiz") ||
    location.pathname.startsWith("/lab") ||
    location.pathname.startsWith("/idea-lab") ||
    (location.pathname.startsWith("/projects") && !location.pathname.includes("/onboarding"));

  const routes = (
    <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/site" element={<Index />} />
          <Route path="/admin/:token" element={<AdminTokenRedirect />} />
          <Route path="/admin" element={<AdminRouteGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetailPage />} />
              <Route path="idea-lab" element={<AdminIdeaLabPage />} />
              <Route path="audits" element={<AdminAuditsPage />} />
              <Route path="packages" element={<AdminPackagesPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="credits" element={<AdminCreditsPage />} />
              <Route path="generations" element={<AdminGenerationsPage />} />
              <Route path="prompts" element={<AdminPromptsPage />} />
              <Route path="logs" element={<AdminLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            <Route element={<LabLayout />}>
              <Route path="lab" element={<LabProductsPage />} />
              <Route path="lab/prompts" element={<LabPromptsPage />} />
              <Route path="lab/new" element={<LabProductNewPage />} />
              <Route path="lab/products/:id" element={<LabProductPage />} />
              <Route path="lab/products/:id/new-prototype" element={<LabPrototypeNewPage />} />
              <Route path="lab/prototypes/:id" element={<LabPrototypePage />} />
            </Route>
          </Route>
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/backlog/:token" element={<Backlog />} />
          <Route path="/prototype-backlog" element={<PrototypeBacklog />} />
          <Route path="/prototype-backlog/:token" element={<PrototypeBacklog />} />
          <Route path="/r/:shareId/niche-snapshot" element={<SharedNicheSnapshot />} />
          <Route path="/r/:id" element={<SharedReport />} />
          <Route path="/dashboard" element={<Navigate to={IDEA_LAB_DASHBOARD_PATH} replace />} />
          <Route path="/ideas/new" element={<Navigate to={IDEA_LAB_IDEAS_NEW_PATH} replace />} />
          <Route path="/session/:projectId" element={<IdeaLabLegacySessionRedirect />} />
          <Route path="/idea-lab" element={<IdeaLabLayout />}>
            <Route index element={<IdeaLabRegisterPage />} />
            <Route
              path="dashboard"
              element={
                <IdeaLabAuthGuard>
                  <IdeaLabDashboardPage />
                </IdeaLabAuthGuard>
              }
            />
            <Route
              path="ideas/new"
              element={
                <IdeaLabAuthGuard>
                  <IdeaLabNewIdeaPage />
                </IdeaLabAuthGuard>
              }
            />
            <Route
              path="session/:projectId"
              element={
                <IdeaLabAuthGuard>
                  <IdeaLabPage />
                </IdeaLabAuthGuard>
              }
            />
            <Route path="oferta" element={<Oferta />} />
            <Route path="privacy" element={<Privacy />} />
          </Route>
          <Route element={<PersonalCabinetLayout />}>
            <Route path="/cabinet" element={<CabinetDashboardPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/growth-cycle" element={<GrowthCyclePage />} />
            <Route path="/prototype" element={<Builder />} />
            <Route path="/offer-generator" element={<OfferGeneratorPage />} />
            <Route path="/my-prototypes" element={<MyPrototypes />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/projects" element={<ProjectRouteGuard />}>
              <Route index element={<Navigate to="/cabinet" replace />} />
              <Route path="new" element={<ProjectCreatePage />} />
              <Route path=":projectId/onboarding" element={<ProjectOnboardingPage />} />
              <Route path=":projectId/idea-lab" element={<IdeaLabProjectRedirect />} />
              <Route path=":projectId/growth-cycle" element={<GrowthCyclePage />} />
              <Route path=":projectId/hypothesis-lab" element={<ProjectHypothesisLabPage />}>
                <Route index element={<HypothesisLabOverview />} />
                <Route path="cycle" element={<HypothesisLabCycleRedirect />} />
                <Route path="generate" element={<HypothesisLabGenerateView />} />
                <Route path="backlog" element={<HypothesisLabBacklogView />} />
                <Route path="tests" element={<HypothesisLabActiveView />} />
                <Route path="results" element={<HypothesisLabResultsView />} />
              </Route>
              <Route path=":projectId" element={<ProjectLayout />}>
                <Route index element={<ProjectDashboardPage />} />
                <Route path="context" element={<ProjectContextPage />} />
                <Route path="memory" element={<ProjectMemoryPage />} />
                <Route path="memory/quick" element={<ProjectMemoryQuickPage />} />
                <Route path="artifacts" element={<ProjectArtifactsPage />} />
                <Route path="prototypes" element={<ProjectPrototypesPage />} />
                <Route path="predictive" element={<ProjectPredictiveModelPage />} />
                <Route path="commercial-metrics" element={<ProjectCommercialMetricsPage />} />
                <Route path="files" element={<ProjectFilesPage />} />
                <Route path="competitors/compare" element={<ProjectCompetitorsComparePage />} />
                <Route path="competitors" element={<ProjectCompetitorsPage />} />
              </Route>
            </Route>
            <Route path="/p/:id" element={<PrototypeView />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="/lp/:slug" element={<LpPage />} />
          <Route path="/lp/:slug/:step" element={<LpPage />} />
          <Route path="/studio" element={<StudioLayout />}>
            <Route path=":token" element={<StudioPortalPage />} />
            <Route path=":token/result/:slug" element={<StudioResultPage />} />
          </Route>
          <Route path="/builder" element={<BuilderRedirect />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/oferta" element={<Oferta />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
    </Routes>
  );

  const skipPageMotion =
    location.pathname === "/audit" ||
    location.pathname === "/growth-cycle" ||
    location.pathname.includes("/growth-cycle") ||
    location.pathname.startsWith("/r/") ||
    location.pathname.startsWith("/p/") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/studio");

  if (isBuilder || skipPageMotion) {
    return routes;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {routes}
      </motion.div>
    </AnimatePresence>
  );
}

function AnimatedRoutes() {
  if (isForgeStudioHost()) {
    return <ForgeStudioHostRoutes />;
  }
  if (isIdeaLabHost()) {
    return <IdeaLabHostRoutes />;
  }
  return <WorkshopRoutes />;
}

function AppShell() {
  const { pathname } = useLocation();
  const hideCabinetAndToolsNav =
    isIdeaLabHost() ||
    isForgeStudioHost() ||
    shouldHideCabinetProductChrome(pathname);
  return (
    <>
      {!hideCabinetAndToolsNav && <ProductNavBar />}
      <AnimatedRoutes />
      {!hideCabinetAndToolsNav && <SuggestIdeaFab />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AppErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
