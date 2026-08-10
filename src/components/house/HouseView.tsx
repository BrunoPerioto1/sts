import { useState, useEffect, useMemo } from "react";
import { HouseDetailsModal } from "./HouseDetailsModal";
import { HouseListItem } from "./HouseListItem";
import { HousesMetrics } from "./HouseMetrics";
import { HousesSearch, type HouseSort } from "./HouseSearch";
import { Buildings, Plus } from "@phosphor-icons/react";
import { HouseBalanceDto, HouseMetricsDto, getHouseBalances, getHouseMetrics, createHouse } from "@/api/routes/get-houses";
import { useToast } from "@/hooks/use-toast";
import { NovaTransacaoModal } from "./NovaTransacaoModal";
import { MovimentacaoModal } from "./MovimentacaoModal";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export function CasasApostaView() {
  const [houses, setHouses] = useState<HouseBalanceDto[]>([]);
  const [metrics, setMetrics] = useState<HouseMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [sort, setSort] = useState<HouseSort>("balance");
  const [view, setView] = useState<"list" | "cards">("list");
  const [selectedHouse, setSelectedHouse] = useState<HouseBalanceDto | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [isNovaTransacaoModalOpen, setIsNovaTransacaoModalOpen] = useState(false);
  const [isNovaCasaOpen, setIsNovaCasaOpen] = useState(false);
  const [novaCasaNome, setNovaCasaNome] = useState("");
  const [creatingHouse, setCreatingHouse] = useState(false);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [housesData, metricsData] = await Promise.all([getHouseBalances(), getHouseMetrics()]);
      setHouses(housesData);
      setMetrics(metricsData);
    } catch {
      toast({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCasaNome.trim()) return;
    setCreatingHouse(true);
    try {
      await createHouse(novaCasaNome.trim());
      setNovaCasaNome("");
      setIsNovaCasaOpen(false);
      toast({ title: "Casa cadastrada" });
      loadData();
    } catch (e: any) {
      toast({ title: "Erro", description: e?.response?.data?.message || "Falha ao cadastrar casa", variant: "destructive" });
    } finally {
      setCreatingHouse(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs opacity-45">
          {houses.length} casas · {withBalanceCount} com saldo
        </p>
        <div className="flex items-center gap-2">
          <Segmented
            options={[
              { value: "list", label: "Lista" },
              { value: "cards", label: "Cards" },
            ]}
            value={view}
            onChange={(v) => setView(v as "list" | "cards")}
          />
          <Button onClick={() => setIsNovaCasaOpen(true)} className="gap-2">
            <Plus size={16} /> Nova casa
          </Button>
        </div>
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
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-md">
          <Buildings size={30} className="opacity-35 mb-3" />
          <h3 className="text-base font-medium mb-1">Nenhuma casa encontrada</h3>
          <p className="text-[12.5px] opacity-55">
            {searchTerm ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
          </p>
        </div>
      ) : view === "list" ? (
        <div className="card elev-sm bg-card rounded-md p-[14px_16px] overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Casa</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Saldo</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Depositado</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Sacado</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Lucro</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right">Apostas</th>
                <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal">Última mov.</th>
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
                <p className="text-[22px] font-medium tabular-nums">{formatCurrency(house.houseBalance)}</p>
                <p className={`text-[12.5px] tabular-nums ${profit >= 0 ? "text-positive" : "text-negative"}`}>
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
            onClose={() => { setIsNovaTransacaoModalOpen(false); loadData(); }}
            houseId={selectedHouse.houseId}
          />
        </>
      )}

      <Dialog open={isNovaCasaOpen} onOpenChange={setIsNovaCasaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova casa</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateHouse} className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da casa</Label>
              <Input value={novaCasaNome} onChange={(e) => setNovaCasaNome(e.target.value)} placeholder="Ex: Bet365" autoFocus />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNovaCasaOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={creatingHouse}>{creatingHouse ? "Salvando…" : "Cadastrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
