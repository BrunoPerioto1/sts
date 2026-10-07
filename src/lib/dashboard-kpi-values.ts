import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { KpiId } from "@/lib/dashboard-preferences";
import { formatInt, formatMoney, formatOdd, formatPercent, formatUnits } from "@/lib/format";

// Mesmos valores/fórmulas no mobile, no desktop e na prévia das configurações.
export function kpiValues(metrics: DashboardMetrics, stake: number): Record<KpiId, { value: string; signed?: number | null }> {
  const profit = Number(metrics.totalProfit);
  const roi = Number(metrics.roi);
  const unitValue = Number.isFinite(stake) && stake > 0 ? stake / 100 : null;
  const units = unitValue != null ? profit / unitValue : null;
  return {
    roi: { value: formatPercent(roi, { signed: true }), signed: roi },
    units: { value: units != null ? formatUnits(units) : "—", signed: units },
    bets: { value: formatInt(metrics.totalBets) },
    pending: { value: formatInt(metrics.pendingBets) },
    totalStaked: { value: formatMoney(Number(metrics.totalStaked), { cents: false }) },
    averageStake: { value: formatMoney(Number(metrics.averageStake), { cents: false }) },
    averageOdd: { value: formatOdd(metrics.averageOdd) },
    hitRate: { value: formatPercent(metrics.hitRate) },
  };
}
