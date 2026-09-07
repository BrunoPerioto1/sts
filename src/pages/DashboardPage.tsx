import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarSlash, WarningCircle } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "react-router-dom";
import { DailyEvolutionChart } from "@/components/dashboard/DailyEvolutionChart";
import { DashboardMobileView } from "@/components/dashboard/mobile/DashboardMobileView";
import { DashboardMobileSkeleton } from "@/components/dashboard/mobile/DashboardMobileSkeleton";
import { DashboardDesktopSkeleton } from "@/components/dashboard/DashboardDesktopSkeleton";
import { MainLayout } from "@/components/layout/MainLayout";
import { MainMetrics } from "@/components/dashboard/MainMetrics";
import { Segmented } from "@/components/ui/segmented";
import { DateRangeField } from "@/components/ui/date-range-field";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/useDashboardFilters";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

interface DashboardPageContentProps {
  hasNoBets: boolean;
  ready: boolean;
  error: boolean;
  onRetry: () => void;
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
  error,
  onRetry,
  metrics,
  previousMetrics,
  dailyData,
  mobileView,
}: DashboardPageContentProps) {
  if (error) {
    return <div role="alert">
      <EmptyState
        icon={<WarningCircle size={30} />}
        title="Não foi possível carregar o dashboard"
        description="Verifique sua conexão e tente de novo."
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    </div>;
  }
  if (!ready) {
    // `mobileView` so vem preenchido em tela estreita — e o sinal de que o
    // esqueleto certo e o do layout mobile, e nao o spinner generico.
    return mobileView ? <DashboardMobileSkeleton /> : <DashboardDesktopSkeleton />;
  }

  if (ready && hasNoBets) {
    return (
      <EmptyState
        icon={<CalendarSlash size={30} />}
        title="Nenhuma aposta registrada ainda"
        description="Registre sua primeira aposta pelo Telegram ou por aqui para começar a ver suas métricas."
        action={<Button asChild><Link to="/bets">Nova aposta</Link></Button>}
      />
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
  const { metrics, previousMetrics, dailyData, loading, error, reload } = useDashboardData(filters);

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
      // ("Resultado" + chip de período), então não há header. Quem aplica isso
      // só abaixo de 640px é o CSS dentro do MainLayout, não este booleano.
      mobileFullBleed
      actions={desktopHeaderControls}
    >
      <DashboardPageContent
        hasNoBets={hasNoBets}
        ready={ready && !loading}
        error={error}
        onRetry={reload}
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
