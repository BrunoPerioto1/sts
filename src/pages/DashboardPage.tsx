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
import { formatDayMonth } from "@/lib/format";

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

  // "Visão geral da sua performance · 22 ago — 21 out": o intervalo exato do
  // período escolhido, que a pílula só nomeia ("Mês passado").
  const subtitle = [
    "Visão geral da sua performance",
    ready && filters.startDate && filters.endDate
      ? `${formatDayMonth(filters.startDate)} — ${formatDayMonth(filters.endDate)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Filtros do topo só no desktop: o header do mobile é a própria tela
  // (mobileFullBleed) e lá os filtros ficam no DashboardFiltersSheet. Pílulas
  // baixas e discretas: rótulo apagado ("Casas:"), valor aceso.
  const pill = "h-8 flex items-center px-3 rounded-full border border-foreground/[0.08] bg-[rgb(var(--rgb-panel))] hover:border-foreground/20 transition-colors";
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {!hasNoBets && (
        <>
          <div className={pill}>
            <HouseMultiSelect className="text-[13px]" houses={houses} selected={filters.houseIds} onChange={setHouseIds} label="Casas:" />
          </div>
          <div className={pill}>
            <HouseMultiSelect
              className="text-[13px]"
              houses={sports}
              selected={filters.sportIds}
              onChange={setSportIds}
              label="Esportes:"
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
        className="h-8 rounded-full px-3 border-foreground/[0.08] bg-[rgb(var(--rgb-panel))]"
      />
    </div>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle={subtitle}
      // Largura toda da tela, com 32px de cada lado (a sidebar não fica
      // longe do conteúdo).
      wideGutter
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
