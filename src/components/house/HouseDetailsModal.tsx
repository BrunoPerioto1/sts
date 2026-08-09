import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HouseDetailsModalProps {
  house: HouseBalanceDto | null;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
}

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function Group({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-accent mb-2">{kicker}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">{children}</div>
    </div>
  );
}

function Pair({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="opacity-58">{label}</div>
      <div className={`font-medium tabular-nums ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}

export function HouseDetailsModal({ house, isOpen, onClose, onNewTransaction }: HouseDetailsModalProps) {
  const navigate = useNavigate();
  if (!house) return null;

  const profit = Number(house.totalBetProfit);
  const isProfit = Number(house.realHouseBalance) >= 0;
  const hitRate = Number(house.totalBets) > 0 ? (Number(house.wonBets) / Number(house.totalBets)) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {house.houseName}
            <Badge variant={isProfit ? "won" : "lost"}>
              {isProfit ? `Lucro ${formatCurrency(house.realHouseBalance)}` : `Prejuízo ${formatCurrency(house.realHouseBalance)}`}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-1">
          <div className="space-y-5">
            <Group kicker="Saldos">
              <Pair label="Saldo atual" value={formatCurrency(house.houseBalance)} />
              <Pair label="Saldo real" value={formatCurrency(house.realHouseBalance)} valueClass={isProfit ? "text-positive" : "text-negative"} />
            </Group>

            <Group kicker="Movimentação">
              <Pair label="Depósitos" value={formatCurrency(house.totalDeposit)} />
              <Pair label="Saques" value={formatCurrency(house.totalWithdrawal)} />
            </Group>
          </div>

          <div className="space-y-5">
            <Group kicker="Apostas">
              <Pair label="Liquidadas" value={String(house.totalBets)} />
              <Pair label="Taxa de acerto" value={`${hitRate.toFixed(1)}%`} />
              <Pair label="ROI" value={`${Number(house.totalStake) > 0 ? ((profit / Number(house.totalStake)) * 100).toFixed(1) : "0.0"}%`} valueClass={profit >= 0 ? "text-positive" : "text-negative"} />
              <Pair label="Lucro em apostas" value={formatCurrency(profit)} valueClass={profit >= 0 ? "text-positive" : "text-negative"} />
            </Group>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onNewTransaction?.(house)}>Nova movimentação</Button>
          <Button onClick={() => navigate(`/apostas?houseId=${house.houseId}`)}>Ver apostas</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
