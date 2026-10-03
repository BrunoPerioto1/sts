import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMe } from "@/hooks/queries/use-me";
import { useBankrollSeries } from "@/hooks/dashboard/use-bankroll-series";
import { useHouseProfit } from "@/hooks/dashboard/use-house-profit";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { stagger } from "@/lib/motion";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { normalizeDashboardPreferences, performanceColor } from "@/lib/dashboard-preferences";
import { DashboardKpiGrid } from "./DashboardKpiGrid";
import { DashboardProfitHero, daysSummary } from "./DashboardProfitHero";
import { ProfitBarChart } from "./ProfitBarChart";
import { BankrollChart } from "./BankrollChart";
import { HouseProfitBars } from "./HouseProfitBars";

// Até um mês cabe uma barra por dia; acima disso a leitura só funciona por
// semana. O período em si vem do seletor único lá no topo da tela.
function groupByWeek(data: DailySummaryPoint[]) {
  if (data.length <= 31) return data.map(({ date, profitDay }) => ({ date, profitDay }));
  const buckets = new Map<string, number>();
  for (const point of data) {
    const key = format(startOfWeek(parseISO(point.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    buckets.set(key, (buckets.get(key) ?? 0) + point.profitDay);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, profitDay]) => ({ date, profitDay }));
}

function Panel({ label, right, children, className }: {
  label: string; right?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <h3 className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</h3>
        {right}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-t border-foreground/[0.05]">
      <span className="text-[13px] text-zinc-400">{label}</span>
      <span className="text-[13px] tabular-nums font-medium" style={{ color }}>{value}</span>
    </div>
  );
}

interface DashboardDesktopViewProps {
  filters: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  preset: DatePreset;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  onPresetChange: (preset: DatePreset) => void;
}

/**
 * Uma superfície só, dividida em faixas: resultado do período em cima, régua de
 * KPIs no meio, banca acumulada e lucro por casa embaixo. As duas metades de
 * baixo contam histórias diferentes — como foi cada dia e como o patrimônio
 * andou.
 */
export function DashboardDesktopView({
  filters,
  preset,
  metrics,
  previousMetrics,
  dailyData,
  onPresetChange,
}: DashboardDesktopViewProps) {
  const { me } = useMe();
  const byHouse = useHouseProfit(filters.startDate, filters.endDate, filters.houseIds, filters.sportIds);
  const preferences = normalizeDashboardPreferences(me?.dashboardPreferences);

  const profit = Number(metrics.totalProfit);
  const chartData = useMemo(() => groupByWeek(dailyData), [dailyData]);
  const bankroll = useBankrollSeries(filters.startDate, filters.endDate);
  const bestDay = dailyData.reduce<DailySummaryPoint | null>(
    (best, day) => (best == null || day.profitDay > best.profitDay ? day : best),
    null
  );
  const worstDay = dailyData.reduce<DailySummaryPoint | null>(
    (worst, day) => (worst == null || day.profitDay < worst.profitDay ? day : worst),
    null
  );
  const hasData = dailyData.length > 0;

  return (
    <div
      className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.012] overflow-hidden animate-rise stagger"
      style={stagger(0)}
    >
      <div className="grid lg:grid-cols-[minmax(280px,340px)_1fr]">
        <div className="p-6 border-b border-foreground/[0.05] lg:border-b-0 lg:border-r">
          <DashboardProfitHero
            size="desktop"
            profit={profit}
            color={performanceColor(profit, preferences.performanceColors)}
            summary={daysSummary(dailyData)}
            resetKey={`${filters.startDate}-${filters.endDate}`}
          />
          <div className="mt-6">
            <StatRow
              label="Melhor dia"
              value={
                bestDay
                  ? `${formatSignedCurrency(bestDay.profitDay)} · ${format(parseISO(bestDay.date), "d MMM", { locale: ptBR })}`
                  : "—"
              }
              color={bestDay && bestDay.profitDay > 0 ? "var(--color-positive)" : undefined}
            />
            {/* "Volume apostado" saiu daqui: repetia o KPI "Total apostado" logo abaixo. */}
            <StatRow
              label="Pior dia"
              value={
                worstDay && worstDay.profitDay < 0
                  ? `${formatSignedCurrency(worstDay.profitDay)} · ${format(parseISO(worstDay.date), "d MMM", { locale: ptBR })}`
                  : "—"
              }
              color={worstDay && worstDay.profitDay < 0 ? "var(--color-negative)" : undefined}
            />
          </div>
        </div>

        <Panel
          label={dailyData.length <= 31 ? "Resultado por dia" : "Resultado por semana"}
          className="p-6"
          right={
            hasData ? (
              <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-positive" /> Ganho
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-negative" /> Perda
                </span>
              </div>
            ) : undefined
          }
        >
          {hasData ? (
            <ProfitBarChart data={chartData} height={300} />
          ) : (
            <div className="h-[300px] flex flex-col items-start justify-center gap-2">
              <p className="text-[13px] text-zinc-400">
                Nenhuma aposta liquidada no período. Experimente ampliar as datas.
              </p>
              {preset !== "60d" && preset !== "allTime" && (
                <button
                  type="button"
                  onClick={() => onPresetChange("60d")}
                  className="press text-[13px] text-accent font-medium"
                >
                  Ampliar para 60 dias
                </button>
              )}
            </div>
          )}
        </Panel>
      </div>

      <div className="border-t border-foreground/[0.05]">
        <DashboardKpiGrid metrics={metrics} previous={previousMetrics} stake={Number(me?.stake ?? 0)} preferences={preferences} desktop />
      </div>

      <div className="grid lg:grid-cols-[1fr_minmax(340px,440px)] border-t border-foreground/[0.05]">
        <Panel
          // Banca é o patrimônio somado das casas: não tem como recortar por
          // esporte, então com filtro ativo o rótulo avisa que é o total.
          label={filters.houseIds.length || filters.sportIds.length ? "Banca acumulada · todas as casas" : "Banca acumulada"}
          className="p-6 border-b border-foreground/[0.05] lg:border-b-0 lg:border-r"
          right={
            bankroll.length > 0 ? (
              <span className="text-[13px] text-zinc-300 tabular-nums">
                {formatCurrency(bankroll[0].balance)} → {formatCurrency(bankroll[bankroll.length - 1].balance)}
              </span>
            ) : undefined
          }
        >
          {bankroll.length > 0 ? (
            <BankrollChart data={bankroll} height={240} />
          ) : (
            <p className="text-[13px] text-zinc-400 h-[240px] flex items-center">Sem movimentação no período.</p>
          )}
        </Panel>

        <Panel label="Por casa" className="p-6" right={<span className="text-[11px] text-zinc-400">no período</span>}>
          <HouseProfitBars rows={byHouse.slice(0, 5)} />
        </Panel>
      </div>
    </div>
  );
}
