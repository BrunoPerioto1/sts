import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { kpiValues } from "@/lib/dashboard-kpi-values";
import { resolveKpiIcon } from "@/components/dashboard/dashboard-icons";
import { useDashboardData } from "@/hooks/dashboard/use-dashboard-data";
import { DASHBOARD_KPI_REGISTRY, performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { formatSignedCurrency } from "@/lib/format";

function formatUnits(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" })} U`;
}

/**
 * Topo do Dashboard com os dados reais dos últimos 30 dias, redesenhado a cada
 * mudança de indicador, ordem, ícone ou cor. Lucro em unidades quando há banca
 * cadastrada; sem banca, em reais.
 */
export function DashboardPreview({ preferences, stake }: { preferences: DashboardPreferences; stake: number }) {
  const filters = useMemo(() => {
    const today = new Date();
    return { startDate: format(subDays(today, 29), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
  }, []);
  const { metrics, dailyData, loading, error } = useDashboardData(filters);
  const values = useMemo(() => kpiValues(metrics, stake), [metrics, stake]);
  const unit = stake > 0 ? stake / 100 : null;
  const fmt = (value: number) => (unit ? formatUnits(value) : formatSignedCurrency(value));
  const colors = preferences.performanceColors;

  // Série acumulada e pior sequência (maior queda de um pico até um vale).
  const { points, total, drawdown } = useMemo(() => {
    let acc = 0;
    let peak = 0;
    let worst = 0;
    const pts = dailyData.map((d) => {
      acc += unit ? d.profitDay / unit : d.profitDay;
      peak = Math.max(peak, acc);
      worst = Math.min(worst, acc - peak);
      return { date: d.date, acum: acc };
    });
    return { points: pts, total: acc, drawdown: worst };
  }, [dailyData, unit]);

  const lineColor = performanceColor(total, colors);
  const visible = preferences.kpis.filter((kpi) => kpi.visible);
  const ticks = points.length > 3
    ? [0, 1, 2, 3].map((i) => points[Math.round((i * (points.length - 1)) / 3)].date)
    : points.map((p) => p.date);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-base font-semibold">Dashboard</h3>
        <span className="text-xs text-zinc-400">Últimos 30 dias</span>
      </div>

      {error ? (
        <p className="text-[13px] text-zinc-400 py-10 text-center">Não foi possível carregar a prévia.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {visible.map((kpi, i) => {
              const meta = DASHBOARD_KPI_REGISTRY[kpi.id];
              const IconComponent = resolveKpiIcon(kpi.id, kpi.icon);
              const data = values[kpi.id];
              const color = meta.semanticType === "performance" ? performanceColor(data.signed ?? null, colors) : undefined;
              return (
                <div key={kpi.id} className="rounded-lg border border-border bg-foreground/[0.02] p-3 min-w-0">
                  <p className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                    <IconComponent size={13} aria-hidden="true" /> {meta.label}
                  </p>
                  {loading ? (
                    <Skeleton className="h-6 w-20 mt-2.5" delay={i * 60} />
                  ) : (
                    <p className="text-xl font-semibold tabular-nums mt-2 truncate" style={{ color }}>{data.value}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-foreground/[0.02] p-4 mt-2.5">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <p className="text-[13px] text-zinc-300">
                Lucro acumulado{" "}
                {!loading && points.length > 0 && (
                  <span className="ml-1.5 font-semibold tabular-nums" style={{ color: lineColor }}>{fmt(total)}</span>
                )}
              </p>
              {!loading && drawdown < 0 && (
                <span className="text-xs text-zinc-500 tabular-nums">pior sequência {fmt(drawdown)}</span>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : points.length === 0 ? (
              <p className="h-[150px] flex items-center justify-center text-[13px] text-zinc-400">Nenhuma aposta liquidada nos últimos 30 dias.</p>
            ) : (
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="preview-acum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--color-divider)" strokeOpacity={0.18} />
                    <XAxis
                      dataKey="date"
                      ticks={ticks}
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--color-text)", opacity: 0.45, fontSize: 10 }}
                      tickFormatter={(v) => format(parseISO(v), "dd/MM")}
                    />
                    <Area type="monotone" dataKey="acum" stroke={lineColor} strokeWidth={2} fill="url(#preview-acum)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
