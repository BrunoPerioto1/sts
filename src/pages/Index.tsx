import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
import { ApostasList } from "@/components/apostas/ApostasList";
import { EditApostaModal } from "@/components/apostas/EditApostaModal";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { CasasApostaView } from "@/components/casas-aposta/CasasApostaView";
import { Target, TrendingUp, TrendingDown, BarChart3, Trash2, CheckSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Aposta {
  id: number;
  evento: string;
  mercado: string;
  odd: number;
  valor: number;
  status: string;
  data: string;
  hora: string;
  casa: string;
  observacoes?: string;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState("apostas");
  const [selectedBets, setSelectedBets] = useState<number[]>([]);
  const [editingAposta, setEditingAposta] = useState<Aposta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

  const normalizeFromBackend = (a: any): Aposta => ({
    id: a.id,
    evento: a.game ?? "",
    mercado: a.market ?? "",
    odd: Number(a.odd ?? 0),
    valor: Number(a.stake ?? 0),
    status: (() => {
      const rid = Number(a.result_id ?? a.resultId ?? 9);
      if (rid === 1) return "ganha";
      if (rid === 2) return "perdida";
      if (rid === 9) return "pendente";
      return "cancelada";
    })(),
    data: a.bet_time ? String(a.bet_time).split(" ")[0] : "",
    hora: a.bet_time ? String(a.bet_time).split(" ")[1] ?? "" : "",
    casa: a.casa_nome ?? a.house ?? "",
    observacoes: a.observacoes ?? a.notes,
  });

  useEffect(() => {
    const loadBets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any[]>("/bets");
        const normalized = data.map(normalizeFromBackend) as Aposta[];
        setApostas(normalized);
      } catch (e: any) {
        setError(e.message || "Falha ao carregar apostas");
      } finally {
        setIsLoading(false);
      }
    };
    const loadResults = async () => {
      try {
        const res = await apiFetch<any[]>("/results");
        const norm = res.map((r: any) => ({ id: Number(r.id), code: String(r.code), name: String(r.name) }));
        setResults(norm);
      } catch {
        // fallback padrão alinhado ao enum
        setResults([
          { id: 1, code: "GANHOU", name: "Ganhou" },
          { id: 2, code: "PERDEU", name: "Perdeu" },
          { id: 3, code: "EMPATE", name: "Empate" },
          { id: 4, code: "ANULADA", name: "Anulada" },
          { id: 5, code: "MEIO_GANHO", name: "Meio ganho" },
          { id: 6, code: "REEMBOLSADA", name: "Reembolsada" },
          { id: 7, code: "MEIO_GANHO_2", name: "Meio ganho (2)" },
          { id: 8, code: "MEIO_PERDIDO", name: "Meio perdido" },
          { id: 9, code: "PENDENTE", name: "Pendente" },
        ]);
      }
    };
    loadBets();
    loadResults();
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async (startDate?: string | null, endDate?: string | null) => {
    setDashboardLoading(true);
    try {
      let url = '/dashboard/metrics';
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const metrics = await apiFetch<any>(url);
      setDashboardMetrics(metrics);
    } catch (e: any) {
      console.error('Erro ao carregar métricas do dashboard:', e.message);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setDateRange({ startDate, endDate });
    loadDashboardMetrics(startDate, endDate);
  };

  const handleApostaAdded = (novaAposta: Aposta) => {
    setApostas([novaAposta, ...apostas]);
  };

  const { toast } = useToast();

  const handleDeleteAposta = async (id: number) => {
    try {
      await apiFetch<void>(`/bets/${id}`, { method: "DELETE" });
      setApostas(apostas.filter(aposta => aposta.id !== id));
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  const handleEditAposta = (aposta: Aposta) => {
    setEditingAposta(aposta);
    setIsEditModalOpen(true);
  };

  const handleApostaUpdated = (updatedAposta: Aposta) => {
    setApostas(apostas.map(aposta => 
      aposta.id === updatedAposta.id ? updatedAposta : aposta
    ));
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const statusToResultId: Record<string, number> = {
      pendente: results.find(r => r.code === "PENDENTE")?.id ?? 9,
      ganha: results.find(r => r.code === "GANHOU")?.id ?? 1,
      perdida: results.find(r => r.code === "PERDEU")?.id ?? 2,
      cancelada: results.find(r => r.code === "ANULADA")?.id ?? 4,
    };
    try {
      await apiFetch(`/bets/finalize/${id}`, {
        method: "PUT",
        body: JSON.stringify({ resultId: statusToResultId[newStatus] ?? 9 }),
      });
      setApostas(apostas.map(aposta => 
        aposta.id === id ? { ...aposta, status: newStatus } : aposta
      ));
      toast({ title: "Status atualizado", description: `Status alterado para ${newStatus}` });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
    }
  };

  const handleSelectBet = (betId: number) => {
    setSelectedBets(prev => 
      prev.includes(betId) 
        ? prev.filter(id => id !== betId)
        : [...prev, betId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBets(selectedBets.length === apostas.length ? [] : apostas.map(a => a.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedBets.length === 0) return;
    try {
      await apiFetch(`/bets/delete-multiple`, {
        method: "DELETE",
        body: JSON.stringify({ apostaIds: selectedBets }),
      });
      setApostas(apostas.filter(aposta => !selectedBets.includes(aposta.id)));
      setSelectedBets([]);
      toast({ title: "Sucesso", description: `${selectedBets.length} aposta(s) excluída(s)` });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedBets.length === 0 || !newStatus) return;
    const statusToResultId: Record<string, number> = {
      pendente: results.find(r => r.code === "PENDENTE")?.id ?? 9,
      ganha: results.find(r => r.code === "GANHOU")?.id ?? 1,
      perdida: results.find(r => r.code === "PERDEU")?.id ?? 2,
      cancelada: results.find(r => r.code === "ANULADA")?.id ?? 4,
    };
    try {
      await apiFetch(`/bets/finalize-multiple`, {
        method: "PUT",
        body: JSON.stringify({ apostaIds: selectedBets, resultId: statusToResultId[newStatus] ?? 9 }),
      });
      setApostas(apostas.map(aposta => 
        selectedBets.includes(aposta.id) 
          ? { ...aposta, status: newStatus }
          : aposta
      ));
      setSelectedBets([]);
      toast({ title: "Status atualizado", description: `${selectedBets.length} aposta(s) alterada(s)` });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
    }
  };

  // Calculate metrics - use backend data when available, fallback to frontend calculation
  const metrics = dashboardMetrics || {
    totalApostas: apostas.length,
    apostasGanhas: apostas.filter(a => a.status === "ganha").length,
    totalInvestido: apostas
      .filter(a => a.status !== "pendente" && a.status !== "cancelada")
      .reduce((acc, aposta) => acc + aposta.valor, 0),
    totalRetorno: apostas
      .filter(a => a.status === "ganha")
      .reduce((acc, aposta) => acc + (aposta.valor * aposta.odd), 0),
    lucroTotal: 0,
    roi: 0,
    taxaAcerto: 0
  };

  // Calculate fallback values if no backend data
  if (!dashboardMetrics) {
    const apostasPerformance = apostas.filter(a => a.status !== "pendente" && a.status !== "cancelada");
    const apostasGanhas = apostas.filter(a => a.status === "ganha").length;
    
    metrics.lucroTotal = metrics.totalRetorno - metrics.totalInvestido;
    metrics.roi = metrics.totalInvestido > 0 ? ((metrics.lucroTotal / metrics.totalInvestido) * 100) : 0;
    metrics.taxaAcerto = apostasPerformance.length > 0 ? ((apostasGanhas / apostasPerformance.length) * 100) : 0;
  }

  const { totalApostas, apostasGanhas, totalInvestido, totalRetorno, lucroTotal, roi, taxaAcerto } = metrics;

  // Chart data
  const chartData = [
    {
      category: "Resumo Financeiro",
      receitas: totalRetorno,
      despesas: totalInvestido
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <DateRangeFilter 
              onDateRangeChange={handleDateRangeChange}
              className="mb-6"
            />
            
            {dashboardLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Carregando métricas...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Apostas"
                    value={totalApostas}
                    icon={<Target className="h-6 w-6" />}
                    trend="neutral"
                  />
                  <MetricCard
                    title="Lucros"
                    value={`${lucroTotal >= 0 ? '+' : ''}R$ ${lucroTotal.toFixed(2)}`}
                    icon={lucroTotal >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                    trend={lucroTotal >= 0 ? "positive" : "negative"}
                  />
                  <MetricCard
                    title="ROI"
                    value={`${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`}
                    icon={<BarChart3 className="h-6 w-6" />}
                    trend={roi >= 0 ? "positive" : "negative"}
                  />
                  <MetricCard
                    title="Taxa de Acerto"
                    value={`${taxaAcerto.toFixed(1)}%`}
                    icon={<Target className="h-6 w-6" />}
                    trend={taxaAcerto >= 50 ? "positive" : "negative"}
                  />
                </div>
                <PerformanceChart data={chartData} />
              </>
            )}
          </div>
        );
      
      case "apostas":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // reload bets
                    (async () => {
                      setIsLoading(true);
                      setError(null);
                      try {
                        const data = await apiFetch<any[]>("/bets");
                        const normalized = data.map(normalizeFromBackend) as Aposta[];
                        setApostas(normalized);
                      } catch (e: any) {
                        setError(e.message || "Falha ao carregar apostas");
                      } finally {
                        setIsLoading(false);
                      }
                    })();
                  }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
                {apostas.length > 0 && (
                  <>
                     <Button
                       variant="outline"
                       onClick={handleSelectAll}
                       className="flex items-center gap-2"
                     >
                       <CheckSquare className="h-4 w-4" />
                       {selectedBets.length === apostas.length ? "Desmarcar Todas" : "Selecionar Todas"}
                     </Button>
                     {selectedBets.length > 0 && (
                       <>
                         <select
                           className="px-3 py-2 border rounded-md bg-background"
                           onChange={(e) => handleBulkStatusChange(e.target.value)}
                           defaultValue=""
                         >
                           <option value="" disabled>Alterar Status</option>
                           {/* Opções baseadas na tabela results */}
                           {(() => {
                             const mapEntry = (code: string) => results.find(r => r.code === code);
                             const options: Array<{ value: string; label: string }> = [];
                             if (mapEntry("PENDENTE")) options.push({ value: "pendente", label: "Pendente" });
                             if (mapEntry("GANHOU")) options.push({ value: "ganha", label: "Ganha" });
                             if (mapEntry("PERDEU")) options.push({ value: "perdida", label: "Perdida" });
                             if (mapEntry("ANULADA")) options.push({ value: "cancelada", label: "Cancelada" });
                             return options.map(opt => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                             ));
                           })()}
                         </select>
                         <Button
                           variant="destructive"
                           onClick={handleDeleteSelected}
                           className="flex items-center gap-2"
                         >
                           <Trash2 className="h-4 w-4" />
                           Excluir Selecionadas ({selectedBets.length})
                         </Button>
                       </>
                     )}
                  </>
                )}
              </div>
              <ApostaFormModal onApostaAdded={handleApostaAdded} />
            </div>
            {isLoading ? (
              <div className="text-center text-muted-foreground">Carregando...</div>
            ) : error ? (
              <div className="text-center text-destructive">{error}</div>
            ) : (
              <ApostasList 
                apostas={apostas} 
                onDelete={handleDeleteAposta}
                onEdit={handleEditAposta}
                onStatusChange={handleStatusChange}
                showCheckboxes={true}
                selectedBets={selectedBets}
                onSelectBet={handleSelectBet}
              />
            )}
            <EditApostaModal
              aposta={editingAposta}
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onApostaUpdated={handleApostaUpdated}
            />
          </div>
        );
      
      case "casas-aposta":
        return <CasasApostaView apostas={apostas} />;
      
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Seção em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        
        <main className="flex-1">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">
                {activeSection === "apostas" && "Gestão de Apostas"}
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "casas-aposta" && "Casas de Apostas"}
                {!["apostas", "dashboard", "casas-aposta"].includes(activeSection) && 
                  activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h1>
            </div>
          </header>
          
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
