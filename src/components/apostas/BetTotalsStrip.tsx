import { useBetTotals, type BetsQueryFilters } from "@/hooks/apostas/use-bets-query";
import { usePerformanceColor } from "@/hooks/use-performance-color";
import { formatCurrencyCompact, formatSignedCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

function Cell({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-2.5 border-l border-foreground/[0.06] first:border-l-0">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500 whitespace-nowrap">{label}</p>
      <p className="text-base font-semibold tabular-nums whitespace-nowrap" style={{ color }}>{value}</p>
      {hint && <p className="text-[11px] text-zinc-500 whitespace-nowrap">{hint}</p>}
    </div>
  );
}

/**
 * Totais do filtro inteiro, acima da lista: o que se perguntava somando mês a
 * mês de cabeça ("quanto essa casa me deu esse mês?"). Mesmas bases do
 * dashboard — ROI sobre o liquidado, acerto sobre ganhas + perdidas.
 */
export function BetTotalsStrip({ filters }: { filters: BetsQueryFilters }) {
  const { data, isPending } = useBetTotals(filters);
  const color = usePerformanceColor();

  if (isPending) return <Skeleton className="h-[66px] rounded-xl" />;
  if (!data || data.count === 0) return null;

  const roi = data.roi * 100;
  return (
    <div className="flex overflow-x-auto rounded-xl border border-foreground/[0.07] bg-foreground/[0.015] [scrollbar-width:none]">
      <Cell
        label="Apostado"
        value={formatCurrencyCompact(data.staked)}
        hint={`${data.count} ${data.count === 1 ? "aposta" : "apostas"}${data.pending ? ` · ${data.pending} pendentes` : ""}`}
      />
      <Cell label="Lucro" value={formatSignedCurrency(data.profit)} color={color(data.profit)} />
      <Cell
        label="ROI"
        value={`${roi >= 0 ? "+" : ""}${roi.toFixed(1).replace(".", ",")}%`}
        color={color(roi)}
        hint="sobre o liquidado"
      />
      <Cell
        label="Acerto"
        value={data.won + data.lost > 0 ? `${(data.hitRate * 100).toFixed(1).replace(".", ",")}%` : "—"}
        hint={`${data.won} G · ${data.lost} P`}
      />
    </div>
  );
}
