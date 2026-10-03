import { useMemo } from "react";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { DASHBOARD_KPI_REGISTRY, kpiColumnSpan, performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { kpiValues } from "@/lib/dashboard-kpi-values";
import { kpiDelta } from "@/lib/dashboard-kpi-delta";
import { DashboardKpiCard } from "./DashboardKpiCard";
import { resolveKpiIcon } from "./dashboard-icons";

// Delta com cor só onde "subir" é bom sem ambiguidade; volume e odd subindo
// não é mérito nem culpa, então ficam neutros.
const DELTA_WITH_COLOR = new Set(["roi", "units", "hitRate"]);

export function DashboardKpiGrid({ metrics, previous, stake, preferences, desktop = false }: {
  metrics: DashboardMetrics; previous?: DashboardMetrics; stake: number; preferences: DashboardPreferences; desktop?: boolean;
}) {
  // Preferências não participam deste memo.
  const values = useMemo(() => kpiValues(metrics, stake), [metrics, stake]);
  const visible = preferences.kpis.filter((kpi) => kpi.visible);

  // Desktop: régua horizontal, sem ícone e sem sublegenda — cada célula ocupa
  // ao menos a largura do próprio texto (`min-w-fit`) e divide a sobra, então
  // rótulos longos deixam de ficar espremidos.
  if (desktop) {
    return <div className="flex flex-wrap">
      {visible.map((kpi) => {
        const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
        const data = values[kpi.id];
        const color = meta.semanticType === "performance" ? performanceColor(data.signed ?? null, preferences.performanceColors) : undefined;
        const delta = previous ? kpiDelta(kpi.id, metrics, previous, stake) : null;
        return <div key={kpi.id} className="flex-1 min-w-fit px-5 py-4 border-l border-foreground/[0.05] first:border-l-0">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 whitespace-nowrap">{meta.label}</p>
          <p className="text-2xl leading-tight font-semibold tabular-nums whitespace-nowrap" style={{ color }}>{data.value}</p>
          {previous && (
            <p className="mt-1 text-[11px] tabular-nums whitespace-nowrap text-zinc-500" title="Comparado ao período anterior de mesma duração">
              {delta ? (
                <>
                  <span style={DELTA_WITH_COLOR.has(kpi.id) ? { color: performanceColor(delta.signed, preferences.performanceColors) } : undefined}>
                    {delta.text}
                  </span>{" "}
                  vs. anterior
                </>
              ) : (
                "—"
              )}
            </p>
          )}
        </div>;
      })}
    </div>;
  }

  return <div className={desktop ? "grid grid-cols-2 lg:grid-cols-4 gap-4" : "grid grid-cols-2 auto-rows-fr gap-2.5 mt-6"}>
    {visible.map((kpi, index) => {
      const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
      const data = values[kpi.id];
      const color = meta.semanticType === "performance" ? performanceColor(data.signed ?? null, preferences.performanceColors) : undefined;
      const IconComponent = resolveKpiIcon(kpi.id, kpi.icon);
      const columnSpan = kpiColumnSpan(index, visible.length);
      return <DashboardKpiCard key={kpi.id} label={meta.label} value={data.value} icon={IconComponent} color={color} columnSpan={columnSpan} />;
    })}
  </div>;
}
