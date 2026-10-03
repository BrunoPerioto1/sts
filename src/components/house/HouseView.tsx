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
import { metricsFromBalances } from "@/lib/house-metrics";
import { idleDays, staleDaysFrom } from "@/lib/house-activity";
import { groupHouses, houseMoney } from "@/lib/house-groups";
import { useMe } from "@/hooks/queries/use-me";
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria o useMemo que depende de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

export function CasasApostaView() {
  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();
  const { me } = useMe();
  const staleDays = staleDaysFrom(me?.staleHouseDays);

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;

  const [searchTerm, setSearchTerm] = useState("");
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  // Atalho do bloco "A conferir": lista só as casas com saldo real negativo.
  const [onlyShortfall, setOnlyShortfall] = useState(false);
  const [txInitialType, setTxInitialType] = useState<"ADJUSTMENT" | undefined>(undefined);
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
    if (houseIds.length > 0) list = list.filter((h) => houseIds.includes(h.houseId));
    if (onlyWithBalance) list = list.filter((h) => Number(h.realHouseBalance) > 0);
    if (onlyShortfall) list = list.filter((h) => Number(h.realHouseBalance) < 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      if (sort === "bets") return Number(b.totalBets) - Number(a.totalBets);
      if (sort === "idle") return idleDays(b.lastBetAt) - idleDays(a.lastBetAt);
      return Number(b.realHouseBalance) - Number(a.realHouseBalance);
    });
    return list;
  }, [houses, searchTerm, houseIds, onlyWithBalance, onlyShortfall, sort]);

  const maxBalance = useMemo(
    () => filteredHouses.reduce((max, h) => Math.max(max, houseMoney(h).available), 0),
    [filteredHouses]
  );
  // Agrupar só na visão geral: com "a conferir" ligado a lista já é o recorte.
  const groups = useMemo(
    () =>
      onlyShortfall
        ? [{ id: "shortfall", label: "A conferir", hint: "lance o saldo que o site da casa mostra, ou o depósito que faltou", houses: filteredHouses }]
        : groupHouses(filteredHouses, staleDays),
    [filteredHouses, onlyShortfall, staleDays]
  );
  const openStake = (houseIds.length > 0 ? filteredHouses : houses).reduce((sum, h) => sum + houseMoney(h).open, 0);

  const openTransaction = (house: HouseBalanceDto, initialType?: "ADJUSTMENT") => {
    setSelectedHouse(house);
    setTxInitialType(initialType);
    setIsNovaTransacaoModalOpen(true);
  };
  const houseOptions = useMemo(
    () => houses.map((h) => ({ id: h.houseId, name: h.houseName })),
    [houses]
  );

  // Com casas escolhidas os totais passam a ser os da seleção — somar todas
  // enquanto a lista mostra três casas seria um número que não explica a tela.
  const shownMetrics = houseIds.length > 0 ? metricsFromBalances(filteredHouses) : metrics;
  const withBalanceCount = (houseIds.length > 0 ? filteredHouses : houses).filter(
    (h) => Number(h.realHouseBalance) > 0
  ).length;

  return (
    <div className="space-y-4">
      {shownMetrics && (
        <HousesMetrics
          metrics={shownMetrics}
          withBalanceCount={withBalanceCount}
          openStake={openStake}
          isLoading={loading}
          conferirActive={onlyShortfall}
          onConferir={() => setOnlyShortfall((v) => !v)}
        />
      )}

      <HousesSearch
        searchTerm={searchTerm}
        onChange={setSearchTerm}
        houses={houseOptions}
        houseIds={houseIds}
        onHouseIdsChange={setHouseIds}
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
          description={searchTerm || houseIds.length > 0 ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
        />
      ) : (
        <div className="min-w-0 space-y-5">
          {groups.map((group) => (
            <section key={group.id} className="min-w-0">
              <div className="flex items-baseline gap-2 pb-1.5 border-b border-border">
                <span className="text-[13px] font-semibold tracking-tight">{group.label}</span>
                <span className="text-xs tabular-nums opacity-45">{group.houses.length}</span>
                <span className="text-xs opacity-35 truncate">· {group.hint}</span>
              </div>
              {group.houses.map((house) => (
                <HouseListItem
                  key={house.houseId}
                  house={house}
                  maxBalance={maxBalance}
                  staleDays={staleDays}
                  onViewDetails={() => { setSelectedHouse(house); setIsDetailsModalOpen(true); }}
                  onNewTransaction={() => openTransaction(house)}
                  onConciliate={() => openTransaction(house, "ADJUSTMENT")}
                  onOpenHistory={() => { setSelectedHouse(house); setIsMovimentacaoModalOpen(true); }}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {selectedHouse && (
        <>
          <HouseDetailsModal
            house={selectedHouse}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onNewTransaction={(h) => { setIsDetailsModalOpen(false); openTransaction(h); }}
          />
          <MovimentacaoModal
            isOpen={isMovimentacaoModalOpen}
            onClose={() => setIsMovimentacaoModalOpen(false)}
            casaNome={selectedHouse.houseName}
            houseId={selectedHouse.houseId}
            onNewTransaction={() => { setIsMovimentacaoModalOpen(false); openTransaction(selectedHouse); }}
          />
          <NovaTransacaoModal
            isOpen={isNovaTransacaoModalOpen}
            onClose={() => { setIsNovaTransacaoModalOpen(false); invalidate(); }}
            house={selectedHouse}
            initialType={txInitialType}
          />
        </>
      )}
    </div>
  );
}
