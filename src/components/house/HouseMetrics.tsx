import { DollarSign, TrendingUp, Activity, Building2 } from "lucide-react";
import { HouseMetricsDto } from "@/api/routes/get-houses";
import { cn } from "@/lib/utils";

interface HousesMetricsProps {
  metrics: HouseMetricsDto;
  formatCurrency: (val: number | string) => string;
}

export function HousesMetrics({ metrics, formatCurrency }: HousesMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      <MetricCard
        title="Total Investido"
        value={formatCurrency(metrics.totalInvested)}
        icon={<DollarSign className="h-5 w-5 text-blue-600" />}
        subtext="Valor total apostado"
      />
      <MetricCard
        title="Saldo Atual"
        value={formatCurrency(metrics.currentBalance)}
        icon={<DollarSign className="h-5 w-5 text-green-600" />}
        valueClass="text-green-600"
        subtext="Soma dos saldos"
      />
      <MetricCard
        title="Lucro Total"
        value={formatCurrency(metrics.totalProfit)}
        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        valueClass={
          Number(metrics.totalProfit) >= 0 ? "text-green-600" : "text-red-500"
        }
        subtext="Ganhos - perdas"
      />
      <MetricCard
        title="Total de Apostas"
        value={metrics.totalBets.toString()}
        icon={<Activity className="h-5 w-5 text-purple-600" />}
        subtext="Quantidade registradas"
      />
      <MetricCard
        title="Casas Utilizadas"
        value={metrics.totalHousesUsed.toString()}
        icon={<Building2 className="h-5 w-5 text-orange-600" />}
        subtext="Casas em operação"
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  subtext,
  valueClass = "",
  className,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-lg transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-md bg-muted/40">{icon}</div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <p className={cn("text-2xl font-bold", valueClass)}>{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}
