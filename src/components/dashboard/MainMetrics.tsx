import {
  Award,
  DollarSign,
  PercentIcon,
  Target,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";

interface MainMetricsProps {
  metrics: DashboardMetrics;
}

export function MainMetrics({ metrics }: MainMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total de Apostas"
        value={metrics.totalBets.toString()}
        icon={<Target className="h-5 w-5 text-primary" />}
        subtext={`${metrics.wonBets} ganhas / ${metrics.lostBets} perdidas`}
      />
      <MetricCard
        title="Lucro Total"
        value={`${
          Number(metrics.totalProfit) >= 0 ? "+" : ""
        }R$ ${Number(metrics.totalProfit).toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5 text-green-600" />}
        valueClass={
          Number(metrics.totalProfit) >= 0 ? "text-green-600" : "text-red-500"
        }
        subtext={`Valor Apostado: R$ ${Number(metrics.totalStaked).toFixed(2)}`}
      />
      <MetricCard
        title="ROI"
        value={`${
          Number(metrics.roi) >= 0 ? "+" : ""
        }${Number(metrics.roi).toFixed(2)}%`}
        icon={<PercentIcon className="h-5 w-5 text-green-500" />}
        valueClass={Number(metrics.roi) >= 0 ? "text-green-600" : "text-red-500"}
        subtext={`Odd Média: ${Number(metrics.averageOdd).toFixed(2)}`}
      />
      <MetricCard
        title="Taxa de Acerto"
        value={`${Number(metrics.hitRate).toFixed(2)}%`}
        icon={<Award className="h-5 w-5 text-blue-500" />}
        valueClass={
          Number(metrics.hitRate) >= 5 ? "text-black-500" : "text-red-500"
        }
        subtext={`${metrics.wonBets}/${metrics.totalBets} apostas`}
      />
    </div>
  );
}
