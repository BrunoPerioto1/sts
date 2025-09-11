import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { DashboardPage } from "./pages/DashboardPage";
// import { ApostasPage } from "./pages/ApostasPage";
import { CasasPage } from "./pages/CasasPage";
import NovaApostaPage from "./pages/nova-aposta";
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
          <Route path="/perfil" element={<RequireAuth><PerfilPage /></RequireAuth>} />
          {/* <Route path="/apostas" element={<ApostasPage />} /> */}
          <Route path="/nova-aposta" element={<RequireAuth><NovaApostaPage /></RequireAuth>} />
          <Route path="/casas" element={<RequireAuth><CasasPage /></RequireAuth>} />
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
