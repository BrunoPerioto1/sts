import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { DashboardPage } from "./pages/DashboardPage";
import ApostasPage from "./pages/ApostasPage";
import { CasasPage } from "./pages/CasasPage";
import ComparadorPage from "./pages/ComparadorPage";
import PerfilPage from "./pages/PerfilPage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><PerfilPage /></RequireAuth>} />
          <Route path="/bets" element={<RequireAuth><ApostasPage /></RequireAuth>} />
          <Route path="/houses" element={<RequireAuth><CasasPage /></RequireAuth>} />
          <Route path="/comparison" element={<RequireAuth><ComparadorPage /></RequireAuth>} />
          {}
          <Route path="/logout" element={<LogoutRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function LogoutRoute() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  return <Navigate to="/login" replace />;
}
