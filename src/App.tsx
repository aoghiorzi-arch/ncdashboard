import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import TaskManager from "./pages/TaskManager";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/calendar" element={<ComingSoon />} />
            <Route path="/classes" element={<ComingSoon />} />
            <Route path="/instructors" element={<ComingSoon />} />
            <Route path="/documents" element={<ComingSoon />} />
            <Route path="/ideas" element={<ComingSoon />} />
            <Route path="/events" element={<ComingSoon />} />
            <Route path="/partnerships" element={<ComingSoon />} />
            <Route path="/budget" element={<ComingSoon />} />
            <Route path="/metrics" element={<ComingSoon />} />
            <Route path="/legal" element={<ComingSoon />} />
            <Route path="/team" element={<ComingSoon />} />
            <Route path="/settings" element={<ComingSoon />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
