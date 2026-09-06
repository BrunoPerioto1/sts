import { useMemo } from "react";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { DASHBOARD_KPI_REGISTRY, kpiColumnSpan, performanceColor, type DashboardPreferences, type KpiId } from "@/lib/dashboard-preferences";
import { formatCurrencyCompact } from "@/lib/format";
import { DashboardKpiCard } from "./DashboardKpiCard";
import { MetricCard } from "./MetricCard";
import { resolveKpiIcon } from "./dashboard-icons";

export function DashboardKpiGrid({ metrics, stake, preferences, desktop = false }: {
  metrics: DashboardMetrics; stake: number; preferences: DashboardPreferences; desktop?: boolean;
}) {
  // Mesmos valores/fórmulas do mobile. Preferências não participam deste memo.
  const values = useMemo(() => {
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
    } satisfies Record<KpiId, { value: string; signed?: number }>;
  }, [metrics, stake]);
  const visible = preferences.kpis.filter((kpi) => kpi.visible);
  return <div className={desktop ? "grid grid-cols-2 lg:grid-cols-4 gap-[14px]" : "grid grid-cols-2 auto-rows-fr gap-2.5 mt-6"}>
    {visible.map((kpi, index) => {
      const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
      const data: { value: string; signed?: number } = values[kpi.id];
      const color = meta.semanticType === "performance" ? performanceColor(data.signed, preferences.performanceColors) : undefined;
      const IconComponent = resolveKpiIcon(kpi.id, kpi.icon);
      const columnSpan = kpiColumnSpan(index, visible.length);
      return desktop
        ? <MetricCard key={kpi.id} title={meta.label} value={data.value} icon={<IconComponent size={15} />} valueColor={color} columnSpan={columnSpan} />
        : <DashboardKpiCard key={kpi.id} label={meta.label} value={data.value} icon={IconComponent} color={color} columnSpan={columnSpan} />;
    })}
  </div>;
}
