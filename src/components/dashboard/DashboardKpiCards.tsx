import { DASHBOARD_KPI_REGISTRY, kpiColumnSpan, performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { kpiValues, type KpiInput } from "@/lib/dashboard-kpi-values";
import { cn } from "@/lib/utils";
import { resolveKpiIcon } from "./dashboard-icons";
import { DASHBOARD_PANEL } from "./DashboardCard";

// Classes inteiras (não montadas): o Tailwind só gera o que acha escrito.
const DESKTOP_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

/**
 * Os KPIs escolhidos em Configurações (de 2 a 4): rótulo e ícone em cima, o
 * número grande embaixo e nada mais.
 */
export function DashboardKpiCards({
  input,
  preferences,
  compact = false,
  className,
  style,
}: {
  input: KpiInput;
  preferences: DashboardPreferences;
  /** Celular: grade 2×2 e número menor. */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const values = kpiValues(input);
  const visible = preferences.kpis.filter((kpi) => kpi.visible);

  return (
    <div className={cn("grid", compact ? "grid-cols-2 gap-2.5" : cn("gap-3", DESKTOP_COLS[visible.length]), className)} style={style}>
      {visible.map((kpi, index) => {
        const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
        const data = values[kpi.id];
        const color = meta.semanticType === "performance" ? performanceColor(data.signed ?? null, preferences.performanceColors) : undefined;
        const Icon = resolveKpiIcon(kpi.id, kpi.icon);
        return (
          <div
            key={kpi.id}
            className={cn(
              "flex min-w-0 flex-col",
              DASHBOARD_PANEL,
              // Menos fundo embaixo do número que em cima do rótulo: o número
              // fecha o card, sem a sobra de ar que o fazia parecer solto.
              compact ? "gap-2 px-4 pb-3 pt-3.5" : "gap-2.5 px-[22px] pb-4 pt-[18px]",
              compact && kpiColumnSpan(index, visible.length) === 2 && "col-span-2",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("truncate text-zinc-400", compact ? "text-[13px]" : "text-sm")}>
                {compact ? meta.shortLabel ?? meta.label : meta.label}
              </span>
              <Icon size={compact ? 16 : 18} className="shrink-0 text-zinc-600" aria-hidden="true" />
            </div>
            <p
              className={cn(
                "whitespace-nowrap font-semibold leading-none tracking-[-0.02em] tabular-nums",
                compact ? "text-[22px] max-[359px]:text-lg" : "text-[28px]",
              )}
              style={{ color }}
            >
              {data.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
