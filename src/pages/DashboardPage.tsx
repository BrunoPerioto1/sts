import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { Target, BarChart3, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainMetrics } from "@/components/dashboard/MainMetrics";
import { useDashboardFilters } from "@/hooks/dashboard/useDashboardFilters";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";

function DashboardPageContent() {
  const [showBetDetails, setShowBetDetails] = useState(false);

  const { filters, setFilters } = useDashboardFilters();

  const { 
    houses, 
    metrics, 
    dailyData, 
    loading, 
    reload 
  } = useDashboardData(filters);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <DashboardFilter
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={reload}
        houses={houses.map((house) => ({ id: house.id, name: house.name }))}
        loading={loading}
      />

      {/* Métricas principais */}
      <MainMetrics metrics={metrics} />

      {/* Gráfico de evolução diária */}
      <DailyEvolutionChart data={dailyData} />

      {/* Cards de resumo adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Card 1: Apostas por Status */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary overflow-hidden">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Apostas por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {!showBetDetails ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border-b border-border pb-3">
                  <span className="text-base font-semibold">Total:</span>
                  <span className="font-bold text-xl">{metrics.totalBets}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="text-base font-semibold">Taxa de Acerto:</span>
                  <span className={`font-bold text-xl ${
                      Number(metrics.hitRate) >= 20
                        ? "text-success"
                        : "text-destructive"
                    }`}>
                    {Number(metrics.hitRate).toFixed(2)}%
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowBetDetails(true)}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 rounded-md"
                >
                  <span>Mostrar Mais Detalhes</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-md bg-success/5 hover:bg-success/10 transition-colors">
                  <span className="text-sm font-medium">Ganhas:</span>
                  <span className="font-bold text-lg text-success">
                    {metrics.wonBets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <span className="text-sm font-medium">Perdidas:</span>
                  <span className="font-bold text-lg text-destructive">
                    {metrics.lostBets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                  <span className="text-sm font-medium">Pendentes:</span>
                  <span className="font-bold text-lg text-amber-500">
                    {metrics.pendingBets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">Canceladas:</span>
                  <span className="font-bold text-lg">
                    {metrics.canceledBets}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 border-t border-border mt-3 pt-3">
                  <span className="text-base font-semibold">Total:</span>
                  <span className="font-bold text-xl">{metrics.totalBets}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors">
                  <span className="text-base font-semibold">Taxa de Acerto:</span>
                  <span className={`font-bold text-xl ${
                      Number(metrics.hitRate) >= 20
                        ? "text-success"
                        : "text-destructive"
                    }`}>
                    {Number(metrics.hitRate).toFixed(2)}%
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowBetDetails(false)}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 rounded-md"
                >
                  <span>Mostrar Menos</span>
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Valores */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-[#22c55e] overflow-hidden">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#22c55e]" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">Investido:</span>
                <span className="font-bold text-lg">
                  R$ {Number(metrics.totalStaked).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className={`text-base font-semibold`}>Lucro:</span>
                <span
                  className={`font-bold text-xl ${
                    Number(metrics.totalProfit) >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  R$ {Number(metrics.totalProfit).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className="text-base font-semibold">ROI:</span>
                <span
                  className={`font-bold text-xl ${
                    Number(metrics.roi) >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {Number(metrics.roi).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Estatísticas */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500 overflow-hidden">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">Stake Médio:</span>
                <span className="font-bold text-lg">
                  R$ {Number(metrics.averageStake).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className="text-sm font-medium">Odd Média:</span>
                <span className="font-bold text-lg">
                  {Number(metrics.averageOdd).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <DashboardPageContent />
    </MainLayout>
  );
}