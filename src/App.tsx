import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import TaskManager from "./pages/TaskManager";
import CalendarModule from "./pages/CalendarModule";
import ClassesPipeline from "./pages/ClassesPipeline";
import InstructorCRM from "./pages/InstructorCRM";
import DocumentLibrary from "./pages/DocumentLibrary";
import IdeasBacklog from "./pages/IdeasBacklog";
import EventsManager from "./pages/EventsManager";
import Partnerships from "./pages/Partnerships";
import BudgetExpenses from "./pages/BudgetExpenses";
import PlatformMetrics from "./pages/PlatformMetrics";
import LegalCompliance from "./pages/LegalCompliance";
import TeamRoles from "./pages/TeamRoles";
import SettingsModule from "./pages/SettingsModule";
import AuditTrail from "./pages/AuditTrail";
import LoginPage from "./pages/LoginPage";
import ChecklistsPage from "./pages/ChecklistsPage";
import ForecastingPage from "./pages/ForecastingPage";
import GanttPage from "./pages/GanttPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import StakeholderPortal from "./pages/StakeholderPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/calendar" element={<CalendarModule />} />
            <Route path="/classes" element={<ClassesPipeline />} />
            <Route path="/instructors" element={<InstructorCRM />} />
            <Route path="/documents" element={<DocumentLibrary />} />
            <Route path="/ideas" element={<IdeasBacklog />} />
            <Route path="/events" element={<EventsManager />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/budget" element={<BudgetExpenses />} />
            <Route path="/metrics" element={<PlatformMetrics />} />
            <Route path="/legal" element={<LegalCompliance />} />
            <Route path="/team" element={<TeamRoles />} />
            <Route path="/settings" element={<SettingsModule />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/checklists" element={<ChecklistsPage />} />
            <Route path="/forecasting" element={<ForecastingPage />} />
            <Route path="/gantt" element={<GanttPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portal" element={<StakeholderPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
