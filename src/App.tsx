import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/DashboardLayout";

// Agile Velocity pages
import SprintBoard from "./pages/SprintBoard";
import MarketingBacklog from "./pages/MarketingBacklog";
import SprintManager from "./pages/SprintManager";
import AssetGallery from "./pages/AssetGallery";
import CampaignPulse from "./pages/CampaignPulse";

// Existing pages (re-used / adapted)
import CalendarModule from "./pages/CalendarModule";
import PlatformMetrics from "./pages/PlatformMetrics";
import TeamRoles from "./pages/TeamRoles";
import SettingsModule from "./pages/SettingsModule";
import WorkflowsPage from "./pages/WorkflowsPage";
import StakeholderPortal from "./pages/StakeholderPortal";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Legacy pages still accessible via direct URL
import DashboardHome from "./pages/DashboardHome";
import TaskManager from "./pages/TaskManager";
import ClassesPipeline from "./pages/ClassesPipeline";
import InstructorCRM from "./pages/InstructorCRM";
import DocumentLibrary from "./pages/DocumentLibrary";
import IdeasBacklog from "./pages/IdeasBacklog";
import EventsManager from "./pages/EventsManager";
import Partnerships from "./pages/Partnerships";
import BudgetExpenses from "./pages/BudgetExpenses";
import LegalCompliance from "./pages/LegalCompliance";
import AuditTrail from "./pages/AuditTrail";
import ChecklistsPage from "./pages/ChecklistsPage";
import ForecastingPage from "./pages/ForecastingPage";
import GanttPage from "./pages/GanttPage";
import MeetingNotes from "./pages/MeetingNotes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              {/* Agile Velocity — primary routes */}
              <Route path="/" element={<SprintBoard />} />
              <Route path="/sprint" element={<SprintBoard />} />
              <Route path="/backlog" element={<MarketingBacklog />} />
              <Route path="/sprints" element={<SprintManager />} />
              <Route path="/calendar" element={<CalendarModule />} />
              <Route path="/assets" element={<AssetGallery />} />
              <Route path="/campaign-pulse" element={<CampaignPulse />} />
              <Route path="/metrics" element={<PlatformMetrics />} />
              <Route path="/team" element={<TeamRoles />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/settings" element={<SettingsModule />} />

              {/* Legacy routes */}
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/classes" element={<ClassesPipeline />} />
              <Route path="/instructors" element={<InstructorCRM />} />
              <Route path="/documents" element={<DocumentLibrary />} />
              <Route path="/ideas" element={<IdeasBacklog />} />
              <Route path="/events" element={<EventsManager />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/budget" element={<BudgetExpenses />} />
              <Route path="/legal" element={<LegalCompliance />} />
              <Route path="/audit" element={<AuditTrail />} />
              <Route path="/checklists" element={<ChecklistsPage />} />
              <Route path="/forecasting" element={<ForecastingPage />} />
              <Route path="/gantt" element={<GanttPage />} />
              <Route path="/meeting-notes" element={<MeetingNotes />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/portal" element={<StakeholderPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
