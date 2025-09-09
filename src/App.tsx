import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { DashboardPage } from "./pages/DashboardPage";
// import { ApostasPage } from "./pages/ApostasPage";
import { CasasPage } from "./pages/CasasPage";
import NovaApostaPage from "./pages/nova-aposta";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/apostas" element={<ApostasPage />} /> */}
          <Route path="/nova-aposta" element={<NovaApostaPage />} />
          <Route path="/casas" element={<CasasPage />} />
          {}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
