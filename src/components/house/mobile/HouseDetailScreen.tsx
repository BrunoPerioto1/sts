import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowSquareOut, CaretLeft } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

interface HouseDetailScreenProps {
  house: HouseBalanceDto;
  onBack: () => void;
  onNewTransaction: (house: HouseBalanceDto) => void;
  onOpenHistory: (house: HouseBalanceDto) => void;
}

export function HouseDetailScreen({ house, onBack, onNewTransaction, onOpenHistory }: HouseDetailScreenProps) {
  const navigate = useNavigate();

  const profit = Number(house.totalBetProfit);
  const realBalance = Number(house.realHouseBalance);
  const isProfit = profit >= 0;
  const totalBets = Number(house.totalBets);
  const settledBets = Number(house.settledBets ?? Math.max(0, totalBets - Number(house.pendingBets)));
  // Sobre ganhas + perdidas: "encerradas" inclui cashout, que nao e' acerto nem erro.
  const decided = Number(house.wonBets) + Number(house.lostBets);
  const hitRate = decided > 0 ? (Number(house.wonBets) / decided) * 100 : 0;
  const roi = Number(house.totalStake) > 0 ? (profit / Number(house.totalStake)) * 100 : 0;

  // Portal pro body: essa tela e um overlay de tela cheia, mas era montada
  // dentro do <div className="space-y-4"> do CasasMobileView — e o space-y do
  // Tailwind poe margin-top: 1rem em todo filho depois do primeiro, inclusive
  // num elemento `fixed`. A margem empurrava o painel 1rem pra baixo e a lista
  // de casas aparecia nessa faixa no topo.
  return createPortal(
    <div
      className="animate-screen-in fixed inset-0 z-50 isolate flex flex-col overscroll-contain bg-background"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} aria-label="Voltar" className="press h-11 w-11 flex items-center justify-center -ml-2 text-zinc-400 hover:text-foreground">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold truncate">{house.houseName}</h1>
        </div>
        <Badge variant={isProfit ? "won" : "lost"} className="shrink-0 uppercase">
          {isProfit ? "Lucro" : "Prejuízo"}
        </Badge>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Saldo atual</p>
          <p className="text-3xl font-semibold tabular-nums">{formatCurrency(Math.max(0, realBalance))}</p>
          <p className={`text-sm font-medium tabular-nums mt-0.5 ${isProfit ? "text-positive" : "text-negative"}`}>
            {formatSignedCurrency(profit)} de lucro · ROI {roi.toFixed(1)}%
          </p>
        </div>

        <div className="mt-5 border-t border-border divide-y divide-border">
          {realBalance < 0 && <StatRow label="A conferir" value={formatCurrency(realBalance)} valueClass="text-negative" />}
          <StatRow label="Volume apostado" value={formatCurrency(Number(house.totalStake))} />
          <StatRow label="Depósitos" value={formatCurrency(Number(house.totalDeposit))} />
          <StatRow label="Saques" value={formatCurrency(Number(house.totalWithdrawal))} />
          <StatRow label="Apostas encerradas" value={String(settledBets)} />
          <StatRow label="Apostas abertas" value={String(house.pendingBets)} />
          <StatRow label="Taxa de acerto" value={`${hitRate.toFixed(1)}%`} />
          <StatRow label="Lucro em apostas" value={formatCurrency(profit)} valueClass={profit >= 0 ? "text-positive" : "text-negative"} />
        </div>
      </div>

      <div
        className="shrink-0 border-t border-foreground/10 px-4 pt-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <Button
          className="w-full min-h-[44px] bg-accent text-white font-bold hover:opacity-90 active:opacity-90"
          onClick={() => onNewTransaction(house)}
        >
          Nova movimentação
        </Button>
        <div className={house.websiteUrl ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
          <Button variant="outline" className="min-h-[44px]" onClick={() => navigate(`/bets?houseId=${house.houseId}&period=tudo`)}>
            Ver apostas
          </Button>
          <Button variant="outline" className="min-h-[44px]" onClick={() => onOpenHistory(house)}>
            Histórico
          </Button>
          {house.websiteUrl && (
            <Button asChild variant="outline" className="min-h-[44px] gap-1.5">
              <a href={house.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir site da ${house.houseName}`}>
                Site <ArrowSquareOut size={15} />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
