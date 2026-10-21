import { useState, useEffect, useMemo } from "react";
import { HouseDetailsModal } from "./HouseDetailsModal";
import { HouseListItem } from "./HouseListItem";
import { HousesMetrics } from "./HouseMetrics";
import { HousesSearch, type HouseSegment, type HouseSegmentOption, type HouseSort } from "./HouseSearch";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowUpRight, Buildings, DownloadSimple } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useHouseBalances, useHouseMetrics } from "@/hooks/queries/use-houses";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { actionToast } from "@/lib/action-toast";
import { HEADER_BUTTON, HEADER_BUTTON_SECONDARY } from "@/components/ui/toolbar";
import { exportHousesCsv } from "@/lib/bet-exports";
import { formatInt } from "@/lib/format";
import { metricsFromBalances } from "@/lib/house-metrics";
import { idleDays, staleDaysFrom } from "@/lib/house-activity";
import { groupHouses, houseGroupId, houseMoney } from "@/lib/house-groups";
import { useMe } from "@/hooks/queries/use-me";
import { useProGate } from "@/hooks/queries/use-plan";
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { SaqueLoteModal } from "./SaqueLoteModal";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria o useMemo que depende de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

// Desktop. Monta o próprio MainLayout porque o CSV e o Saque em lote do
// cabeçalho dependem do filtro desta tela.
export function CasasApostaView() {
  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();
  const { me } = useMe();
  const proGate = useProGate();
  const staleDays = staleDaysFrom(me?.staleHouseDays);

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;

  const [searchTerm, setSearchTerm] = useState("");
  const [houseIds, setHouseIds] = useState<number[]>([]);
  const [segment, setSegment] = useState<HouseSegment>("all");
  const [txInitialType, setTxInitialType] = useState<"ADJUSTMENT" | undefined>(undefined);
  const [sort, setSort] = useState<HouseSort>("balance");
  const [selectedHouse, setSelectedHouse] = useState<HouseBalanceDto | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isNovaTransacaoModalOpen, setIsNovaTransacaoModalOpen] = useState(false);
  const [isSaqueLoteOpen, setIsSaqueLoteOpen] = useState(false);

  useEffect(() => {
    if (balancesQuery.isError || metricsQuery.isError) {
      actionToast.error({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas." });
    }
  }, [balancesQuery.isError, metricsQuery.isError]);

  // Busca e casas escolhidas valem pra todos os recortes; as contagens das
  // abas saem daqui, então batem com a lista ao clicar.
  const searchedHouses = useMemo(() => {
    const list = houses.filter((h) => h.houseName.toLowerCase().includes(searchTerm.toLowerCase()));
    return houseIds.length > 0 ? list.filter((h) => houseIds.includes(h.houseId)) : list;
  }, [houses, searchTerm, houseIds]);

  const segments = useMemo(() => {
    const matches: Record<HouseSegment, (h: HouseBalanceDto) => boolean> = {
      all: () => true,
      withBalance: (h) => houseMoney(h).available > 0,
      stopped: (h) => houseGroupId(h, staleDays) === "stopped",
      shortfall: (h) => Number(h.realHouseBalance) < 0,
    };
    const labels: Record<HouseSegment, string> = { all: "Todas", withBalance: "Com saldo", stopped: "Paradas", shortfall: "A conferir" };
    const options: HouseSegmentOption[] = (Object.keys(labels) as HouseSegment[]).map((value) => ({
      value,
      label: labels[value],
      count: searchedHouses.filter(matches[value]).length,
    }));
    return { matches, options };
  }, [searchedHouses, staleDays]);

  const filteredHouses = useMemo(() => {
    const list = searchedHouses.filter(segments.matches[segment]);
    return list.sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      if (sort === "bets") return Number(b.totalBets) - Number(a.totalBets);
      if (sort === "idle") return idleDays(b.lastBetAt) - idleDays(a.lastBetAt);
      return Number(b.realHouseBalance) - Number(a.realHouseBalance);
    });
  }, [searchedHouses, segments, segment, sort]);

  const maxBalance = useMemo(
    () => filteredHouses.reduce((max, h) => Math.max(max, houseMoney(h).available), 0),
    [filteredHouses]
  );
  // Agrupar só na visão geral: com "a conferir" ligado a lista já é o recorte.
  const groups = useMemo(
    () =>
      segment === "shortfall"
        ? [{ id: "shortfall", label: "A conferir", hint: "lance o saldo que o site da casa mostra, ou o depósito que faltou", houses: filteredHouses }]
        : groupHouses(filteredHouses, staleDays),
    [filteredHouses, segment, staleDays]
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
    (h) => houseMoney(h).available > 0
  ).length;

  const headerActions = (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={loading}
        onClick={() => proGate("csvExport", "Exportar CSV") && exportHousesCsv(filteredHouses)}
        className={HEADER_BUTTON_SECONDARY}
      >
        <DownloadSimple /> CSV
      </Button>
      <Button size="sm" disabled={loading} onClick={() => setIsSaqueLoteOpen(true)} className={HEADER_BUTTON}>
        <ArrowUpRight /> Saque em lote
      </Button>
    </>
  );

  return (
    <MainLayout
      title="Casas de apostas"
      subtitle={`${formatInt(houses.length)} casas`}
      inlineSubtitle
      actions={headerActions}
    >
      <div className="space-y-4">
        {shownMetrics && (
          <HousesMetrics
            metrics={shownMetrics}
            withBalanceCount={withBalanceCount}
            openStake={openStake}
            isLoading={loading}
            conferirActive={segment === "shortfall"}
            onConferir={() => setSegment((s) => (s === "shortfall" ? "all" : "shortfall"))}
          />
        )}
  
        <HousesSearch
          searchTerm={searchTerm}
          onChange={setSearchTerm}
          segments={segments.options}
          segment={segment}
          onSegmentChange={setSegment}
          houses={houseOptions}
          houseIds={houseIds}
          onHouseIdsChange={setHouseIds}
          sort={sort}
          onSortChange={setSort}
          isLoading={loading}
        />
  
        {filteredHouses.length === 0 && !loading ? (
          <EmptyState
            icon={<Buildings size={30} />}
            title="Nenhuma casa encontrada"
            description={searchTerm || houseIds.length > 0 || segment !== "all" ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
          />
        ) : (
          <div className="min-w-0 space-y-5">
            {groups.map((group) => (
              <section key={group.id} className="min-w-0">
                <div className="flex items-baseline gap-2 pt-3 pb-2 border-b border-border">
                  <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">{group.label}</span>
                  <span className="text-[11px] tabular-nums text-zinc-500">{group.houses.length}</span>
                  <span className="text-xs text-zinc-500 truncate">· {group.hint}</span>
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
  
        <SaqueLoteModal
          isOpen={isSaqueLoteOpen}
          onClose={() => { setIsSaqueLoteOpen(false); invalidate(); }}
          houses={houses}
        />
  
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
    </MainLayout>
  );
}
