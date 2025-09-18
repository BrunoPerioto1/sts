import { DollarSign, TrendingUp, Activity, Building2, Loader2 } from "lucide-react";
import { HouseMetricsDto } from "@/api/routes/get-houses";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface HousesMetricsProps {
  metrics: HouseMetricsDto;
  formatCurrency: (val: number | string) => string;
  isLoading?: boolean;
}

export function HousesMetrics({ metrics, formatCurrency, isLoading = false }: HousesMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
      <MetricCard
        title="Total Investido"
        value={formatCurrency(metrics.totalInvested)}
        icon={<DollarSign className="h-5 w-5 text-blue-600" />}
        subtext="Valor total apostado"
        isLoading={isLoading}
      />
      <MetricCard
        title="Saldo Atual"
        value={formatCurrency(metrics.currentBalance)}
        icon={<DollarSign className="h-5 w-5 text-green-600" />}
        valueClass="text-green-600"
        subtext="Soma dos saldos"
        isLoading={isLoading}
      />
      <MetricCard
        title="Lucro Total"
        value={formatCurrency(metrics.totalProfit)}
        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        valueClass={
          Number(metrics.totalProfit) >= 0 ? "text-green-600" : "text-red-500"
        }
        subtext="Ganhos - perdas"
        isLoading={isLoading}
      />
      <MetricCard
        title="Total de Apostas"
        value={metrics.totalBets.toString()}
        icon={<Activity className="h-5 w-5 text-purple-600" />}
        subtext="Quantidade registradas"
        isLoading={isLoading}
      />
      <MetricCard
        title="Casas Utilizadas"
        value={metrics.totalHousesUsed.toString()}
        icon={<Building2 className="h-5 w-5 text-orange-600" />}
        subtext="Casas em operação"
        isLoading={isLoading}
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
  isLoading = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  valueClass?: string;
  className?: string;
  isLoading?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-lg transition-all",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-md bg-muted/40">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : icon}
        </div>
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        )}
      </div>
      
      {isLoading ? (
        <Skeleton className="h-8 w-32 mb-2" />
      ) : (
        <p className={cn("text-2xl font-bold", valueClass)}>{value}</p>
      )}
      
      {subtext && !isLoading ? (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      ) : isLoading ? (
        <Skeleton className="h-3 w-24" />
      ) : null}
    </div>
  );
}
