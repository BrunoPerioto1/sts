import { useMemo } from "react";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { DASHBOARD_KPI_REGISTRY, performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { kpiValues } from "@/lib/dashboard-kpi-values";

/**
 * Régua horizontal de KPIs da prévia da landing (o dashboard usa os cards do
 * DashboardKpiCards). Sem ícone e sem sublegenda — cada célula ocupa ao menos
 * a largura do próprio texto (`min-w-fit`) e divide a sobra.
 */
export function DashboardKpiGrid({ metrics, stake, preferences }: {
  metrics: DashboardMetrics; stake: number; preferences: DashboardPreferences;
}) {
  // Preferências não participam deste memo.
  const values = useMemo(() => kpiValues({ metrics, stake }), [metrics, stake]);
  const visible = preferences.kpis.filter((kpi) => kpi.visible);

  return <div className="flex flex-wrap">
    {visible.map((kpi) => {
      const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
      const data = values[kpi.id];
      const color = meta.semanticType === "performance" ? performanceColor(data.signed ?? null, preferences.performanceColors) : undefined;
      // Mais de 6 numa linha espreme: quebra em linhas de 4, com divisória entre elas.
      return <div key={kpi.id} className={`flex-1 min-w-fit px-5 py-4 border-l border-foreground/[0.05] first:border-l-0 ${visible.length > 6 ? "basis-1/4 [&:nth-child(4n+1)]:border-l-0 [&:nth-child(n+5)]:border-t" : ""}`}>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-1.5 whitespace-nowrap">{meta.label}</p>
        <p className="text-2xl leading-tight font-semibold tabular-nums whitespace-nowrap" style={{ color }}>{data.value}</p>
      </div>;
    })}
  </div>;
}
