import { WarningCircle } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardChecklist } from "@/components/dashboard/DashboardChecklist";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { useHouses } from "@/hooks/queries/use-houses";
import { useSports } from "@/hooks/queries/use-sports";
import { DashboardMobileView } from "@/components/dashboard/mobile/DashboardMobileView";
import { type DashboardFiltersDraft } from "@/components/dashboard/mobile/DashboardFiltersSheet";
import { DashboardMobileSkeleton } from "@/components/dashboard/mobile/DashboardMobileSkeleton";
import { DashboardDesktopSkeleton } from "@/components/dashboard/DashboardDesktopSkeleton";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardDesktopView } from "@/components/dashboard/DashboardDesktopView";
import { PeriodPopover } from "@/components/dashboard/PeriodPopover";
import { Button } from "@/components/ui/button";
import { useDashboardFilters, type DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { useDashboardData } from "@/hooks/dashboard/use-dashboard-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDayMonth, formatInt } from "@/lib/format";

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
  const { metrics, dailyData, loading, error, reload } = useDashboardData(filters);
  const houses = useHouses();
  const sports = useSports();

  // "Aplicar" do sheet de filtros do mobile: os setters rodam no mesmo handler,
  // então o React junta tudo num render só e o react-query dispara uma única
  // leva de requisições (a chave é por valor — nada mudou, nada busca).
  const applyMobileFilters = (next: DashboardFiltersDraft) => {
    if (next.preset === "custom") setCustomRange(next.startDate, next.endDate);
    else setPreset(next.preset);
    setHouseIds(next.houseIds);
    setSportIds(next.sportIds);
  };

  const rangeLabel =
    ready && filters.startDate && filters.endDate
      ? `${formatDayMonth(filters.startDate)} – ${formatDayMonth(filters.endDate)}`
      : undefined;

  // "Visao geral ... - 21 ago - 3 set - 82 apostas liquidadas": o periodo e o
  // volume ficam juntos, com contraste maior que o subtitulo padrao.
  const subtitle = [
    "Visão geral da sua performance",
    rangeLabel,
    ready && !loading ? `${formatInt(metrics.settledBets)} apostas liquidadas` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Filtros do topo só no desktop: o header do mobile é a própria tela
  // (mobileFullBleed) e lá os filtros ficam no DashboardFiltersSheet. Pílulas,
  // como no desenho do dashboard: rótulo apagado, valor aceso.
  const pill = "h-9 flex items-center px-3.5 rounded-full border border-foreground/10 bg-card hover:border-foreground/20 transition-colors";
  const headerActions = (
    <div className="flex items-center gap-2">
      {!hasNoBets && (
        <>
          <div className={pill}>
            <HouseMultiSelect houses={houses} selected={filters.houseIds} onChange={setHouseIds} label="Casas" />
          </div>
          <div className={pill}>
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
        className="rounded-full px-3.5 bg-card"
      />
    </div>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle={subtitle}
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
              dailyData={dailyData}
              houses={houses}
              sports={sports}
              onPresetChange={setPreset}
              onApplyFilters={applyMobileFilters}
            />
          ) : undefined
        }
      />

    </MainLayout>
  );
}
