import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface DailyData {
  date: string;
  profitDay: number;
}

interface DailyEvolutionChartProps {
  data: DailyData[];
  title?: string;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isPositive = value >= 0;
    
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium text-card-foreground">
          {new Date(label).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-chart-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-chart-red" />
          )}
          <span className={`font-bold ${
            isPositive ? 'text-chart-green' : 'text-chart-red'
          }`}>
            R$ {Math.abs(value).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {isPositive ? 'lucro' : 'prejuízo'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const formatAxisValue = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
};

export const DailyEvolutionChart = ({ 
  data, 
  title = "Ganhos Diários", 
  className = "" 
}: DailyEvolutionChartProps) => {
  const totalProfit = data.reduce((sum, item) => sum + item.profitDay, 0);
  const profitableDays = data.filter(item => item.profitDay > 0).length;
  const totalDays = data.length;
  
  return (
    <Card className={`chart-container shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary overflow-hidden ${className}`}>
      <CardHeader className="pb-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            {title}
          </CardTitle>
          <div className="text-right">
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {totalProfit >= 0 ? "+" : ""}R$ {totalProfit.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              {profitableDays}/{totalDays} dias positivos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={460}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barCategoryGap={16}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                }
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisValue}
                domain={[(dataMin: number) => Math.min(dataMin, -300), (dataMax: number) => Math.max(dataMax * 1.1, 200)]}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{
                  fill: 'rgba(0, 0, 0, 0.08)'
                }}
              />

              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--border))" 
                strokeWidth={2} 
                strokeDasharray="5 5"
              />

              <Bar
                dataKey="profitDay"
                name="Lucro Diário"
                radius={[6, 6, 0, 0]}
                barSize={40}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.profitDay >= 0 
                      ? '#16A34A'  // verde
                      : '#EF4444'  // vermelho
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-8 mt-5 pt-5 border-t">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-md bg-[#16A34A]"></div>
            <span className="text-sm font-medium text-success">Lucro</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-md bg-[#EF4444]"></div>
            <span className="text-sm font-medium text-destructive">Prejuízo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};