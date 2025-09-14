// import { useEffect, useState } from "react";
// import { AppSidebar } from "@/components/layout/AppSidebar";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { MetricCard } from "@/components/dashboard/MetricCard";
// import { ApostaFormModal } from "@/components/apostas/ApostaFormModal";
// import { ApostasList } from "@/components/apostas/ApostasList";
// import { EditApostaModal } from "@/components/apostas/EditApostaModal";
// import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
// import { CasasApostaView } from "@/components/casas-aposta/CasasApostaView";
// import { Target, TrendingUp, TrendingDown, BarChart3, Trash2, CheckSquare, RefreshCw } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { getBets, createBet, updateBet, deleteBet, finalizeBet, finalizeMultipleBets, deleteMultipleBets, getBetResultTypes, type BetItem } from "@/api/routes/get-bets";
// import { getDashboardMetrics, type DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
// import { getDashboardDailySummary, type DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

// const Index = () => {
//   const [activeSection, setActiveSection] = useState("apostas");
//   const [selectedBets, setSelectedBets] = useState<number[]>([]);
//   const [editingAposta, setEditingAposta] = useState<BetItem | null>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [apostas, setApostas] = useState<BetItem[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [results, setResults] = useState<Array<{ id: number; code: string; name: string }>>([]);
//   const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
//   const [dashboardLoading, setDashboardLoading] = useState(false);
//   const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });


//   useEffect(() => {
//     const loadBets = async () => {
//       setIsLoading(true);
//       setError(null);
//       try {
//         const data = await getBets();
//         setApostas(data || []);
//       } catch (e: any) {
//         setError(e.message || "Falha ao carregar apostas");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     const loadResults = async () => {
//       try {
//         const res = await getBetResultTypes();
//         setResults((res || []).map(r => ({ id: r.id, code: r.name.toUpperCase().replace(/\s+/g, '_'), name: r.name })));
//       } catch {
//         // fallback padrão alinhado ao enum
//         setResults([
//           { id: 1, code: "GANHOU", name: "Ganhou" },
//           { id: 2, code: "PERDEU", name: "Perdeu" },
//           { id: 3, code: "EMPATE", name: "Empate" },
//           { id: 4, code: "ANULADA", name: "Anulada" },
//           { id: 5, code: "MEIO_GANHO", name: "Meio ganho" },
//           { id: 6, code: "REEMBOLSADA", name: "Reembolsada" },
//           { id: 7, code: "MEIO_GANHO_2", name: "Meio ganho (2)" },
//           { id: 8, code: "MEIO_PERDIDO", name: "Meio perdido" },
//           { id: 9, code: "PENDENTE", name: "Pendente" },
//         ]);
//       }
//     };
//     loadBets();
//     loadResults();
//     loadDashboardMetrics();
//   }, []);

//   const loadDashboardMetrics = async (startDate?: string | null, endDate?: string | null) => {
//     setDashboardLoading(true);
//     try {
//       const params = {
//         startDate: startDate || undefined,
//         endDate: endDate || undefined,
//       };
      
//       const metrics = await getDashboardMetrics(params);
//       setDashboardMetrics(metrics);
//     } catch (e: any) {
//       console.error('Erro ao carregar métricas do dashboard:', e.message);
//     } finally {
//       setDashboardLoading(false);
//     }
//   };

//   const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
//     setDateRange({ startDate, endDate });
//     loadDashboardMetrics(startDate, endDate);
//   };

//   const handleApostaAdded = (novaAposta: BetItem) => {
//     setApostas([novaAposta, ...apostas]);
//   };

//   const { toast } = useToast();

//   const handleDeleteAposta = async (id: number) => {
//     try {
//       await deleteBet(id);
//       setApostas(apostas.filter(aposta => aposta.id !== id));
//     } catch (e: any) {
//       toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
//     }
//   };

//   const handleEditAposta = (aposta: BetItem) => {
//     setEditingAposta(aposta);
//     setIsEditModalOpen(true);
//   };

//   const handleApostaUpdated = (updatedAposta: BetItem) => {
//     setApostas(apostas.map(aposta => 
//       aposta.id === updatedAposta.id ? updatedAposta : aposta
//     ));
//   };

//   const handleStatusChange = async (id: number, newStatus: string) => {
//     const statusToResultId: Record<string, number> = {
//       pendente: results.find(r => r.code === "PENDENTE")?.id ?? 9,
//       ganha: results.find(r => r.code === "GANHOU")?.id ?? 1,
//       perdida: results.find(r => r.code === "PERDEU")?.id ?? 2,
//       cancelada: results.find(r => r.code === "ANULADA")?.id ?? 4,
//     };
//     try {
//       await finalizeBet(id, { resultId: statusToResultId[newStatus] ?? 9 });
//       // Recarregar apostas para obter o profit calculado pelo backend
//       const data = await getBets();
//       setApostas(data || []);
//       toast({ title: "Status atualizado", description: `Status alterado para ${newStatus}` });
//     } catch (e: any) {
//       toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
//     }
//   };

//   const handleSelectBet = (betId: number) => {
//     setSelectedBets(prev => 
//       prev.includes(betId) 
//         ? prev.filter(id => id !== betId)
//         : [...prev, betId]
//     );
//   };

//   const handleSelectAll = () => {
//     setSelectedBets(selectedBets.length === apostas.length ? [] : apostas.map(a => a.id));
//   };

//   const handleDeleteSelected = async () => {
//     if (selectedBets.length === 0) return;
//     try {
//       await deleteMultipleBets(selectedBets);
//       setApostas(apostas.filter(aposta => !selectedBets.includes(aposta.id)));
//       setSelectedBets([]);
//       toast({ title: "Sucesso", description: `${selectedBets.length} aposta(s) excluída(s)` });
//     } catch (e: any) {
//       toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
//     }
//   };

//   const handleBulkStatusChange = async (newStatus: string) => {
//     if (selectedBets.length === 0 || !newStatus) return;
//     const statusToResultId: Record<string, number> = {
//       pendente: results.find(r => r.code === "PENDENTE")?.id ?? 9,
//       ganha: results.find(r => r.code === "GANHOU")?.id ?? 1,
//       perdida: results.find(r => r.code === "PERDEU")?.id ?? 2,
//       cancelada: results.find(r => r.code === "ANULADA")?.id ?? 4,
//     };
//     try {
//       await finalizeMultipleBets({ betIds: selectedBets, resultId: statusToResultId[newStatus] ?? 9 });
//       // Recarregar apostas para obter o profit calculado pelo backend
//       const data = await getBets();
//       setApostas(data || []);
//       setSelectedBets([]);
//       toast({ title: "Status atualizado", description: `${selectedBets.length} aposta(s) alterada(s)` });
//     } catch (e: any) {
//       toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" });
//     }
//   };

//   // Use only backend data - no frontend calculations
//   const metrics = dashboardMetrics || {
//     totalBets: 0,
//     wonBets: 0,
//     lostBets: 0,
//     pendingBets: 0,
//     canceledBets: 0,
//     totalStaked: 0,
//     totalReturn: 0,
//     averageStake: 0,
//     averageOdd: 0,
//     totalProfit: 0,
//     roi: 0,
//     hitRate: 0
//   };

//   const { totalBets, wonBets, totalStaked, totalReturn, totalProfit, roi, hitRate } = metrics;

//   // Chart data
//   const chartData = [
//     {
//       category: "Resumo Financeiro",
//       receitas: Number(totalReturn || 0),
//       despesas: Number(totalStaked || 0)
//     }
//   ];

//   const renderContent = () => {
//     switch (activeSection) {
//       case "dashboard":
//         return (
//           <div className="space-y-6">
//             <DateRangeFilter 
//               onDateRangeChange={handleDateRangeChange}
//               className="mb-6"
//             />
            
//             {dashboardLoading ? (
//               <div className="text-center text-muted-foreground py-8">
//                 Carregando métricas...
//               </div>
//             ) : (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                   <MetricCard
//                     title="Apostas"
//                     value={totalBets}
//                     icon={<Target className="h-6 w-6" />}
//                     trend="neutral"
//                   />
//                   <MetricCard
//                     title="Lucros"
//                     value={`${Number(totalProfit || 0) >= 0 ? '+' : ''}R$ ${Number(totalProfit || 0).toFixed(2)}`}
//                     icon={Number(totalProfit || 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
//                     trend={Number(totalProfit || 0) >= 0 ? "positive" : "negative"}
//                   />
//                   <MetricCard
//                     title="ROI"
//                     value={`${Number(roi || 0) >= 0 ? '+' : ''}${Number(roi || 0).toFixed(2)}%`}
//                     icon={<BarChart3 className="h-6 w-6" />}
//                     trend={Number(roi || 0) >= 0 ? "positive" : "negative"}
//                   />
//                   <MetricCard
//                     title="Taxa de Acerto"
//                     value={`${Number(hitRate || 0).toFixed(1)}%`}
//                     icon={<Target className="h-6 w-6" />}
//                     trend={Number(hitRate || 0) >= 50 ? "positive" : "negative"}
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//         );
      
//       case "apostas":
//         return (
//           <div className="space-y-6">
//             <div className="flex justify-between items-center">
//               <div className="flex items-center gap-4">
//                 <Button
//                   variant="outline"
//                   onClick={() => {
//                     // reload bets
//                     (async () => {
//                       setIsLoading(true);
//                       setError(null);
//                       try {
//                         const data = await getBets();
//                         setApostas(data || []);
//                       } catch (e: any) {
//                         setError(e.message || "Falha ao carregar apostas");
//                       } finally {
//                         setIsLoading(false);
//                       }
//                     })();
//                   }}
//                   className="flex items-center gap-2"
//                 >
//                   <RefreshCw className="h-4 w-4" />
//                   Atualizar
//                 </Button>
//                 {apostas.length > 0 && (
//                   <>
//                      <Button
//                        variant="outline"
//                        onClick={handleSelectAll}
//                        className="flex items-center gap-2"
//                      >
//                        <CheckSquare className="h-4 w-4" />
//                        {selectedBets.length === apostas.length ? "Desmarcar Todas" : "Selecionar Todas"}
//                      </Button>
//                      {selectedBets.length > 0 && (
//                        <>
//                          <select
//                            className="px-3 py-2 border rounded-md bg-background"
//                            onChange={(e) => handleBulkStatusChange(e.target.value)}
//                            defaultValue=""
//                          >
//                            <option value="" disabled>Alterar Status</option>
//                            {/* Opções baseadas na tabela results */}
//                            {(() => {
//                              const mapEntry = (code: string) => results.find(r => r.code === code);
//                              const options: Array<{ value: string; label: string }> = [];
//                              if (mapEntry("PENDENTE")) options.push({ value: "pendente", label: "Pendente" });
//                              if (mapEntry("GANHOU")) options.push({ value: "ganha", label: "Ganha" });
//                              if (mapEntry("PERDEU")) options.push({ value: "perdida", label: "Perdida" });
//                              if (mapEntry("ANULADA")) options.push({ value: "cancelada", label: "Cancelada" });
//                              return options.map(opt => (
//                                <option key={opt.value} value={opt.value}>{opt.label}</option>
//                              ));
//                            })()}
//                          </select>
//                          <Button
//                            variant="destructive"
//                            onClick={handleDeleteSelected}
//                            className="flex items-center gap-2"
//                          >
//                            <Trash2 className="h-4 w-4" />
//                            Excluir Selecionadas ({selectedBets.length})
//                          </Button>
//                        </>
//                      )}
//                   </>
//                 )}
//               </div>
//               <ApostaFormModal onApostaAdded={handleApostaAdded} />
//             </div>
//             {isLoading ? (
//               <div className="text-center text-muted-foreground">Carregando...</div>
//             ) : error ? (
//               <div className="text-center text-destructive">{error}</div>
//             ) : (
//               <ApostasList 
//                 apostas={apostas} 
//                 onDelete={handleDeleteAposta}
//                 onEdit={handleEditAposta}
//                 onStatusChange={handleStatusChange}
//                 showCheckboxes={true}
//                 selectedBets={selectedBets}
//                 onSelectBet={handleSelectBet}
//               />
//             )}
//             <EditApostaModal
//               aposta={editingAposta}
//               isOpen={isEditModalOpen}
//               onClose={() => setIsEditModalOpen(false)}
//               onApostaUpdated={handleApostaUpdated}
//             />
//           </div>
//         );
      
//       case "casas-aposta":
//         return <CasasApostaView apostas={apostas} />;
      
//       default:
//         return (
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <h2 className="text-2xl font-bold mb-2">Seção em Desenvolvimento</h2>
//               <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <SidebarProvider>
//       <div className="min-h-screen bg-background flex w-full">
//         <AppSidebar />
        
//         <main className="flex-1">
//           <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
//             <div className="flex h-16 items-center gap-4 px-6">
//               <SidebarTrigger />
//               <h1 className="text-xl font-semibold">
//                 {activeSection === "apostas" && "Gestão de Apostas"}
//                 {activeSection === "dashboard" && "Dashboard"}
//                 {activeSection === "casas-aposta" && "Casas de Apostas"}
//                 {!["apostas", "dashboard", "casas-aposta"].includes(activeSection) && 
//                   activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
//               </h1>
//             </div>
//           </header>
          
//           <div className="p-6">
//             {renderContent()}
//           </div>
//         </main>
//       </div>
//     </SidebarProvider>
//   );
// };

// export default Index;
