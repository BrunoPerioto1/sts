import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { KpiId } from "@/lib/dashboard-preferences";
import { formatCurrencyCompact } from "@/lib/format";

// Mesmos valores/fórmulas no mobile, no desktop e na prévia das configurações.
export function kpiValues(metrics: DashboardMetrics, stake: number): Record<KpiId, { value: string; signed?: number | null }> {
  const profit = Number(metrics.totalProfit);
  const roi = Number(metrics.roi) * 100;
  const unitValue = Number.isFinite(stake) && stake > 0 ? stake / 100 : null;
  const units = unitValue != null ? profit / unitValue : null;
  return {
    roi: { value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, signed: roi },
    units: { value: units != null ? `${units.toLocaleString("pt-BR", { maximumFractionDigits: 2, signDisplay: "exceptZero" })} U` : "—", signed: units },
    bets: { value: String(Number(metrics.totalBets)) },
    pending: { value: String(Number(metrics.pendingBets)) },
    totalStaked: { value: formatCurrencyCompact(Number(metrics.totalStaked)) },
    averageStake: { value: formatCurrencyCompact(Number(metrics.averageStake)) },
    averageOdd: { value: Number(metrics.averageOdd).toFixed(2) },
    hitRate: { value: `${(Number(metrics.hitRate) * 100).toFixed(1)}%` },
  };
}
