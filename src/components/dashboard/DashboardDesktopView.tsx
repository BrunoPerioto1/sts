import { useState } from "react";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { useDashboardKpis } from "@/hooks/dashboard/use-dashboard-kpis";
import { stagger } from "@/lib/motion";
import { DashboardKpiCards } from "./DashboardKpiCards";
import { DashboardMainChart } from "./DashboardMainChart";
import { DayDetail } from "./DayDetail";
import { HitRateCard } from "./HitRateCard";
import { ResultsCalendar } from "./ResultsCalendar";
import { SportsCard } from "./SportsCard";

interface DashboardDesktopViewProps {
  filters: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  preset: DatePreset;
  metrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  onPresetChange: (preset: DatePreset) => void;
}

/**
 * Três faixas: os KPIs escolhidos (2 a 4) no topo; o gráfico com abas ao lado
 * da taxa de acerto contra o ponto de empate; o calendário do mês (clicar num
 * dia abre o detalhe dele) ao lado da divisão por esporte.
 */
export function DashboardDesktopView({
  filters,
  preset,
  metrics,
  dailyData,
  onPresetChange,
}: DashboardDesktopViewProps) {
  const { preferences, bankrollPoints, input } = useDashboardKpis(filters, metrics);
  const colors = preferences.performanceColors;
  const [day, setDay] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <DashboardKpiCards className="animate-rise stagger" input={input} preferences={preferences} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <DashboardMainChart
          className="animate-rise stagger"
          style={stagger(1)}
          dailyData={dailyData}
          bankroll={bankrollPoints}
          filtered={filters.houseIds.length > 0 || filters.sportIds.length > 0}
          preset={preset}
          onPresetChange={onPresetChange}
        />
        <HitRateCard className="animate-rise stagger" style={stagger(2)} metrics={metrics} colors={colors} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ResultsCalendar
          className="animate-rise stagger"
          style={stagger(3)}
          dailyData={dailyData}
          startDate={filters.startDate}
          endDate={filters.endDate}
          colors={colors}
          selected={day}
          onSelect={setDay}
        />
        <SportsCard className="animate-rise stagger" style={stagger(4)} filters={filters} colors={colors} />
      </div>

      <DayDetail
        day={day}
        days={dailyData.map((d) => d.date)}
        filters={filters}
        colors={colors}
        onChange={setDay}
      />
    </div>
  );
}
