import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { Target, TrendingUp, TrendingDown, BarChart3, Calendar, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { MainLayout } from "@/components/layout/MainLayout";
import { getDashboardMetrics as fetchDashboardMetrics, type DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { getDashboardDailySummary, type DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import { getAllHouses, type HouseDto } from "@/api/routes/get-houses";

function DashboardPageContent() {
  const [casas, setCasas] = useState<HouseDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    house_id: undefined as number | undefined,
    startDate: "",
    endDate: ""
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
    hitRate: 0
  });
  const [dailyData, setDailyData] = useState<DailySummaryPoint[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        house_id: filters.house_id,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const [metricsData, dailyData] = await Promise.all([
        fetchDashboardMetrics(params),
        getDashboardDailySummary(params)
      ]);
      setMetrics(metricsData);
      setDailyData(dailyData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
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
        console.error('Erro ao carregar casas:', error);
        setCasas([]);
      }
    };
    loadHouses();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setFilters(prev => ({
      ...prev,
      startDate: startDate || "",
      endDate: endDate || ""
    }));
  };

  const clearFilters = () => {
    setFilters({
      house_id: undefined,
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros do Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Casa de Aposta</Label>
              <Select 
                value={filters.house_id?.toString() || "all"} 
                onValueChange={(value) => handleFilterChange('house_id', value === "all" ? undefined : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as casas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as casas</SelectItem>
                  {casas.map(casa => (
                    <SelectItem key={casa.houseId || Math.random()} value={(casa.houseId || 0).toString()}>
                      {casa.name || 'Casa sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Período</Label>
              <DateRangeFilter 
                onDateRangeChange={handleDateRangeChange}
                className="border rounded-md p-3"
              />
            </div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Apostas"
          value={metrics.totalBets}
          icon={<Target className="h-6 w-6" />}
          trend="neutral"
        />
        <MetricCard
          title="Lucro Total"
          value={`${Number(metrics.totalProfit) >= 0 ? '+' : ''}R$ ${Number(metrics.totalProfit).toFixed(2)}`}
          icon={Number(metrics.totalProfit) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          trend={Number(metrics.totalProfit) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="ROI"
          value={`${Number(metrics.roi) >= 0 ? '+' : ''}${Number(metrics.roi).toFixed(2)}%`}
          icon={<BarChart3 className="h-6 w-6" />}
          trend={Number(metrics.roi) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Taxa de Acerto"
          value={`${Number(metrics.hitRate).toFixed(1)}%`}
          icon={<Target className="h-6 w-6" />}
          trend={Number(metrics.hitRate) >= 50 ? "positive" : "negative"}
        />
      </div>

      {/* Gráfico de evolução diária expandido */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Diária (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value: number, name: string) => [
                  name === 'profitDay' ? `R$ ${value.toFixed(2)}` : value,
                  name === 'profitDay' ? 'Lucro' : 'Apostas'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="totalBets" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="apostas"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="profitDay" 
                stroke="hsl(var(--chart-green))" 
                strokeWidth={3}
                name="lucro"
                dot={{ fill: 'hsl(var(--chart-green))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--chart-green))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de resumo adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Apostas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ganhas:</span>
                <span className="font-medium text-success">{metrics.wonBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-medium">{metrics.totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa:</span>
                <span className="font-medium">{Number(metrics.hitRate).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Investido:</span>
                <span className="font-medium">R$ {Number(metrics.totalStaked).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retorno:</span>
                <span className="font-medium">R$ {Number(metrics.totalReturn).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm text-muted-foreground`}>Lucro:</span>
                <span className={`font-medium ${Number(metrics.totalProfit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {Number(metrics.totalProfit).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ROI:</span>
                <span className={`font-medium ${Number(metrics.roi) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {Number(metrics.roi).toFixed(2)}%
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