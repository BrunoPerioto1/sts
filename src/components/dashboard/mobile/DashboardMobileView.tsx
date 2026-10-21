import { useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { SlidersHorizontal } from "@phosphor-icons/react";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { useDashboardKpis } from "@/hooks/dashboard/use-dashboard-kpis";
import { stagger } from "@/lib/motion";
import { formatDayMonth } from "@/lib/format";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardFiltersSheet, countActiveDashboardFilters, type DashboardFiltersDraft } from "./DashboardFiltersSheet";
import { PRESET_LABEL } from "@/lib/dashboard-periods";
import { DashboardKpiCards } from "../DashboardKpiCards";
import { DashboardMainChart } from "../DashboardMainChart";
import { DayDetail } from "../DayDetail";
import { HitRateCard } from "../HitRateCard";
import { ResultsCalendar } from "../ResultsCalendar";
import { SportsCard } from "../SportsCard";

interface DashboardMobileViewProps {
  filters: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  preset: DatePreset;
  firstBetDate: string | null;
  metrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  houses: { id: number; name: string }[];
  sports: { id: number; name: string }[];
  onPresetChange: (preset: DatePreset) => void;
  onApplyFilters: (next: DashboardFiltersDraft) => void;
}

/** A mesma ordem do desktop, empilhada: KPIs 2×2, gráfico, acerto, calendário, esportes. */
export function DashboardMobileView({
  filters,
  preset,
  firstBetDate,
  metrics,
  dailyData,
  houses,
  sports,
  onPresetChange,
  onApplyFilters,
}: DashboardMobileViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = countActiveDashboardFilters({ preset, houseIds: filters.houseIds, sportIds: filters.sportIds });
  const invalidate = useInvalidateBetData();
  const pull = usePullToRefresh(invalidate);
  const { preferences, bankrollPoints, input } = useDashboardKpis(filters, metrics);
  const colors = preferences.performanceColors;
  const [day, setDay] = useState<string | null>(null);

  const days = differenceInCalendarDays(parseISO(filters.endDate), parseISO(filters.startDate)) + 1;
  const rangeSuffix = preset === "custom" ? `${days} dias` : PRESET_LABEL[preset].toLowerCase();

  return (
    <>
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      <div className="min-h-[calc(100dvh-96px)] px-4 pt-5 pb-6 flex flex-col gap-2.5">
        {/* A tela é de ponta a ponta (sem o header do MainLayout), então o
            PageHeader vem aqui dentro. Período no subtítulo; filtros no mesmo
            botão de Apostas. */}
        <PageHeader
          className="mb-3 shrink-0 animate-rise stagger"
          title="Dashboard"
          subtitle={`${formatDayMonth(filters.startDate)} – ${formatDayMonth(filters.endDate)} · ${rangeSuffix}`}
          actions={
            <Button variant="icon" onClick={() => setFiltersOpen(true)} aria-label="Abrir filtros" badge={activeFilterCount}>
              <SlidersHorizontal />
            </Button>
          }
        />

        <DashboardKpiCards
          compact
          className="animate-rise stagger"
          style={stagger(1)}
          input={input}
          preferences={preferences}
        />

        <DashboardMainChart
          compact
          className="animate-rise stagger"
          style={stagger(2)}
          height={190}
          dailyData={dailyData}
          bankroll={bankrollPoints}
          filtered={filters.houseIds.length > 0 || filters.sportIds.length > 0}
          preset={preset}
          onPresetChange={onPresetChange}
        />

        <HitRateCard className="animate-rise stagger" style={stagger(3)} metrics={metrics} />

        <ResultsCalendar
          compact
          className="animate-rise stagger"
          style={stagger(4)}
          dailyData={dailyData}
          startDate={filters.startDate}
          endDate={filters.endDate}
          colors={colors}
          selected={day}
          onSelect={setDay}
        />

        <SportsCard className="animate-rise stagger" style={stagger(5)} filters={filters} colors={colors} />
      </div>

      <DayDetail day={day} days={dailyData.map((d) => d.date)} filters={filters} colors={colors} onChange={setDay} />

      <DashboardFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={{ preset, ...filters }}
        onApply={onApplyFilters}
        firstBetDate={firstBetDate}
        houses={houses}
        sports={sports}
      />
    </>
  );
}
