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
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/format";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria o useMemo que depende de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

export function CasasApostaView() {
  const isMobile = useIsMobile();
  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [sort, setSort] = useState<HouseSort>("balance");
  const [view, setView] = useState<"list" | "cards">("list");

  useEffect(() => {
    if (isMobile) setView("cards");
  }, [isMobile]);
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
    if (onlyWithBalance) list = list.filter((h) => Number(h.houseBalance) > 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      return Number(b.houseBalance) - Number(a.houseBalance);
    });
    return list;
  }, [houses, searchTerm, onlyWithBalance, sort]);

  const withBalanceCount = houses.filter((h) => Number(h.houseBalance) > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs opacity-45">
          {houses.length} casas · {withBalanceCount} com saldo
        </p>
        {!isMobile && (
          <Segmented
            options={[
              { value: "list", label: "Lista" },
              { value: "cards", label: "Cards" },
            ]}
            value={view}
            onChange={(v) => setView(v as "list" | "cards")}
          />
        )}
      </div>

      {metrics && <HousesMetrics metrics={metrics} formatCurrency={formatCurrency} isLoading={loading} />}

      <HousesSearch
        searchTerm={searchTerm}
        onChange={setSearchTerm}
        onlyWithBalance={onlyWithBalance}
        onOnlyWithBalanceChange={setOnlyWithBalance}
        sort={sort}
        onSortChange={setSort}
        isLoading={loading}
      />

      {filteredHouses.length === 0 && !loading ? (
        <EmptyState
          icon={<Buildings size={30} />}
          title="Nenhuma casa encontrada"
          description={searchTerm ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
        />
      ) : view === "list" ? (
        <div className="card elev-sm bg-card rounded-md p-[14px_16px] overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal">Casa</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Saldo</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Depositado</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Sacado</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Lucro</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Apostas</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal">Última mov.</th>
                <th className="w-11"></th>
              </tr>
            </thead>
            <tbody>
              {filteredHouses.map((house) => (
                <HouseListItem
                  key={house.houseId}
                  house={house}
                  onViewDetails={() => { setSelectedHouse(house); setIsDetailsModalOpen(true); }}
                  onNewTransaction={() => { setSelectedHouse(house); setIsNovaTransacaoModalOpen(true); }}
                  onOpenHistory={() => { setSelectedHouse(house); setIsMovimentacaoModalOpen(true); }}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHouses.map((house) => {
            const profit = Number(house.totalBetProfit);
            return (
              <div key={house.houseId} className="card elev-sm bg-card rounded-md p-[14px_16px] flex flex-col gap-2">
                <p className="font-medium">{house.houseName}</p>
                <p className="text-2xl font-medium tabular-nums">{formatCurrency(house.houseBalance)}</p>
                <p className={`text-sm tabular-nums ${profit >= 0 ? "text-positive" : "text-negative"}`}>
                  {profit >= 0 ? "+" : ""}{formatCurrency(profit)} · {house.totalBets} apostas
                </p>
                <div className="flex gap-2 mt-1">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedHouse(house); setIsDetailsModalOpen(true); }}>Detalhes</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedHouse(house); setIsNovaTransacaoModalOpen(true); }}>Movimentar</Button>
                </div>
              </div>
            );
          })}
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
          <MovimentacaoModal isOpen={isMovimentacaoModalOpen} onClose={() => setIsMovimentacaoModalOpen(false)} casaNome={selectedHouse.houseName} houseId={selectedHouse.houseId} />
          <NovaTransacaoModal
            isOpen={isNovaTransacaoModalOpen}
            onClose={() => { setIsNovaTransacaoModalOpen(false); invalidate(); }}
            houseId={selectedHouse.houseId}
          />
        </>
      )}
    </div>
  );
}
