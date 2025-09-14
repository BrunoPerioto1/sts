import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { Target, TrendingUp, TrendingDown, BarChart3, DollarSign, PercentIcon, Award, ChevronDown, ChevronUp } from "lucide-react";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";

import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  getDashboardMetrics as fetchDashboardMetrics,
  type DashboardMetrics,
} from "@/api/routes/get-dashboard-metrics";
import {
  getDashboardDailySummary,
  type DailySummaryPoint,
} from "@/api/routes/get-dashboard-daily";
import { getAllHouses, type HouseDto } from "@/api/routes/get-houses";

function DashboardPageContent() {
  const [casas, setCasas] = useState<HouseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBetDetails, setShowBetDetails] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    houseId: undefined as number | undefined,
    startDate: "",
    endDate: "",
  });

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    canceledBets: 0,
    totalStaked: 0,
    totalReturn: 0,
    averageStake: 0,
    averageOdd: 0,
    totalProfit: 0,
    roi: 0,
    hitRate: 0,
  });
  const [dailyData, setDailyData] = useState<DailySummaryPoint[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        house_id: filters.houseId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const [metricsData, dailyData] = await Promise.all([
        fetchDashboardMetrics(params),
        getDashboardDailySummary(params),
      ]);
      setMetrics(metricsData);
      setDailyData(dailyData || []);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const houses = await getAllHouses();
        setCasas(houses || []);
      } catch (error) {
        console.error("Erro ao carregar casas:", error);
        setCasas([]);
      }
    };
    loadHouses();
  }, []);

  const handleFilterChange = (newFilters: {
    houseId?: number;
    startDate: string;
    endDate: string;
  }) => {
    setFilters({
      houseId: newFilters.houseId !== undefined ? newFilters.houseId : undefined,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <DashboardFilter
        onFilterChange={handleFilterChange}
        onRefresh={loadDashboardData}
        houses={casas.map((house) => ({ id: house.id, name: house.name }))}
        loading={loading}
      />

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Apostas"
          value={metrics.totalBets}
          icon={<Target className="h-6 w-6" />}
          trend="neutral"
          subtext={`${metrics.wonBets} ganhas / ${metrics.lostBets} perdidas`}
          className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary"
        />
        <MetricCard
          title="Lucro Total"
          value={`${
            Number(metrics.totalProfit) >= 0 ? "+" : ""
          }R$ ${Number(metrics.totalProfit).toFixed(2)}`}
          icon={
            Number(metrics.totalProfit) >= 0 ? (
              <DollarSign className="h-6 w-6" />
            ) : (
              <DollarSign className="h-6 w-6" />
            )
          }
          trend={Number(metrics.totalProfit) >= 0 ? "positive" : "negative"}
          subtext={`Valor Apostado: R$ ${Number(metrics.totalStaked).toFixed(2)}`}
          className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-[#22c55e]"
        />
        <MetricCard
          title="ROI"
          value={`${
            Number(metrics.roi) >= 0 ? "+" : ""
          }${Number(metrics.roi).toFixed(2)}%`}
          icon={<PercentIcon className="h-6 w-6" />}
          trend={Number(metrics.roi) >= 0 ? "positive" : "negative"}
          subtext={`Odd Média: ${Number(metrics.averageOdd).toFixed(2)}`}
          className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-amber-500"
        />
        <MetricCard
          title="Taxa de Acerto"
          value={`${Number(metrics.hitRate).toFixed(2)}%`}
          icon={<Award className="h-6 w-6" />}
          trend={Number(metrics.hitRate) >= 50 ? "positive" : "negative"}
          subtext={`${metrics.wonBets}/${metrics.totalBets} apostas`}
          className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-blue-500"
        />
      </div>

      <DailyEvolutionChart data={dailyData} />

      {/* Cards de resumo adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary overflow-hidden">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Apostas por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Card initial state - shows only main metrics */}
            {!showBetDetails ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2 border-b border-border pb-3">
                  <span className="text-base font-semibold">Total:</span>
                  <span className="font-bold text-xl">{metrics.totalBets}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="text-base font-semibold">Taxa de Acerto:</span>
                  <span className={`font-bold text-xl ${
                      Number(metrics.hitRate) >= 50
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
              /* Expanded state - shows all metrics */
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
                      Number(metrics.hitRate) >= 50
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

        <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500 overflow-hidden">
          <CardHeader className="pb-2 bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4d">
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
