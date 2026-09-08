import { useState, useEffect, useMemo } from "react";
import { HouseDetailsModal } from "./HouseDetailsModal";
import { HouseListItem } from "./HouseListItem";
import { HousesMetrics } from "./HouseMetrics";
import { HousesSearch, type HouseSort } from "./HouseSearch";
import { EmptyState } from "@/components/ui/empty-state";
import { Buildings } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useHouseBalances, useHouseMetrics } from "@/hooks/queries/use-houses";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { actionToast } from "@/lib/action-toast";
import { exportHousesCsv } from "@/lib/bet-exports";
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria o useMemo que depende de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

export function CasasApostaView() {
  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [sort, setSort] = useState<HouseSort>("balance");
  const [selectedHouse, setSelectedHouse] = useState<HouseBalanceDto | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isNovaTransacaoModalOpen, setIsNovaTransacaoModalOpen] = useState(false);

  useEffect(() => {
    if (balancesQuery.isError || metricsQuery.isError) {
      actionToast.error({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas." });
    }
  }, [balancesQuery.isError, metricsQuery.isError]);

  const filteredHouses = useMemo(() => {
    let list = houses.filter((h) => h.houseName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (onlyWithBalance) list = list.filter((h) => Number(h.realHouseBalance) !== 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      return Number(b.realHouseBalance) - Number(a.realHouseBalance);
    });
    return list;
  }, [houses, searchTerm, onlyWithBalance, sort]);

  const maxBalance = useMemo(
    () => filteredHouses.reduce((max, h) => Math.max(max, Math.abs(Number(h.realHouseBalance))), 0),
    [filteredHouses]
  );
  const withBalanceCount = houses.filter((h) => Number(h.realHouseBalance) > 0).length;

  return (
    <div className="space-y-4">
      {metrics && <HousesMetrics metrics={metrics} withBalanceCount={withBalanceCount} isLoading={loading} />}

      <HousesSearch
        searchTerm={searchTerm}
        onChange={setSearchTerm}
        onlyWithBalance={onlyWithBalance}
        onOnlyWithBalanceChange={setOnlyWithBalance}
        sort={sort}
        onSortChange={setSort}
        onExportCsv={() => exportHousesCsv(filteredHouses)}
        isLoading={loading}
      />

      {filteredHouses.length === 0 && !loading ? (
        <EmptyState
          icon={<Buildings size={30} />}
          title="Nenhuma casa encontrada"
          description={searchTerm ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
        />
      ) : (
        <div className="min-w-0">
          {filteredHouses.map((house) => (
            <HouseListItem
              key={house.houseId}
              house={house}
              maxBalance={maxBalance}
              onViewDetails={() => { setSelectedHouse(house); setIsDetailsModalOpen(true); }}
              onNewTransaction={() => { setSelectedHouse(house); setIsNovaTransacaoModalOpen(true); }}
              onOpenHistory={() => { setSelectedHouse(house); setIsMovimentacaoModalOpen(true); }}
            />
          ))}
        </div>
      )}

      {selectedHouse && (
        <>
          <HouseDetailsModal
            house={selectedHouse}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onNewTransaction={(h) => { setIsDetailsModalOpen(false); setSelectedHouse(h); setIsNovaTransacaoModalOpen(true); }}
          />
          <MovimentacaoModal
            isOpen={isMovimentacaoModalOpen}
            onClose={() => setIsMovimentacaoModalOpen(false)}
            casaNome={selectedHouse.houseName}
            houseId={selectedHouse.houseId}
            onNewTransaction={() => { setIsMovimentacaoModalOpen(false); setIsNovaTransacaoModalOpen(true); }}
          />
          <NovaTransacaoModal
            isOpen={isNovaTransacaoModalOpen}
            onClose={() => { setIsNovaTransacaoModalOpen(false); invalidate(); }}
            house={selectedHouse}
          />
        </>
      )}
    </div>
  );
}
