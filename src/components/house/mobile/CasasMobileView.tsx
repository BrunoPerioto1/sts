import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buildings, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useHouseBalances, useHouseMetrics } from "@/hooks/queries/use-houses";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { useHouseFilters } from "@/hooks/house/use-house-filters";
import { useHousePanel } from "@/hooks/house/use-house-panel";
import { actionToast } from "@/lib/action-toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { HouseRowMobile } from "./HouseRowMobile";
import { HouseTotalsHeader } from "./HouseTotalsHeader";
import { HouseFiltersBar } from "./HouseFiltersBar";
import { SortSheet } from "./SortSheet";
import { HouseActionsSheet } from "./HouseActionsSheet";
import { NovaMovimentacaoSheet } from "./NovaMovimentacaoSheet";
import { HouseDetailScreen } from "./HouseDetailScreen";
import { HouseHistoryScreen } from "./HouseHistoryScreen";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria os useMemo que dependem de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

interface CasasMobileViewProps {
  onCountChange?: (count: number) => void;
}

export function CasasMobileView({ onCountChange }: CasasMobileViewProps) {
  const navigate = useNavigate();

  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;
  const hasError = balancesQuery.isError || metricsQuery.isError;

  const filters = useHouseFilters(houses);
  const panel = useHousePanel(houses);

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [actionsHouse, setActionsHouse] = useState<HouseBalanceDto | null>(null);
  const [novaMovHouse, setNovaMovHouse] = useState<HouseBalanceDto | null>(null);

  // Puxar do topo recarrega saldos e métricas — a tela não tem botão de
  // recarregar e ficava só no cache até a próxima navegação. Desligado com uma
  // tela empilhada por cima: lá quem rola é o painel, não a página.
  const pull = usePullToRefresh(invalidate, !panel.panel);

  useEffect(() => {
    if (balancesQuery.isError || metricsQuery.isError) {
      actionToast.error({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas." });
    }
  }, [balancesQuery.isError, metricsQuery.isError]);

  useEffect(() => {
    onCountChange?.(houses.length);
  }, [houses.length, onCountChange]);

  const withBalanceCount = houses.filter((h) => Number(h.houseBalance) > 0).length;

  return (
    <div className="space-y-4">
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      <HouseTotalsHeader metrics={metrics} loading={loading} />

      <HouseFiltersBar
        loading={loading}
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        withBalanceCount={withBalanceCount}
        onlyWithBalance={filters.onlyWithBalance}
        onToggleWithBalance={filters.toggleOnlyWithBalance}
        onlyNegative={filters.onlyNegative}
        onToggleNegative={filters.toggleOnlyNegative}
        sort={filters.sort}
        onOpenSort={() => setSortSheetOpen(true)}
      />

      {loading ? (
        <div className="space-y-1" aria-busy="true" aria-label="Carregando casas">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-md" delay={i * 90} />
          ))}
        </div>
      ) : hasError ? (
        <div role="alert">
          <EmptyState
            bare
            icon={<WarningCircle size={28} />}
            title="Não foi possível carregar as casas"
            description="Verifique sua conexão e tente de novo."
            action={<Button variant="outline" onClick={() => invalidate()}>Tentar novamente</Button>}
          />
        </div>
      ) : filters.filteredHouses.length === 0 ? (
        <EmptyState
          icon={<Buildings size={30} />}
          title="Nenhuma casa encontrada"
          description={filters.hasFilters ? "Nenhuma casa corresponde aos filtros aplicados." : "Nenhuma casa com apostas ou movimentações ainda."}
          action={filters.hasFilters ? (
            <Button variant="outline" onClick={filters.clear}>Limpar filtros</Button>
          ) : undefined}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filters.filteredHouses.map((house, index) => (
            <HouseRowMobile
              key={house.houseId}
              index={index}
              house={house}
              onTap={() => panel.pushDetail(house)}
              onLongPress={() => setActionsHouse(house)}
            />
          ))}
        </div>
      )}

      <SortSheet open={sortSheetOpen} onOpenChange={setSortSheetOpen} value={filters.sort} onChange={filters.setSort} />

      <HouseActionsSheet
        house={actionsHouse}
        onClose={() => setActionsHouse(null)}
        onNewTransaction={(h) => {
          setActionsHouse(null);
          setNovaMovHouse(h);
        }}
        onViewBets={(h) => navigate(`/bets?houseId=${h.houseId}&period=tudo`)}
        onOpenHistory={(h) => {
          setActionsHouse(null);
          panel.pushHistory(h);
        }}
      />

      <NovaMovimentacaoSheet
        house={novaMovHouse}
        onClose={() => setNovaMovHouse(null)}
        onSuccess={() => {
          setNovaMovHouse(null);
          invalidate();
          actionToast.success({ title: "Movimentação registrada" });
        }}
      />

      {panel.panel === "detail" && panel.house && (
        <HouseDetailScreen
          house={panel.house}
          onBack={panel.pop}
          onNewTransaction={setNovaMovHouse}
          onOpenHistory={panel.pushHistory}
        />
      )}

      {panel.panel === "history" && panel.house && <HouseHistoryScreen house={panel.house} onBack={panel.pop} />}
    </div>
  );
}
