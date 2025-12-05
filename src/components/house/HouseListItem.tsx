import { Button } from "@/components/ui/button";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { Eye, Wallet, Coins, TrendingUp, BarChart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HouseListItemProps {
  house: HouseBalanceDto;
  onViewDetails?: (houseId: number) => void;
  onOpenHistory?: (house: HouseBalanceDto) => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
  index?: number; 
}

export function HouseListItem({
  house,
  onViewDetails,
  onOpenHistory,
  onNewTransaction,
  index = 0,
}: HouseListItemProps) {
  const profit = Number(house.totalBetProfit);
  const isProfit = profit >= 0;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between rounded-xl border border-border p-5 shadow-sm",
        index % 2 === 0 ? "bg-card" : "bg-muted/10"
      )}
    >
      {/* Nome da casa */}
      <div className="flex-1 mb-4 md:mb-0">
        <p className="text-lg md:text-xl font-bold text-foreground">{house.houseName}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 text-center text-sm">
        <MetricItem
          icon={<Wallet className="h-5 w-5 text-blue-500" />}
          label="Saldo"
          value={formatCurrency(house.houseBalance)}
        />
        <MetricItem
          icon={<Coins className="h-5 w-5 text-amber-500" />}
          label="Apostado"
          value={formatCurrency(house.totalStake)}
          valueClass="text-amber-600 font-bold"
        />
        <MetricItem
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Lucro"
          value={formatCurrency(profit)}
          valueClass={isProfit ? "text-success font-bold" : "text-destructive font-bold"}
        />
        <MetricItem
          icon={<BarChart className="h-5 w-5 text-purple-500" />}
          label="Apostas"
          value={house.totalBets.toString()}
          valueClass="font-bold"
        />
      </div>

      {/* Botões */}
      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col md:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails?.(house.houseId)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNewTransaction?.(house)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenHistory?.(house)}
        >
          Histórico
        </Button>
      </div>
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className={cn("text-sm md:text-base font-bold", valueClass)}>{value}</div>
    </div>
  );
}
