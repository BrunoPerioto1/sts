import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WarningCircle } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardChecklist } from "@/components/dashboard/DashboardChecklist";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { useHouses } from "@/hooks/queries/use-houses";
import { useSports } from "@/hooks/queries/use-sports";
import { DashboardMobileView } from "@/components/dashboard/mobile/DashboardMobileView";
import { DashboardMobileSkeleton } from "@/components/dashboard/mobile/DashboardMobileSkeleton";
import { DashboardDesktopSkeleton } from "@/components/dashboard/DashboardDesktopSkeleton";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardDesktopView } from "@/components/dashboard/DashboardDesktopView";
import { PeriodPopover } from "@/components/dashboard/PeriodPopover";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { useDashboardData } from "@/hooks/dashboard/use-dashboard-data";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardPageContentProps {
  hasNoBets: boolean;
  ready: boolean;
  error: boolean;
  onRetry: () => void;
  desktopView: React.ReactNode;
  // Em telas estreitas o corpo do dashboard é outro (card único do mobile);
  // os estados de carregando/sem apostas continuam sendo os mesmos.
  mobileView?: React.ReactNode;
}

function DashboardPageContent({
  hasNoBets,
  ready,
  error,
  onRetry,
  desktopView,
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
    return <div className="px-4 pt-6 sm:p-0"><DashboardChecklist /></div>;
  }

  return <>{mobileView ?? desktopView}</>;
}

export function DashboardPage() {
  const isMobile = useIsMobile();
  const { filters, preset, setPreset, setCustomRange, setHouseIds, setSportIds, firstBetDate, hasNoBets, ready } =
    useDashboardFilters();
  const { metrics, previousMetrics, dailyData, loading, error, reload } = useDashboardData(filters);
  const houses = useHouses();
  const sports = useSports();

  const rangeLabel =
    ready && filters.startDate && filters.endDate
      ? `${format(parseISO(filters.startDate), "dd MMM", { locale: ptBR })} – ${format(parseISO(filters.endDate), "dd MMM", { locale: ptBR })}`
      : undefined;

  // "Visao geral ... - 21 ago - 3 set - 82 apostas liquidadas": o periodo e o
  // volume ficam juntos, com contraste maior que o subtitulo padrao.
  const subtitle = [
    "Visão geral da sua performance",
    rangeLabel,
    ready && !loading ? `${Number(metrics.settledBets)} apostas liquidadas` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Recorte por casa/esporte só no desktop: o header do mobile é a própria
  // tela (mobileFullBleed) e o seletor de casas de lá é outro (CasaSheet).
  const headerActions = (
    <div className="flex items-center gap-2">
      {!hasNoBets && (
        <>
          <div className="h-9 flex items-center px-3 rounded-lg border border-foreground/10">
            <HouseMultiSelect houses={houses} selected={filters.houseIds} onChange={setHouseIds} label="Casas" />
          </div>
          <div className="h-9 flex items-center px-3 rounded-lg border border-foreground/10">
            <HouseMultiSelect
              houses={sports}
              selected={filters.sportIds}
              onChange={setSportIds}
              label="Esportes"
              noun={["esporte", "esportes"]}
              allLabel="Todos"
            />
          </div>
        </>
      )}
      <PeriodPopover
        preset={preset}
        firstBetDate={firstBetDate}
        from={filters.startDate}
        to={filters.endDate}
        onSelect={setPreset}
        onCustomRange={setCustomRange}
      />
    </div>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle={subtitle}
      titleWrapperClassName="flex flex-col gap-0.5 min-w-0"
      titleClassName="text-2xl font-semibold tracking-tight"
      subtitleClassName="text-sm text-zinc-400 truncate"
      // No mobile a tela é edge-to-edge e o próprio conteúdo já se apresenta
      // ("Resultado" + chip de período), então não há header. Quem aplica isso
      // só abaixo de 640px é o CSS dentro do MainLayout, não este booleano.
      mobileFullBleed
      actions={headerActions}
    >
      <DashboardPageContent
        hasNoBets={hasNoBets}
        ready={ready && !loading}
        error={error}
        onRetry={reload}
        desktopView={
          <DashboardDesktopView
            filters={filters}
            preset={preset}
            metrics={metrics}
            previousMetrics={previousMetrics}
            dailyData={dailyData}
            onPresetChange={setPreset}
          />
        }
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
