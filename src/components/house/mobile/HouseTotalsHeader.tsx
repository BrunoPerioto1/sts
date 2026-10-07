import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";
import { formatInt, formatMoney, signColor } from "@/lib/format";
import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
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
      <SectionLabel as="p" className="px-0 mb-1">Saldo total</SectionLabel>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl font-semibold tabular-nums">
          <AnimatedNumber value={metrics.totalBalance} format={formatMoney} />
        </span>
        <span className={cn("text-sm font-medium tabular-nums", signColor(metrics.consolidatedProfit))}>
          Lucro {formatMoney(metrics.consolidatedProfit, { signed: true })}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-border mt-3 pt-3">
        <StatCard label="Depositado" value={formatMoney(metrics.totalDeposit)} />
        <StatCard label="Sacado" value={formatMoney(metrics.totalWithdrawal)} />
        {/* Casa no vermelho é lançamento faltando: vermelho só quando há. */}
        <StatCard
          label="A conferir"
          value={formatInt(metrics.negativeHouses)}
          color={metrics.negativeHouses > 0 ? "var(--color-danger)" : undefined}
          hint={metrics.negativeHouses > 0 && <span className="text-danger">{formatMoney(metrics.negativeAmount)}</span>}
        />
      </div>
    </div>
  );
}
