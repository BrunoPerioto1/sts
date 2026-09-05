import { Wallet, Percent, Receipt, Target } from "@phosphor-icons/react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";

interface MainMetricsProps {
  metrics: DashboardMetrics;
  previousMetrics?: DashboardMetrics;
}

function pctDelta(current: number, previous: number): { label: string; positive: boolean } | undefined {
  if (!previous) return undefined;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

function ppDelta(current: number, previous: number): { label: string; positive: boolean } {
  const diff = (current - previous) * 100;
  return { label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} p.p.`, positive: diff >= 0 };
}

function countDelta(current: number, previous: number): { label: string; positive: boolean } {
  const diff = current - previous;
  return { label: `${diff >= 0 ? "+" : ""}${diff}`, positive: diff >= 0 };
}

export function MainMetrics({ metrics, previousMetrics }: MainMetricsProps) {
  const profit = Number(metrics.totalProfit);
  const roi = Number(metrics.roi) * 100;
  const hitRate = Number(metrics.hitRate) * 100;

  const prevProfit = previousMetrics ? Number(previousMetrics.totalProfit) : 0;
  const prevRoi = previousMetrics ? Number(previousMetrics.roi) * 100 : 0;
  const prevHitRate = previousMetrics ? Number(previousMetrics.hitRate) * 100 : 0;
  const prevTotalBets = previousMetrics ? Number(previousMetrics.totalBets) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
      <MetricCard
        title="Lucro no período"
        icon={<Wallet size={15} />}
        value={`${profit >= 0 ? "+" : ""}R$ ${profit.toFixed(2)}`}
        valueClass={profit >= 0 ? "text-positive" : "text-negative"}
        delta={previousMetrics ? pctDelta(profit, prevProfit) : undefined}
        subtext={`${metrics.wonBets} ganhas / ${metrics.lostBets} perdidas`}
      />
      <MetricCard
        title="ROI"
        icon={<Percent size={15} />}
        value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`}
        valueClass={roi >= 0 ? "text-positive" : "text-negative"}
        delta={previousMetrics ? ppDelta(roi, prevRoi) : undefined}
        subtext={`Odd média: ${Number(metrics.averageOdd).toFixed(2)}`}
      />
      <MetricCard
        title="Apostas liquidadas"
        icon={<Receipt size={15} />}
        value={String(metrics.totalBets)}
        delta={previousMetrics ? countDelta(Number(metrics.totalBets), prevTotalBets) : undefined}
        subtext={`${metrics.pendingBets} pendentes`}
      />
      <MetricCard
        title="Taxa de acerto"
        icon={<Target size={15} />}
        value={`${hitRate.toFixed(1)}%`}
        delta={previousMetrics ? ppDelta(hitRate, prevHitRate) : undefined}
        subtext={`${metrics.wonBets}/${metrics.settledBets} encerradas`}
      />
    </div>
  );
}
