import { HouseMetricsDto } from "@/api/routes/get-houses";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface HousesMetricsProps {
  metrics: HouseMetricsDto;
  // Quantas casas têm saldo — o número já é calculado na lista, não vale
  // recalcular aqui.
  withBalanceCount: number;
  isLoading?: boolean;
}

// Depositado e Sacado viraram um bloco só ("Movimentado"): separados ocupavam
// dois quintos do topo pra dizer "R$ 0,00" duas vezes. O detalhe da casa abre
// os dois.
export function HousesMetrics({ metrics, withBalanceCount, isLoading = false }: HousesMetricsProps) {
  const moved = Number(metrics.totalDeposit) + Number(metrics.totalWithdrawal);
  const profit = Number(metrics.consolidatedProfit);

  const blocks = [
    { label: "Saldo total", value: formatCurrency(metrics.totalBalance), hint: `em ${withBalanceCount} ${withBalanceCount === 1 ? "casa" : "casas"}` },
    {
      label: "Lucro consolidado",
      value: `${profit >= 0 ? "+" : ""}${formatCurrency(profit)}`,
      valueClass: profit >= 0 ? "text-positive" : "text-negative",
      hint: "desde o início",
    },
    {
      label: "Movimentado",
      value: formatCurrency(moved),
      hint: moved === 0 ? "nenhum depósito ou saque" : "depósitos + saques",
    },
    {
      label: "Casas negativas",
      value: `${metrics.negativeHouses} de ${metrics.totalHousesUsed}`,
      valueClass: metrics.negativeHouses > 0 ? "text-negative" : undefined,
      hint: "saldo real abaixo de zero",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-y border-border">
      {blocks.map((b, i) => (
        <div key={b.label} className={cn("py-3.5 pr-4", i > 0 && "md:pl-5 md:border-l border-border")}>
          <div className="text-[11px] uppercase tracking-wider opacity-45">{b.label}</div>
          {isLoading ? (
            <div className="h-7 w-24 my-1 rounded bg-foreground/10 animate-pulse" />
          ) : (
            <div className={cn("text-[26px] leading-tight font-medium tabular-nums", b.valueClass)}>{b.value}</div>
          )}
          <div className="text-xs opacity-40">{b.hint}</div>
        </div>
      ))}
    </div>
  );
}
