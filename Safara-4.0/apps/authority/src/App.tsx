import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import Dashboard from "./pages/Dashboard";
import Tourists from "./pages/Tourists";
import Incidents from "./pages/Incidents";
import Zones from "./pages/Zones";
import EFIR from "./pages/EFIR";
import Analytics from "./pages/Analytics";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";
import PredictiveAnalysis from "./pages/PredictiveAnalysis";
// Protected wrapper
// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const auth = localStorage.getItem('sentinelview_auth');
//   return auth ? <>{children}</> : <Navigate to="/login" replace />;
// };

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = localStorage.getItem('sentinelview_auth');
  return auth ? <>{children}</> : <Navigate to="/login" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />

          {/* Protected layout route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Outlet /> {/* Nested protected pages will render here */}
                </DashboardLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tourists" element={<Tourists />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="zones" element={<Zones />} />
            <Route path="efir" element={<EFIR />} />
            <Route path="analytics" element={<Analytics />} />
             <Route path="predictive" element={<PredictiveAnalysis />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

