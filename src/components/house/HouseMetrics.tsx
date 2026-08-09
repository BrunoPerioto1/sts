import { HouseMetricsDto } from "@/api/routes/get-houses";

interface HousesMetricsProps {
  metrics: HouseMetricsDto;
  formatCurrency: (val: number | string) => string;
  isLoading?: boolean;
}

export function HousesMetrics({ metrics, formatCurrency, isLoading = false }: HousesMetricsProps) {
  const blocks = [
    { label: "Saldo total", value: formatCurrency(metrics.totalBalance) },
    { label: "Depositado", value: formatCurrency(metrics.totalDeposit) },
    { label: "Sacado", value: formatCurrency(metrics.totalWithdrawal) },
    {
      label: "Lucro consolidado",
      value: `${metrics.consolidatedProfit >= 0 ? "+" : ""}${formatCurrency(metrics.consolidatedProfit)}`,
      valueClass: metrics.consolidatedProfit >= 0 ? "text-positive" : "text-negative",
    },
    {
      label: "Casas negativas",
      value: `${metrics.negativeHouses} de ${metrics.totalHousesUsed}`,
      valueClass: metrics.negativeHouses > 0 ? "text-negative" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {blocks.map((b) => (
        <div key={b.label} className="bg-sidebar rounded-md p-[12px_14px]">
          <div className="text-[10px] uppercase tracking-wide opacity-55 mb-1">{b.label}</div>
          {isLoading ? (
            <div className="h-5 w-16 rounded bg-foreground/10 animate-pulse" />
          ) : (
            <div className={`text-[19px] font-medium tabular-nums ${b.valueClass ?? ""}`}>{b.value}</div>
          )}
        </div>
      ))}
    </div>
  );
}
