import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartLine, SlidersHorizontal } from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { DashboardFiltersSheet, countActiveDashboardFilters, type DashboardFiltersDraft } from "./DashboardFiltersSheet";
import { PRESET_LABEL } from "@/lib/dashboard-periods";
import { ProfitBarChart } from "../ProfitBarChart";
import { CumulativeProfitChart } from "../CumulativeProfitChart";
import { DashboardProfitHero, daysSummary } from "../DashboardProfitHero";

// Barras também representam um único dia; vazio só quando não há dados.
const MIN_DAYS_FOR_CHART = 1;

const CHART_OPTIONS = [
  { value: "dia", label: "Dia" },
  { value: "acumulado", label: "Acumulado" },
] as const;

interface DashboardMobileViewProps {
  filters: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  preset: DatePreset;
  firstBetDate: string | null;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  houses: { id: number; name: string }[];
  sports: { id: number; name: string }[];
  onPresetChange: (preset: DatePreset) => void;
  onApplyFilters: (next: DashboardFiltersDraft) => void;
}

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
  const [grafico, setGrafico] = useState<"dia" | "acumulado">("dia");
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
        {/* A tela é de ponta a ponta (sem o header do MainLayout), então o
            PageHeader vem aqui dentro. Período no subtítulo; filtros no mesmo
            botão de Apostas. */}
        <PageHeader
          className="shrink-0 animate-rise stagger"
          title="Dashboard"
          subtitle={`${shortDate(filters.startDate)} – ${shortDate(filters.endDate)} · ${rangeSuffix}`}
          actions={
            <Button variant="icon" onClick={() => setFiltersOpen(true)} aria-label="Abrir filtros" badge={activeFilterCount}>
              <SlidersHorizontal />
            </Button>
          }
        />

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
            <>
              <Segmented
                label="Gráfico"
                className="flex w-full mb-3"
                value={grafico}
                options={CHART_OPTIONS}
                onChange={setGrafico}
              />
              {grafico === "dia" ? (
                <ProfitBarChart data={dailyData} />
              ) : (
                <CumulativeProfitChart data={dailyData} height={180} />
              )}
            </>
          ) : (
            <div className="rounded-lg bg-foreground/[0.03] p-3">
              <div className="flex items-start gap-2">
                <ChartLine size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-400 leading-snug">
                  Nenhuma aposta no período. Experimente ampliar as datas.
                </p>
              </div>
              {preset !== "60d" && preset !== "allTime" && (
                <Button variant="ghost" size="sm" className="mt-1 ml-4" onClick={() => onPresetChange("60d")}>
                  Ampliar para 60 dias
                </Button>
              )}
            </div>
          )}
        </div>

        <DashboardKpiGrid metrics={metrics} stake={Number(me?.stake ?? 0)} preferences={preferences} />

      </div>

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
