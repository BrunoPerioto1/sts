import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsDownUp, Buildings, MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { HouseBalanceDto, HouseMetricsDto, getHouseBalances, getHouseMetrics } from "@/api/routes/get-houses";
import { actionToast } from "@/lib/action-toast";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HouseRowMobile } from "./HouseRowMobile";
import { SortSheet, type HouseSortMobile } from "./SortSheet";
import { HouseActionsSheet } from "./HouseActionsSheet";
import { NovaMovimentacaoSheet } from "./NovaMovimentacaoSheet";
import { HouseDetailScreen } from "./HouseDetailScreen";
import { HouseHistoryScreen } from "./HouseHistoryScreen";

type StackEntry = { kind: "detail" | "history"; house: HouseBalanceDto };

const SORT_LABEL: Record<HouseSortMobile, string> = {
  balance: "Saldo",
  profit: "Lucro",
  name: "Nome",
  bets: "Apostas",
  lastMovement: "Última mov.",
};

interface CasasMobileViewProps {
  onCountChange?: (count: number) => void;
}

export function CasasMobileView({ onCountChange }: CasasMobileViewProps) {
  const navigate = useNavigate();

  const [houses, setHouses] = useState<HouseBalanceDto[]>([]);
  const [metrics, setMetrics] = useState<HouseMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [onlyNegative, setOnlyNegative] = useState(false);
  const [sort, setSort] = useState<HouseSortMobile>("balance");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const [actionsHouse, setActionsHouse] = useState<HouseBalanceDto | null>(null);
  const [novaMovHouse, setNovaMovHouse] = useState<HouseBalanceDto | null>(null);
  const [stack, setStack] = useState<StackEntry[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [housesData, metricsData] = await Promise.all([getHouseBalances(), getHouseMetrics()]);
      setHouses(housesData);
      setMetrics(metricsData);
      setStack((prev) => prev.map((s) => ({ ...s, house: housesData.find((h) => h.houseId === s.house.houseId) ?? s.house })));
    } catch {
      actionToast.error({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onCountChange?.(houses.length);
  }, [houses.length, onCountChange]);

  const withBalanceCount = houses.filter((h) => Number(h.houseBalance) > 0).length;

  const filteredHouses = useMemo(() => {
    let list = houses.filter((h) => h.houseName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (onlyWithBalance) list = list.filter((h) => Number(h.houseBalance) > 0);
    if (onlyNegative) list = list.filter((h) => Number(h.houseBalance) < 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      if (sort === "bets") return Number(b.totalBets) - Number(a.totalBets);
      if (sort === "lastMovement") return new Date(b.lastMovementAt ?? 0).getTime() - new Date(a.lastMovementAt ?? 0).getTime();
      return Number(b.houseBalance) - Number(a.houseBalance);
    });
    return list;
  }, [houses, searchTerm, onlyWithBalance, onlyNegative, sort]);

  const pushDetail = (house: HouseBalanceDto) => setStack((prev) => [...prev, { kind: "detail", house }]);
  const pushHistory = (house: HouseBalanceDto) => setStack((prev) => [...prev, { kind: "history", house }]);
  const popStack = () => setStack((prev) => prev.slice(0, -1));
  const current = stack[stack.length - 1];

  return (
    <div className="space-y-4">
      {metrics && (
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Saldo total</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[28px] font-semibold tabular-nums">{formatCurrency(metrics.totalBalance)}</span>
            <span className={cn("text-[14px] font-medium tabular-nums", metrics.consolidatedProfit >= 0 ? "text-positive" : "text-negative")}>
              {formatSignedCurrency(metrics.consolidatedProfit)}
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border mt-3 pt-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Depositado</p>
              <p className="text-[15px] font-medium tabular-nums">{formatCurrency(metrics.totalDeposit)}</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Sacado</p>
              <p className="text-[15px] font-medium tabular-nums">{formatCurrency(metrics.totalWithdrawal)}</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Negativas</p>
              <p className={cn("text-[15px] font-medium tabular-nums", metrics.negativeHouses > 0 && "text-negative")}>
                {metrics.negativeHouses}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input placeholder="Buscar casa" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 min-h-[44px]" disabled={loading} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setOnlyWithBalance((v) => !v)}
          className={cn(
            "shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
            onlyWithBalance ? "bg-blue-600 text-white" : "border border-white/10 bg-transparent text-zinc-400"
          )}
        >
          Com saldo {withBalanceCount}
        </button>
        <button
          type="button"
          onClick={() => setOnlyNegative((v) => !v)}
          className={cn(
            "shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
            onlyNegative ? "bg-blue-600 text-white" : "border border-white/10 bg-transparent text-zinc-400"
          )}
        >
          Negativas
        </button>
        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          className="shrink-0 h-8 px-3.5 rounded-full text-[13px] font-medium border border-white/10 bg-transparent text-zinc-400 flex items-center gap-1.5 ml-auto"
        >
          <ArrowsDownUp size={13} /> {SORT_LABEL[sort]}
        </button>
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-md animate-pulse" style={{ background: "color-mix(in srgb, var(--color-text) 5%, transparent)" }} />
          ))}
        </div>
      ) : filteredHouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-md">
          <Buildings size={30} className="opacity-35 mb-3" />
          <h3 className="text-base font-medium mb-1">Nenhuma casa encontrada</h3>
          <p className="text-[12.5px] opacity-55 text-center px-6">
            {searchTerm ? "Nenhuma casa corresponde aos filtros aplicados." : "Não há casas de apostas cadastradas no momento."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filteredHouses.map((house) => (
            <HouseRowMobile
              key={house.houseId}
              house={house}
              onTap={() => pushDetail(house)}
              onLongPress={() => setActionsHouse(house)}
            />
          ))}
        </div>
      )}

      <SortSheet open={sortSheetOpen} onOpenChange={setSortSheetOpen} value={sort} onChange={setSort} />

      <HouseActionsSheet
        house={actionsHouse}
        onClose={() => setActionsHouse(null)}
        onNewTransaction={(h) => {
          setActionsHouse(null);
          setNovaMovHouse(h);
        }}
        onViewBets={(h) => navigate(`/bets?houseId=${h.houseId}`)}
        onOpenHistory={(h) => {
          setActionsHouse(null);
          pushHistory(h);
        }}
      />

      <NovaMovimentacaoSheet
        house={novaMovHouse}
        onClose={() => setNovaMovHouse(null)}
        onSuccess={async () => {
          setNovaMovHouse(null);
          await loadData();
          actionToast.success({ title: "Movimentação registrada" });
        }}
      />

      {current?.kind === "detail" && (
        <HouseDetailScreen
          house={current.house}
          onBack={popStack}
          onNewTransaction={setNovaMovHouse}
          onOpenHistory={pushHistory}
        />
      )}

      {current?.kind === "history" && <HouseHistoryScreen house={current.house} onBack={popStack} />}
    </div>
  );
}
