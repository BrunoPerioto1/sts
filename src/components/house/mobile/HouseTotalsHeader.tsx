import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { stagger } from "@/lib/motion";
import type { HouseMetricsDto } from "@/api/routes/get-houses";

export function HouseTotalsHeader({ metrics, loading }: { metrics: HouseMetricsDto | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando casas">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-40 rounded-lg" style={{ animationDelay: "80ms" }} />
        <div className="grid grid-cols-3 gap-3 border-t border-border mt-3 pt-3">
          {[1, 2, 3].map((i) => <div key={i} className="space-y-2"><div className="skeleton h-3 w-16 rounded" /><div className="skeleton h-5 w-14 rounded" /></div>)}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
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
  );
}
