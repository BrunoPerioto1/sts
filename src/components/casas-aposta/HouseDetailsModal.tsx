import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface HouseDetailsModalProps {
  house: HouseBalanceDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HouseDetailsModal({
  house,
  isOpen,
  onClose,
}: HouseDetailsModalProps) {
  if (!house) return null;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const profit = Number(house.totalBetProfit);
  const isProfit = profit >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            {house.houseName}
            <Badge
              variant={isProfit ? "default" : "destructive"}
              className="ml-2"
            >
              {isProfit ? "Lucro" : "Prejuízo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-8">
          {/* Saldos */}
          <section>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-primary" />
              Saldos
            </h4>
            <ul className="divide-y divide-border rounded-lg border">
              <li className="p-3">
                <div className="text-sm text-muted-foreground">Saldo Real</div>
                <div className="font-semibold text-lg">
                  {formatCurrency(house.realHouseBalance)}
                </div>
              </li>
              <li className="p-3">
                <div className="text-sm text-muted-foreground">Saldo Sistema</div>
                <div className="font-semibold text-lg">
                  {formatCurrency(house.houseBalance)}
                </div>
              </li>
            </ul>
          </section>

          {/* Apostas */}
          <section>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              Apostas
            </h4>
            <ul className="divide-y divide-border rounded-lg border">
              <li className="p-3">
                <div className="text-sm text-muted-foreground">
                  Total de Apostas
                </div>
                <div className="font-semibold text-lg">{house.totalBets}</div>
              </li>
              <li className="grid grid-cols-3 divide-x divide-border">
                <div className="p-3 text-center">
                  <div className="text-xs text-success mb-1">Ganhas</div>
                  <div className="font-semibold text-success">
                    {house.wonBets}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-xs text-destructive mb-1">Perdidas</div>
                  <div className="font-semibold text-destructive">
                    {house.lostBets}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Pendentes
                  </div>
                  <div className="font-semibold">{house.pendingBets}</div>
                </div>
              </li>
            </ul>
          </section>

          {/* Movimentação */}
          <section>
            <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              Movimentação Financeira
            </h4>
            <ul className="divide-y divide-border rounded-lg border">
              <li className="p-3">
                <div className="text-sm text-muted-foreground">
                  Total Apostado
                </div>
                <div className="font-semibold text-lg">
                  {formatCurrency(house.totalStake)}
                </div>
              </li>
              <li className="grid grid-cols-2 divide-x divide-border">
                <div className="p-3">
                  <div className="flex items-center gap-1 text-xs text-success mb-1">
                    <ArrowUpRight className="h-3 w-3" />
                    Depósitos
                  </div>
                  <div className="font-semibold text-success">
                    {formatCurrency(house.totalDeposit)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 text-xs text-destructive mb-1">
                    <ArrowDownRight className="h-3 w-3" />
                    Saques
                  </div>
                  <div className="font-semibold text-destructive">
                    {formatCurrency(house.totalWithdrawal)}
                  </div>
                </div>
              </li>
            </ul>
          </section>

          {/* Resumo */}
          <section>
            <h4 className="font-semibold text-foreground mb-3">Resumo</h4>
            <ul className="divide-y divide-border rounded-lg border">
              <li
                className={`p-3 ${
                  isProfit ? "bg-success/5" : "bg-destructive/5"
                }`}
              >
                <div className="text-sm text-muted-foreground">Lucro Total</div>
                <div
                  className={`font-bold text-xl ${
                    isProfit ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(profit)}
                </div>
              </li>
              <li className="p-3">
                <div className="text-sm text-muted-foreground">
                  Total de Transações
                </div>
                <div className="font-semibold text-lg">
                  {house.totalTransactions}
                </div>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
