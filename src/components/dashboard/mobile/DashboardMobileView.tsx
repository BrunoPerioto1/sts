import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretDown, ChartLine } from "@phosphor-icons/react";
import { useMe } from "@/hooks/queries/use-me";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { stagger } from "@/lib/motion";
import { DashboardKpiGrid } from "../DashboardKpiGrid";
import { normalizeDashboardPreferences, performanceColor } from "@/lib/dashboard-preferences";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { PeriodSheet } from "../PeriodSheet";
import { PRESET_LABEL } from "@/lib/dashboard-periods";
import { ProfitBarChart } from "../ProfitBarChart";
import { DashboardProfitHero, daysSummary } from "../DashboardProfitHero";

// Barras também representam um único dia; vazio só quando não há dados.
const MIN_DAYS_FOR_CHART = 1;

interface DashboardMobileViewProps {
  filters: { startDate: string; endDate: string };
  preset: DatePreset;
  firstBetDate: string | null;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  onPresetChange: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
}

export function DashboardMobileView({
  filters,
  preset,
  firstBetDate,
  metrics,
  dailyData,
  onPresetChange,
  onCustomRange,
}: DashboardMobileViewProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const { me } = useMe();
  const invalidate = useInvalidateBetData();
  const pull = usePullToRefresh(invalidate);
  const preferences = normalizeDashboardPreferences(me?.dashboardPreferences);
  const profit = Number(metrics.totalProfit);

  const days = differenceInCalendarDays(parseISO(filters.endDate), parseISO(filters.startDate)) + 1;
  const shortDate = (iso: string) => format(parseISO(iso), "d MMM", { locale: ptBR });
  const rangeSuffix = preset === "custom" ? `${days} dias` : PRESET_LABEL[preset].toLowerCase();

  return (
    <>
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      <div className="min-h-[calc(100dvh-96px)] px-4 pt-5 pb-6 flex flex-col">
        <div className="flex items-start justify-between gap-3 shrink-0 animate-rise stagger" style={stagger(0)}>
          <div className="min-w-0">
            <h2 className="text-[28px] leading-tight font-semibold tracking-tight">Dashboard</h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarBlank size={17} className="shrink-0" aria-hidden="true" />
              <span>
              {shortDate(filters.startDate)} – {shortDate(filters.endDate)} · {rangeSuffix}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="press shrink-0 flex items-center gap-1.5 h-11 px-3 rounded-xl border border-white/10 text-sm text-zinc-300"
          >
            {PRESET_LABEL[preset]} <CaretDown size={12} />
          </button>
        </div>

        <DashboardProfitHero
          className="mt-8 shrink-0 animate-rise stagger"
          style={stagger(1)}
          profit={profit}
          color={performanceColor(profit, preferences.performanceColors)}
          summary={daysSummary(dailyData)}
          resetKey={`${filters.startDate}-${filters.endDate}`}
        />

        <div className="mt-5 animate-rise stagger" style={stagger(2)}>
          {dailyData.length >= MIN_DAYS_FOR_CHART ? (
            <ProfitBarChart data={dailyData} />
          ) : (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="flex items-start gap-2">
                <ChartLine size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-400 leading-snug">
                  Nenhuma aposta no período. Experimente ampliar as datas.
                </p>
              </div>
              {preset !== "60d" && preset !== "allTime" && (
                <button
                  type="button"
                  onClick={() => onPresetChange("60d")}
                  className="press text-sm text-accent font-medium mt-2 ml-6"
                >
                  Ampliar para 60 dias
                </button>
              )}
            </div>
          )}
        </div>

        <DashboardKpiGrid metrics={metrics} stake={Number(me?.stake ?? 0)} preferences={preferences} />

      </div>

      <PeriodSheet
        open={periodOpen}
        onOpenChange={setPeriodOpen}
        preset={preset}
        firstBetDate={firstBetDate}
        from={filters.startDate}
        to={filters.endDate}
        onSelect={onPresetChange}
        onCustomRange={onCustomRange}
      />
    </>
  );
}
