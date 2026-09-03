import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[13px]">
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
  const isProfit = realBalance >= 0;
  const totalBets = Number(house.totalBets);
  const hitRate = totalBets > 0 ? (Number(house.wonBets) / totalBets) * 100 : 0;
  const roi = Number(house.totalStake) > 0 ? (profit / Number(house.totalStake)) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
            <CaretLeft size={20} />
          </button>
          <h1 className="text-[19px] font-semibold truncate">{house.houseName}</h1>
        </div>
        <Badge variant={isProfit ? "won" : "lost"} className="shrink-0 uppercase">
          {isProfit ? "Lucro" : "Prejuízo"}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Saldo atual</p>
          <p className="text-[30px] font-semibold tabular-nums">{formatCurrency(Number(house.houseBalance))}</p>
          <p className={`text-[13px] font-medium tabular-nums mt-0.5 ${isProfit ? "text-positive" : "text-negative"}`}>
            {formatSignedCurrency(realBalance)} de lucro · ROI {roi.toFixed(1)}%
          </p>
        </div>

        <div className="mt-5 border-t border-border divide-y divide-border">
          <StatRow label="Saldo real" value={formatCurrency(realBalance)} valueClass={isProfit ? "text-positive" : "text-negative"} />
          <StatRow label="Depósitos" value={formatCurrency(Number(house.totalDeposit))} />
          <StatRow label="Saques" value={formatCurrency(Number(house.totalWithdrawal))} />
          <StatRow label="Apostas liquidadas" value={String(totalBets)} />
          <StatRow label="Taxa de acerto" value={`${hitRate.toFixed(1)}%`} />
          <StatRow label="Lucro em apostas" value={formatCurrency(profit)} valueClass={profit >= 0 ? "text-positive" : "text-negative"} />
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/10 px-4 pt-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <Button
          className="w-full min-h-[44px] bg-blue-600 text-white font-bold hover:opacity-90 active:opacity-90"
          onClick={() => onNewTransaction(house)}
        >
          Nova movimentação
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={() => navigate(`/bets?houseId=${house.houseId}`)}>
            Ver apostas
          </Button>
          <Button variant="outline" className="min-h-[44px]" onClick={() => onOpenHistory(house)}>
            Histórico
          </Button>
        </div>
      </div>
    </div>
  );
}
