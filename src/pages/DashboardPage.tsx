import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { getDashboardMetrics, getDashboardChartData, getDashboardDailySummary, getHouses, type DashboardMetrics } from "@/lib/api";
import { Target, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { MainLayout } from "@/components/layout/MainLayout";

function DashboardPageContent() {
  const [casas, setCasas] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    house_id: undefined as number | undefined,
    startDate: "",
    endDate: ""
  });

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalApostas: 0,
    apostasGanhas: 0,
    apostasPerdidas: 0,
    apostasPendentes: 0,
    apostasCanceladas: 0,
    totalInvestido: 0,
    totalRetorno: 0,
    lucroTotal: 0,
    roi: 0,
    taxaAcerto: 0
  });
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; apostas: number; lucro: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [m, c, d] = await Promise.all([
          getDashboardMetrics({ ...filters, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined }),
          getDashboardChartData({ ...filters, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined }),
          getDashboardDailySummary({ ...filters, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined })
        ]);
        setMetrics(m);
        setChartData(c);
        setDailyData(d.map((x: any) => ({ date: x.date, apostas: x.totalApostas ?? x.apostas ?? 0, lucro: x.lucroDia ?? x.lucro ?? 0 })));
      } finally { setLoading(false); }
    };
    load();
  }, [filters]);

  useEffect(() => {
    getHouses().then((h) => setCasas(h as any)).catch(() => setCasas([]));
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    <SelectItem key={casa.id} value={casa.id.toString()}>
                      {casa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Apostas"
          value={metrics.totalApostas}
          icon={<Target className="h-6 w-6" />}
          trend="neutral"
        />
        <MetricCard
          title="Lucro Total"
          value={`${metrics.lucroTotal >= 0 ? '+' : ''}R$ ${metrics.lucroTotal.toFixed(2)}`}
          icon={metrics.lucroTotal >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          trend={metrics.lucroTotal >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="ROI"
          value={`${metrics.roi >= 0 ? '+' : ''}${metrics.roi.toFixed(2)}%`}
          icon={<BarChart3 className="h-6 w-6" />}
          trend={metrics.roi >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Taxa de Acerto"
          value={`${metrics.taxaAcerto.toFixed(1)}%`}
          icon={<Target className="h-6 w-6" />}
          trend={metrics.taxaAcerto >= 50 ? "positive" : "negative"}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras - Investido x Retorno x Lucro */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={chartData} />
          </CardContent>
        </Card>

        {/* Gráfico de linha - Evolução diária */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Diária (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                  formatter={(value: number, name: string) => [
                    name === 'lucro' ? `R$ ${value.toFixed(2)}` : value,
                    name === 'lucro' ? 'Lucro' : 'Apostas'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="apostas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="apostas"
                />
                <Line 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="hsl(var(--chart-green))" 
                  strokeWidth={2}
                  name="lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                <span className="font-medium text-success">{metrics.apostasGanhas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-medium">{metrics.totalApostas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taxa:</span>
                <span className="font-medium">{metrics.taxaAcerto.toFixed(1)}%</span>
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
                <span className="font-medium">R$ {metrics.totalInvestido.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retorno:</span>
                <span className="font-medium">R$ {metrics.totalRetorno.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lucro:</span>
                <span className={`font-medium ${metrics.lucroTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {metrics.lucroTotal.toFixed(2)}
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
                <span className={`font-medium ${metrics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {metrics.roi.toFixed(2)}%
                </span>
              </div>
              {/* Stake médio e odd média devem vir do backend quando disponíveis */}
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