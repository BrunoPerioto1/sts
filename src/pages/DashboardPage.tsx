import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarSlash } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { DashboardMobileView } from "@/components/dashboard/mobile/DashboardMobileView";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainMetrics } from "@/components/dashboard/MainMetrics";
import { Segmented } from "@/components/ui/segmented";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/useDashboardFilters";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

interface DashboardPageContentProps {
  hasNoBets: boolean;
  ready: boolean;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  // Em telas estreitas o corpo do dashboard é outro (card único do mobile);
  // os estados de carregando/sem apostas continuam sendo os mesmos.
  mobileView?: React.ReactNode;
}

function DashboardPageContent({
  hasNoBets,
  ready,
  metrics,
  previousMetrics,
  dailyData,
  mobileView,
}: DashboardPageContentProps) {
  if (!ready) {
    return (
      <div className="py-24">
        <Spinner label="Carregando dashboard…" />
      </div>
    );
  }

  if (ready && hasNoBets) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-border rounded-md">
        <CalendarSlash size={30} className="opacity-35 mb-3" />
        <h3 className="text-base font-medium mb-1">Nenhuma aposta registrada ainda</h3>
        <p className="text-[12.5px] opacity-60 max-w-sm mb-4">
          Registre sua primeira aposta pelo Telegram ou por aqui para começar a ver suas métricas.
        </p>
        <Button asChild>
          <Link to="/bets">Nova aposta</Link>
        </Button>
      </div>
    );
  }

  if (mobileView) return <>{mobileView}</>;

  return (
    <div className="space-y-7">
      <DailyEvolutionChart data={dailyData} />

      <MainMetrics metrics={metrics} previousMetrics={previousMetrics} />
    </div>
  );
}

export function DashboardPage() {
  const isMobile = useIsMobile();
  const { filters, preset, setPreset, setCustomRange, firstBetDate, hasNoBets, ready } = useDashboardFilters();
  const { metrics, previousMetrics, dailyData } = useDashboardData(filters);

  const rangeLabel =
    ready && filters.startDate && filters.endDate
      ? `${format(parseISO(filters.startDate), "dd MMM", { locale: ptBR })} – ${format(parseISO(filters.endDate), "dd MMM", { locale: ptBR })}`
      : undefined;

  const segmentedControl = (
    <Segmented
      options={[
        { value: "currentMonth", label: "Mês atual" },
        { value: "60d", label: "60 dias" },
      ]}
      value={preset as "currentMonth" | "60d"}
      onChange={(v) => setPreset(v as DatePreset)}
    />
  );

  const desktopHeaderControls = (
    <>
      {segmentedControl}
      <DateRangeField
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(from, to) => setCustomRange(from, to)}
        iconOnly
      />
    </>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle={rangeLabel}
      // No mobile a tela é edge-to-edge e o próprio conteúdo já se apresenta
      // ("Resultado" + chip de período), então não há header.
      mobileFullBleed={isMobile}
      actions={desktopHeaderControls}
    >
      <DashboardPageContent
        hasNoBets={hasNoBets}
        ready={ready}
        metrics={metrics}
        previousMetrics={previousMetrics}
        dailyData={dailyData}
        mobileView={
          isMobile ? (
            <DashboardMobileView
              filters={filters}
              preset={preset}
              firstBetDate={firstBetDate}
              metrics={metrics}
              previousMetrics={previousMetrics}
              dailyData={dailyData}
              onPresetChange={setPreset}
              onCustomRange={setCustomRange}
            />
          ) : undefined
        }
      />
    </MainLayout>
  );
}
