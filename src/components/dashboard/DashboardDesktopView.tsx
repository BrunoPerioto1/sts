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
 * Três faixas, na ordem das perguntas da tela: os KPIs (quanto ganhei, ROI,
 * banca, volume); o lucro acumulado na largura toda, que é o elemento
 * principal; e embaixo o calendário (clicar num dia abre o detalhe) ao lado
 * de dois cards pequenos, taxa de acerto e lucro por esporte. O calendário tem
 * a largura da própria grade (células de 80×44, as do desenho).
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

      <DashboardMainChart
        className="animate-rise stagger"
        style={stagger(1)}
        dailyData={dailyData}
        bankroll={bankrollPoints}
        filtered={filters.houseIds.length > 0 || filters.sportIds.length > 0}
        preset={preset}
        onPresetChange={onPresetChange}
      />

      {/* Tela larga (2xl): calendário + dois cards pequenos na mesma linha.
          No xl não cabem os três: esportes desce pra linha de baixo. */}
      <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)] 2xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <ResultsCalendar
          className="animate-rise stagger"
          style={stagger(2)}
          dailyData={dailyData}
          startDate={filters.startDate}
          endDate={filters.endDate}
          colors={colors}
          selected={day}
          onSelect={setDay}
        />
        <HitRateCard className="animate-rise stagger" style={stagger(3)} metrics={metrics} />
        {/* self-start: com menos esportes que a altura do vizinho, o card fica
            baixo em vez de esticar e parecer vazio. */}
        <SportsCard className="animate-rise stagger self-start xl:col-span-2 2xl:col-span-1" style={stagger(4)} filters={filters} colors={colors} />
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
