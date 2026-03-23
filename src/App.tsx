/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/command-center/CommandPalette";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import CommandCenterPage from "./pages/CommandCenter";
import MailPage from "./pages/Mail";
import NotificationsPage from "./pages/Notifications";
import AnalyticsPage from "./pages/Analytics";
import AiCeoPage from "./pages/AiCeo";
import { AiSalesInfoPage } from "./pages/AiSalesInfo";
import { OrgAnalysisPage } from "./pages/OrgAnalysis";
import { TranscriptionPage } from "./pages/Transcription";
import GenContentPage from "./pages/GenContent";
import GenNewsletterPage from "./pages/GenNewsletter";
import Client360Page from "./pages/Client360";
import TasksPage from "./pages/Tasks";
import RoiPage from "./pages/Roi";
import LicencjePage from "./pages/Licencje";
import WdrozeniePage from "./pages/Wdrozenie";
import ProgramowaniePage from "./pages/Programowanie";
import SprzetPage from "./pages/Sprzet";
import OfertaSumPage from "./pages/OfertaSum";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);
  return (
    <I18nProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar onOpenCommandPalette={() => setCmdOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/command-center" element={<CommandCenterPage />} />
              <Route path="/mail" element={<MailPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/ai-ceo" element={<AiCeoPage />} />
              <Route path="/ai-sales-info" element={<AiSalesInfoPage />} />
              <Route path="/org-analysis" element={<OrgAnalysisPage />} />
              <Route path="/org-analysis/:id" element={<OrgAnalysisPage />} />
              <Route path="/transcription" element={<TranscriptionPage />} />
              <Route path="/gen-content" element={<GenContentPage />} />
              <Route path="/gen-newsletter" element={<GenNewsletterPage />} />
              <Route path="/client360" element={<Client360Page />} />
              <Route path="/client360/:accountId" element={<Client360Page />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/roi" element={<RoiPage />} />
              <Route path="/licencje" element={<LicencjePage />} />
              <Route path="/wdrozenie" element={<WdrozeniePage />} />
              <Route path="/programowanie" element={<ProgramowaniePage />} />
              <Route path="/sprzet" element={<SprzetPage />} />
              <Route path="/oferta-sum" element={<OfertaSumPage />} />
              <Route path="/oferta-sum/:summaryId" element={<OfertaSumPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      </div>
    </I18nProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={
                <AuthGuard>
                  <WorkspaceProvider>
                    <AppShell />
                  </WorkspaceProvider>
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
