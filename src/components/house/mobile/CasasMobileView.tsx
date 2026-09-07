import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowsDownUp, Buildings, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useHouseBalances, useHouseMetrics } from "@/hooks/queries/use-houses";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { actionToast } from "@/lib/action-toast";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { stagger } from "@/lib/motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { HouseRowMobile } from "./HouseRowMobile";
import { SortSheet, type HouseSortMobile } from "./SortSheet";
import { HouseActionsSheet } from "./HouseActionsSheet";
import { NovaMovimentacaoSheet } from "./NovaMovimentacaoSheet";
import { HouseDetailScreen } from "./HouseDetailScreen";
import { HouseHistoryScreen } from "./HouseHistoryScreen";

// Referencia estavel: `?? []` inline criaria array novo a cada render e
// invalidaria os useMemo que dependem de `houses`.
const EMPTY_HOUSES: HouseBalanceDto[] = [];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const balancesQuery = useHouseBalances();
  const metricsQuery = useHouseMetrics();
  const invalidate = useInvalidateBetData();

  const houses = balancesQuery.data ?? EMPTY_HOUSES;
  const metrics = metricsQuery.data ?? null;
  const loading = balancesQuery.isPending || metricsQuery.isPending;

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyWithBalance, setOnlyWithBalance] = useState(false);
  const [onlyNegative, setOnlyNegative] = useState(false);
  const [sort, setSort] = useState<HouseSortMobile>("balance");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const [actionsHouse, setActionsHouse] = useState<HouseBalanceDto | null>(null);
  const [novaMovHouse, setNovaMovHouse] = useState<HouseBalanceDto | null>(null);
  const panel = searchParams.get("panel");
  const panelHouseId = Number(searchParams.get("houseId"));

  // Puxar do topo recarrega saldos e métricas — a tela não tem botão de
  // recarregar e ficava só no cache até a próxima navegação. Desligado com uma
  // tela empilhada por cima: lá quem rola é o painel, não a página.
  const pull = usePullToRefresh(invalidate, !panel);

  useEffect(() => {
    if (balancesQuery.isError || metricsQuery.isError) {
      actionToast.error({ title: "Erro ao carregar dados", description: "Não foi possível carregar as informações das casas de apostas." });
    }
  }, [balancesQuery.isError, metricsQuery.isError]);

  useEffect(() => {
    onCountChange?.(houses.length);
  }, [houses.length, onCountChange]);

  const withBalanceCount = houses.filter((h) => Number(h.houseBalance) > 0).length;

  const filteredHouses = useMemo(() => {
    let list = houses.filter((h) => h.houseName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (onlyWithBalance) list = list.filter((h) => Number(h.houseBalance) > 0);
    if (onlyNegative) list = list.filter((h) => Number(h.realHouseBalance) < 0);
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.houseName.localeCompare(b.houseName);
      if (sort === "profit") return Number(b.totalBetProfit) - Number(a.totalBetProfit);
      if (sort === "bets") return Number(b.totalBets) - Number(a.totalBets);
      if (sort === "lastMovement") return new Date(b.lastMovementAt ?? 0).getTime() - new Date(a.lastMovementAt ?? 0).getTime();
      return Number(b.realHouseBalance) - Number(a.realHouseBalance);
    });
    return list;
  }, [houses, searchTerm, onlyWithBalance, onlyNegative, sort]);

  const openPanel = (house: HouseBalanceDto, kind: "detail" | "history") => {
    const next = new URLSearchParams(searchParams);
    next.set("houseId", String(house.houseId));
    next.set("panel", kind);
    setSearchParams(next, { state: { housePanel: true } });
  };
  const pushDetail = (house: HouseBalanceDto) => openPanel(house, "detail");
  const pushHistory = (house: HouseBalanceDto) => openPanel(house, "history");
  const popStack = () => {
    if (location.state?.housePanel) navigate(-1);
    else setSearchParams({}, { replace: true });
  };
  const currentHouse = houses.find((h) => h.houseId === panelHouseId);
  const hasHouseFilters = !!searchTerm || onlyNegative || onlyWithBalance;

  return (
    <div className="space-y-4">
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando casas">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-9 w-40 rounded-lg" style={{ animationDelay: "80ms" }} />
          <div className="grid grid-cols-3 gap-3 border-t border-border mt-3 pt-3">
            {[1, 2, 3].map((i) => <div key={i} className="space-y-2"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-5 w-14 rounded" /></div>)}
          </div>
        </div>
      ) : metrics && (
        <div className="animate-rise stagger" style={stagger(0)}>
          <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Saldo total</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-semibold tabular-nums">
              <AnimatedNumber value={metrics.totalBalance} format={formatCurrency} />
            </span>
            <span className={cn("text-sm font-medium tabular-nums", metrics.consolidatedProfit >= 0 ? "text-positive" : "text-negative")}>
              Lucro {formatSignedCurrency(metrics.consolidatedProfit)}
            </span>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border mt-3 pt-3">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Depositado</p>
              <p className="text-base font-medium tabular-nums">{formatCurrency(metrics.totalDeposit)}</p>
            </div>
            <div className="pl-3">
              <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Sacado</p>
              <p className="text-base font-medium tabular-nums">{formatCurrency(metrics.totalWithdrawal)}</p>
            </div>
            <div className="pl-3">
              <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Negativas</p>
              <p className={cn("text-base font-medium tabular-nums", metrics.negativeHouses > 0 && "text-negative")}>
                {metrics.negativeHouses}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="skeleton h-11 rounded-md" style={{ animationDelay: "140ms" }} />
          <div className="flex items-center gap-2">
            <div className="skeleton h-11 w-28 rounded-full" style={{ animationDelay: "200ms" }} />
            <div className="skeleton h-11 w-24 rounded-full" style={{ animationDelay: "260ms" }} />
            <div className="skeleton h-11 w-24 rounded-full ml-auto" style={{ animationDelay: "320ms" }} />
          </div>
        </div>
      ) : (
        <>
          <div className="relative animate-rise stagger" style={stagger(1)}>
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input placeholder="Buscar casa" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 min-h-[44px]" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-rise stagger [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={stagger(2)}>
            <button type="button" aria-pressed={onlyWithBalance} onClick={() => { setOnlyWithBalance((v) => !v); setOnlyNegative(false); }} className={cn("press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium", onlyWithBalance ? "bg-accent text-white" : "border border-white/10 bg-transparent text-zinc-400")}>
              Com saldo {withBalanceCount}
            </button>
            <button type="button" aria-pressed={onlyNegative} onClick={() => { setOnlyNegative((v) => !v); setOnlyWithBalance(false); }} className={cn("press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium", onlyNegative ? "bg-accent text-white" : "border border-white/10 bg-transparent text-zinc-400")}>
              Negativas
            </button>
            <button type="button" onClick={() => setSortSheetOpen(true)} className="press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium border border-white/10 bg-transparent text-zinc-400 flex items-center gap-1.5 ml-auto">
              <ArrowsDownUp size={13} /> {SORT_LABEL[sort]}
            </button>
          </div>
        </>
      )}

      {loading ? (
        <div className="space-y-1" aria-busy="true" aria-label="Carregando casas">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-md" delay={i * 90} />
          ))}
        </div>
      ) : balancesQuery.isError || metricsQuery.isError ? (
        <div role="alert">
          <EmptyState
            bare
            icon={<WarningCircle size={28} />}
            title="Não foi possível carregar as casas"
            description="Verifique sua conexão e tente de novo."
            action={<Button variant="outline" onClick={() => invalidate()}>Tentar novamente</Button>}
          />
        </div>
      ) : filteredHouses.length === 0 ? (
        <EmptyState
          icon={<Buildings size={30} />}
          title="Nenhuma casa encontrada"
          description={hasHouseFilters ? "Nenhuma casa corresponde aos filtros aplicados." : "Nenhuma casa com apostas ou movimentações ainda."}
          action={hasHouseFilters ? (
            <Button variant="outline" onClick={() => { setSearchTerm(""); setOnlyNegative(false); setOnlyWithBalance(false); }}>Limpar filtros</Button>
          ) : undefined}
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filteredHouses.map((house, index) => (
            <HouseRowMobile
              key={house.houseId}
              index={index}
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
        onViewBets={(h) => navigate(`/bets?houseId=${h.houseId}&period=tudo`)}
        onOpenHistory={(h) => {
          setActionsHouse(null);
          pushHistory(h);
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

      {panel === "detail" && currentHouse && (
        <HouseDetailScreen
          house={currentHouse}
          onBack={popStack}
          onNewTransaction={setNovaMovHouse}
          onOpenHistory={pushHistory}
        />
      )}

      {panel === "history" && currentHouse && <HouseHistoryScreen house={currentHouse} onBack={popStack} />}
    </div>
  );
}
