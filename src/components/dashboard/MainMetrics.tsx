import { Wallet, Percent, Receipt, Target } from "@phosphor-icons/react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";

interface MainMetricsProps {
  metrics: DashboardMetrics;
  profitSparkline?: number[];
}

export function MainMetrics({ metrics, profitSparkline }: MainMetricsProps) {
  const profit = Number(metrics.totalProfit);
  const roi = Number(metrics.roi) * 100;
  const hitRate = Number(metrics.hitRate) * 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
      <MetricCard
        title="Lucro no período"
        icon={<Wallet size={15} />}
        value={`${profit >= 0 ? "+" : ""}R$ ${profit.toFixed(2)}`}
        valueClass={profit >= 0 ? "text-positive" : "text-negative"}
        subtext={`${metrics.wonBets} ganhas / ${metrics.lostBets} perdidas`}
        sparkline={profitSparkline}
      />
      <MetricCard
        title="ROI"
        icon={<Percent size={15} />}
        value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`}
        valueClass={roi >= 0 ? "text-positive" : "text-negative"}
        subtext={`Odd média: ${Number(metrics.averageOdd).toFixed(2)}`}
      />
      <MetricCard
        title="Apostas liquidadas"
        icon={<Receipt size={15} />}
        value={String(metrics.totalBets)}
        subtext={`${metrics.pendingBets} pendentes`}
      />
      <MetricCard
        title="Taxa de acerto"
        icon={<Target size={15} />}
        value={`${hitRate.toFixed(1)}%`}
        subtext={`${metrics.wonBets}/${metrics.totalBets} apostas`}
      />
    </div>
  );
}
