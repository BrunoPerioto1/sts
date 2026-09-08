import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Plus } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency, initialsOf } from "@/lib/format";

interface HouseDetailsModalProps {
  house: HouseBalanceDto | null;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
      <span className="text-sm opacity-55">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

// Painel ancorado à direita em vez de caixa no meio da tela: a lista continua
// visível atrás, então dá pra abrir uma casa depois da outra sem perder o lugar.
export function HouseDetailsModal({ house, isOpen, onClose, onNewTransaction }: HouseDetailsModalProps) {
  const navigate = useNavigate();
  if (!house) return null;

  const profit = Number(house.totalBetProfit);
  const realBalance = Number(house.realHouseBalance);
  const deposit = Number(house.totalDeposit);
  const withdrawal = Number(house.totalWithdrawal);
  const stake = Number(house.totalStake);
  const bets = Number(house.totalBets);
  const settledBets = Number(house.settledBets ?? Math.max(0, bets - Number(house.pendingBets)));
  const hitRate = settledBets > 0 ? (Number(house.wonBets) / settledBets) * 100 : 0;
  const roi = stake > 0 ? (profit / stake) * 100 : 0;
  const noMovement = deposit === 0 && withdrawal === 0;
  const signClass = (v: number) => (v >= 0 ? "text-positive" : "text-negative");
  // pt-BR: 70,0% e não 70.0%.
  const pct = (v: number) => `${v.toFixed(1).replace(".", ",")}%`;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed right-0 top-0 z-50 h-dvh w-full sm:w-[440px] border-l border-border bg-card flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200"
        >
          <div className="flex items-start gap-3 p-5 border-b border-border">
            <div className="w-9 h-9 rounded-[9px] bg-neutral-800 flex items-center justify-center text-xs font-medium shrink-0">
              {initialsOf(house.houseName)}
            </div>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-semibold uppercase tracking-wide truncate">
                {house.houseName}
              </DialogPrimitive.Title>
              <p className="text-xs opacity-45">
                {bets} {bets === 1 ? "aposta" : "apostas"} · {noMovement ? "sem movimentação registrada" : `${formatCurrency(deposit)} depositados`}
              </p>
            </div>
            <DialogPrimitive.Close className="opacity-50 hover:opacity-100 transition-opacity shrink-0" aria-label="Fechar">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider opacity-45">Saldo atual</div>
              <div className={cn("text-[34px] leading-tight font-medium tabular-nums", realBalance < 0 && "text-negative")}>
                {formatCurrency(house.houseBalance)}
              </div>
              <p className={cn("text-xs", noMovement ? signClass(profit) : "opacity-45")}>
                {noMovement
                  ? profit >= 0
                    ? "Todo o saldo vem de lucro em apostas"
                    : "Saldo negativo vindo só de apostas"
                  : `${formatCurrency(deposit)} depositados · ${formatCurrency(withdrawal)} sacados`}
              </p>
            </div>

            <div>
              <Row label="Saldo real" value={formatCurrency(realBalance)} valueClass={signClass(realBalance)} />
              <Row label="Depósitos" value={formatCurrency(deposit)} />
              <Row label="Saques" value={formatCurrency(withdrawal)} />
              <Row label="Lucro em apostas" value={formatCurrency(profit)} valueClass={signClass(profit)} />
              <Row label="Apostas encerradas" value={String(settledBets)} />
              <Row label="Apostas abertas" value={String(house.pendingBets)} />
              <Row label="Taxa de acerto" value={pct(hitRate)} />
              <Row label="ROI" value={`${roi >= 0 ? "+" : ""}${pct(roi)}`} valueClass={signClass(roi)} />
            </div>
          </div>

          <div className="flex gap-2 p-5 border-t border-border">
            <Button className="flex-1 gap-2 bg-accent text-white hover:bg-accent/90" onClick={() => onNewTransaction?.(house)}>
              <Plus size={16} /> Nova movimentação
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/bets?houseId=${house.houseId}&period=tudo`)}>
              Ver apostas
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
