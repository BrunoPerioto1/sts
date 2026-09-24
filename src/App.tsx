import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ApostasPage = lazy(() => import("./pages/ApostasPage"));
const CasasPage = lazy(() => import("./pages/CasasPage").then((m) => ({ default: m.CasasPage })));
const ConferirPage = lazy(() => import("./pages/ConferirPage"));
const ConferirPendentesPage = lazy(() => import("./pages/ConferirPendentesPage"));
const TipsPage = lazy(() => import("./pages/TipsPage"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const AccountPage = lazy(() => import("./pages/perfil/AccountPage"));
const PasswordPage = lazy(() => import("./pages/perfil/PasswordPage"));
const TelegramPage = lazy(() => import("./pages/perfil/TelegramPage"));
const PreferencesPage = lazy(() => import("./pages/perfil/PreferencesPage"));
const DashboardPreferencesPage = lazy(() => import("./pages/perfil/DashboardPreferencesPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminTipsPage = lazy(() => import("./pages/AdminTipsPage"));
const AdminHousesPage = lazy(() => import("./pages/AdminHousesPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const RenovarPage = lazy(() => import("./pages/RenovarPage"));
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { clearToken, getToken } from '@/lib/auth-session';
import { useMe } from '@/hooks/queries/use-me';
import { ADMIN_ROLE_ID } from '@/lib/admin-health';

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
  // Escuro e o padrao: quem nunca escolheu continua vendo o app como sempre.
  // attribute="class" poe `dark`/`light` no <html>, que e o que o index.css le.
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
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
          <Route path="/profile/password" element={<RequireAuth><PasswordPage /></RequireAuth>} />
          <Route path="/profile/telegram" element={<RequireAuth><TelegramPage /></RequireAuth>} />
          <Route path="/profile/preferences" element={<RequireAuth><PreferencesPage /></RequireAuth>} />
          <Route path="/profile/dashboard" element={<RequireAuth><DashboardPreferencesPage /></RequireAuth>} />
          <Route path="/bets" element={<RequireAuth><ApostasPage /></RequireAuth>} />
          <Route path="/settlement" element={<RequireAuth><ConferirPage /></RequireAuth>} />
          <Route path="/settlement/review" element={<RequireAuth><ConferirPendentesPage /></RequireAuth>} />
          <Route path="/houses" element={<RequireAuth><CasasPage /></RequireAuth>} />
          <Route path="/tips" element={<RequireAuth><TipsPage /></RequireAuth>} />
          <Route path="/admin" element={<Navigate to="/admin/pipeline" replace />} />
          <Route path="/admin/pipeline" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/admin/houses" element={<RequireAdmin><AdminHousesPage /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
          <Route path="/admin/tips" element={<RequireAdmin><AdminTipsPage /></RequireAdmin>} />
        </Route>
        {}
        <Route path="/logout" element={<LogoutRoute />} />
        <Route path="/renovar" element={<Suspense fallback={<RouteFallback />}><RenovarPage /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;

/** Troca de rota: barras no lugar do conteúdo, não um "Carregando…" solto. */
function RouteFallback() {
  return (
    <div className="p-6 space-y-4" role="status" aria-label="Carregando">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-4 w-64" delay={60} />
      <Skeleton className="h-48 w-full rounded-lg" delay={120} />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

/**
 * Rota de admin. O papel vem do /users/me, entao enquanto o me nao carregou a
 * tela mostra o fallback — redirecionar nesse intervalo jogaria o proprio admin
 * pro dashboard toda vez que ele abrisse /admin direto pela URL.
 *
 * Isto e' so' a casca: quem barra de verdade e' o AdminGuard do backend, que
 * responde 403 pras rotas /admin independentemente do que a tela faca.
 */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? getToken() : null;
  const { me } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (!me) return <RouteFallback />;
  if (me.roleId !== ADMIN_ROLE_ID) return <Navigate to="/dashboard" replace />;

  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function LogoutRoute() {
  useEffect(() => {
    queryClient.clear();
    clearToken();
  }, []);
  return <Navigate to="/login" replace />;
}
