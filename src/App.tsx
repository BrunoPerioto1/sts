import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { DashboardPage } from "./pages/DashboardPage";
import ApostasPage from "./pages/ApostasPage";
import { CasasPage } from "./pages/CasasPage";
import PerfilPage from "./pages/PerfilPage";
import AccountPage from "./pages/perfil/AccountPage";
import TelegramPage from "./pages/perfil/TelegramPage";
import PreferencesPage from "./pages/perfil/PreferencesPage";
import { Navigate } from "react-router-dom";

// staleTime alto de proposito: os dados do dashboard sao por usuario e mudam
// so quando ele registra/edita uma aposta. Sem isso o padrao do react-query e
// staleTime 0, que refaz a requisicao a cada montagem e a cada foco de aba.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        {/* Layout route sem path: a casca (sidebar/bottom nav) monta uma vez
            e as telas trocam dentro do <Outlet />. Antes cada pagina montava a
            propria casca, entao ela remontava a cada navegacao. */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><PerfilPage /></RequireAuth>} />
          <Route path="/profile/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="/profile/telegram" element={<RequireAuth><TelegramPage /></RequireAuth>} />
          <Route path="/profile/preferences" element={<RequireAuth><PreferencesPage /></RequireAuth>} />
          <Route path="/bets" element={<RequireAuth><ApostasPage /></RequireAuth>} />
          <Route path="/houses" element={<RequireAuth><CasasPage /></RequireAuth>} />
        </Route>
        {}
        <Route path="/logout" element={<LogoutRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
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
